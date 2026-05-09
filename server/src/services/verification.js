const Tesseract = require('tesseract.js');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

/**
 * Extract text from an uploaded file (PDF or image).
 */
async function extractText(filePath, mimetype) {
  if (mimetype === 'application/pdf') {
    const dataBuffer = fs.readFileSync(filePath);
    // Handle cases where pdf-parse might be exported as a default or direct function
    const parser = typeof pdfParse === 'function' ? pdfParse : pdfParse.default;
    if (typeof parser !== 'function') {
      throw new Error('PDF parser is not properly loaded as a function');
    }
    const pdfData = await parser(dataBuffer);
    return pdfData.text;
  }

  // Image files — use Tesseract OCR
  const { data: { text } } = await Tesseract.recognize(filePath, 'eng');
  return text;
}

/**
 * Use Gemma to verify form claims against extracted offer letter text.
 * Returns { verified, confidence, discrepancies }
 */
async function verifyWithGemma(extractedText, formData) {
  const apiKey = process.env.GEMMA_API_KEY;
  if (!apiKey) {
    console.warn('GEMMA_API_KEY not set — skipping AI verification');
    return { verified: false, confidence: 50, discrepancies: ['API key not configured'] };
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `You are an offer letter verification assistant. A user has submitted compensation data along with their offer letter. Your job is to compare the user's claimed data against the text extracted from their offer letter.

USER'S CLAIMED DATA:
- Company: ${formData.company}
- Role: ${formData.role}
- Level: ${formData.level}
- Location: ${formData.location}
- Base Salary: $${formData.base_salary}
- Bonus: $${formData.bonus}
- Stock (yearly): $${formData.stock}

EXTRACTED OFFER LETTER TEXT:
---
${extractedText.substring(0, 4000)}
---

INSTRUCTIONS:
1. Compare the claimed data against the offer letter text.
2. Check if company name, role/title, compensation figures roughly match.
3. Minor formatting differences are acceptable (e.g. "Software Engineer" vs "Software Eng.").
4. If the offer letter text is unreadable or clearly not an offer letter, set verified to false.

Respond ONLY with valid JSON in this exact format, no markdown, no explanation:
{"verified": true, "confidence": 85, "discrepancies": ["base salary shows $175,000 not $180,000"]}

Where:
- verified: boolean, true if the data broadly matches
- confidence: number 0-100, your confidence in the verification
- discrepancies: array of strings describing any mismatches (empty array if none)`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemma-3-27b-it',
      contents: prompt,
    });

    const text = response.text.trim();
    // Try to parse the JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        verified: !!result.verified,
        confidence: Math.min(100, Math.max(0, Number(result.confidence) || 50)),
        discrepancies: Array.isArray(result.discrepancies) ? result.discrepancies : []
      };
    }

    console.warn('Gemma returned non-JSON response:', text);
    return { verified: false, confidence: 40, discrepancies: ['AI returned unparseable response'] };
  } catch (error) {
    console.error('Gemma verification error:', error.message);
    return { verified: false, confidence: 30, discrepancies: [`AI verification failed: ${error.message}`] };
  }
}

module.exports = { extractText, verifyWithGemma };
