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
    
    let text = '';
    // Handle classic pdf-parse (function)
    if (typeof pdfParse === 'function') {
      const data = await pdfParse(dataBuffer);
      text = data.text;
    } 
    // Handle modern pdf-parse (class-based, e.g. version 2.x)
    else if (pdfParse.PDFParse || (pdfParse.default && pdfParse.default.PDFParse)) {
      const PDFParseClass = pdfParse.PDFParse || pdfParse.default.PDFParse;
      const instance = new PDFParseClass({ data: dataBuffer });
      const result = await instance.getText();
      text = result.text;
    }
    // Handle default export as a function
    else if (pdfParse.default && typeof pdfParse.default === 'function') {
      const data = await pdfParse.default(dataBuffer);
      text = data.text;
    }
    else {
      throw new Error('PDF parser is not properly loaded. Supported patterns (function or PDFParse class) not found.');
    }
    
    return text;
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

  const getCurrency = (loc) => {
    if (loc.includes('India')) return 'INR (₹)';
    if (loc.includes('UK') || loc.includes('London')) return 'GBP (£)';
    if (loc.includes('Europe') || loc.includes('Germany')) return 'EUR (€)';
    if (loc.includes('Canada')) return 'CAD ($)';
    return 'USD ($)';
  };

  const currency = getCurrency(formData.location);

  const prompt = `You are an offer letter verification assistant. A user has submitted compensation data along with their offer letter. Your job is to compare the user's claimed data against the text extracted from their offer letter.
Note: The currency is ${currency}.

USER'S CLAIMED DATA:
- Company: ${formData.company}
- Role: ${formData.role}
- Level: ${formData.level}
- Location: ${formData.location}
- Base Salary: ${formData.base_salary} (${currency})
- Bonus: ${formData.bonus} (${currency})
- Stock (yearly): ${formData.stock} (${currency})

EXTRACTED OFFER LETTER TEXT:
---
${extractedText.substring(0, 4000)}
---

INSTRUCTIONS:
1. Compare the claimed data against the offer letter text.
2. Check if company name, role/title, and compensation figures (in ${currency}) roughly match.
3. Minor formatting differences are acceptable (e.g. "Software Engineer" vs "Software Eng.").
4. If the offer letter text is unreadable or clearly not an offer letter, set verified to false.

Respond ONLY with valid JSON in this exact format, no markdown, no explanation:
{"verified": true, "confidence": 85, "discrepancies": ["base salary shows 175,000 not 180,000"]}

Where:
- verified: boolean, true if the data broadly matches
- confidence: number 0-100, your confidence in the verification
- discrepancies: array of strings describing any mismatches (empty array if none)`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
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
