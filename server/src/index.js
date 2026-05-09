const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');

const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { extractText, verifyWithGemma } = require('./services/verification');

// Multer config — store uploads temporarily
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const upload = multer({
  dest: uploadsDir,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only PDF, PNG, and JPG files are allowed'));
  }
});

// Zod Schema for strict validation
const IngestSalarySchema = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  level: z.string().min(1),
  location: z.string().min(1),
  experience_years: z.number().min(0),
  base_salary: z.number().min(0),
  bonus: z.number().optional().default(0),
  stock: z.number().optional().default(0),
  confidence_score: z.number().min(0).max(100).default(80)
});

// Standardized Level Mapping based on YoE
function getStandardizedLevel(experienceYears) {
  if (experienceYears < 2) return 'L1';
  if (experienceYears < 5) return 'L2';
  if (experienceYears < 10) return 'L3';
  if (experienceYears < 15) return 'L4';
  return 'L5';
}

const LEVEL_ORDER = { 'L1': 1, 'L2': 2, 'L3': 3, 'L4': 4, 'L5': 5 };
const LEVEL_LABELS = {
  'L1': 'L1 (0-2 YoE)',
  'L2': 'L2 (2-5 YoE)',
  'L3': 'L3 (5-10 YoE)',
  'L4': 'L4 (10-15 YoE)',
  'L5': 'L5 (15+ YoE)',
};

// 1. POST /ingest-salary (supports optional file upload)
app.post('/api/ingest-salary', upload.single('offer_letter'), async (req, res) => {
  let tempFilePath = null;

  try {
    // When using multipart/form-data, numbers come as strings — parse them
    const body = { ...req.body };
    ['experience_years', 'base_salary', 'bonus', 'stock', 'confidence_score'].forEach(key => {
      if (body[key] !== undefined) body[key] = Number(body[key]);
    });

    const validatedData = IngestSalarySchema.parse(body);
    
    const normalizedCompany = validatedData.company.trim().toLowerCase();
    const total_compensation = validatedData.base_salary + validatedData.bonus + validatedData.stock;
    const standardized_level = getStandardizedLevel(validatedData.experience_years);

    let confidence_score = validatedData.confidence_score;
    let verification = null;

    // 1. If a file was uploaded, run OCR + Gemma verification
    if (req.file) {
      tempFilePath = req.file.path;
      console.log(`Processing uploaded file: ${req.file.originalname} (${req.file.mimetype})`);

      try {
        const extractedText = await extractText(tempFilePath, req.file.mimetype);
        console.log(`Extracted ${extractedText.length} characters from offer letter`);

        verification = await verifyWithGemma(extractedText, {
          company: validatedData.company,
          role: validatedData.role,
          level: validatedData.level,
          location: validatedData.location,
          base_salary: validatedData.base_salary,
          bonus: validatedData.bonus,
          stock: validatedData.stock,
        });

        console.log(`Gemma verification: verified=${verification.verified}, confidence=${verification.confidence}`);
        
        // REJECT if Gemma says it's faulty/fake
        if (!verification.verified) {
          console.warn('REJECTED submission due to AI verification failure:');
          console.warn('Discrepancies:', verification.discrepancies.join(', '));
          
          return res.status(403).json({ 
            error: 'Verification failed', 
            details: 'The uploaded offer letter does not match your submitted data or appears to be invalid.',
            discrepancies: verification.discrepancies 
          });
        }
        
        confidence_score = verification.confidence;
      } catch (verifyErr) {
        console.error('Verification pipeline error:', verifyErr.message);
        return res.status(500).json({ error: 'Verification error', details: verifyErr.message });
      }
    } 
    // 2. If NO offer letter, check for >20% deviation from company-level average
    else {
      const stats = await prisma.salary.aggregate({
        _avg: { total_compensation: true },
        _count: true,
        where: { 
          company: normalizedCompany, 
          level: validatedData.level 
        }
      });

      if (stats._count > 0 && stats._avg.total_compensation) {
        const avg = stats._avg.total_compensation;
        const deviation = Math.abs(total_compensation - avg) / avg;
        
        if (deviation > 0.2) {
          return res.status(403).json({ 
            error: 'Data outlier detected', 
            details: `Your submitted compensation deviates significantly (>20%) from the average for ${validatedData.company} - ${validatedData.level}. Please provide an offer letter for verification to add this record.`
          });
        }
      }
      
      verification = { verified: false, confidence: 80, discrepancies: ['No offer letter provided, but passed deviation check'] };
    }

    const salary = await prisma.salary.create({
      data: {
        company: normalizedCompany,
        role: validatedData.role,
        level: validatedData.level,
        standardized_level,
        location: validatedData.location,
        experience_years: validatedData.experience_years,
        base_salary: validatedData.base_salary,
        bonus: validatedData.bonus,
        stock: validatedData.stock,
        total_compensation,
        confidence_score
      }
    });

    res.status(201).json({ 
      success: true, 
      data: salary,
      verification
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid data', details: error.errors });
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    // Clean up temp file
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  }
});

// 2. GET /salaries (Core API)
app.get('/api/salaries', async (req, res) => {
  try {
    const { company, role, level, location } = req.query;
    
    // Build dynamic where clause based on provided filters
    const where = {};
    if (company) where.company = { contains: company.trim().toLowerCase() };
    if (role) where.role = { contains: role, mode: 'insensitive' };
    if (level) where.level = level;
    if (location) where.location = { contains: location, mode: 'insensitive' };

    const salaries = await prisma.salary.findMany({
      where,
      orderBy: { total_compensation: 'desc' }
    });

    res.json({ success: true, data: salaries });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 3. GET /company/:company
app.get('/api/company/:company', async (req, res) => {
  try {
    const normalizedCompany = req.params.company.trim().toLowerCase();

    const salaries = await prisma.salary.findMany({
      where: { company: normalizedCompany },
      orderBy: { total_compensation: 'desc' }
    });

    if (salaries.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Compute Median
    const totals = salaries.map(s => s.total_compensation).sort((a, b) => a - b);
    const mid = Math.floor(totals.length / 2);
    const medianTC = totals.length % 2 !== 0 ? totals[mid] : (totals[mid - 1] + totals[mid]) / 2;

    // Compute Level Distribution
    const levelDistribution = salaries.reduce((acc, curr) => {
      acc[curr.level] = (acc[curr.level] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        salaries,
        analytics: {
          median_total_compensation: medianTC,
          level_distribution: levelDistribution,
          total_records: salaries.length
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 4. GET /compare
app.get('/api/compare', async (req, res) => {
  try {
    const { id1, id2 } = req.query;
    if (!id1 || !id2) return res.status(400).json({ error: 'Both id1 and id2 are required' });

    const [salary1, salary2] = await Promise.all([
      prisma.salary.findUnique({ where: { id: id1 } }),
      prisma.salary.findUnique({ where: { id: id2 } })
    ]);

    if (!salary1 || !salary2) {
      return res.status(404).json({ error: 'One or both salaries not found' });
    }

    res.json({
      success: true,
      data: {
        salary1,
        salary2,
        comparison: {
          base_difference: Math.abs(salary1.base_salary - salary2.base_salary),
          bonus_difference: Math.abs(salary1.bonus - salary2.bonus),
          stock_difference: Math.abs(salary1.stock - salary2.stock),
          total_difference: Math.abs(salary1.total_compensation - salary2.total_compensation),
          // For level diff, simple string comparison since actual L3 vs L4 math depends on company logic
          level_difference: salary1.level === salary2.level ? 'Same Level' : 'Different Levels'
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 5. GET /top-companies
app.get('/api/top-companies', async (req, res) => {
  try {
    const { level } = req.query;
    const salaries = await prisma.salary.findMany();

    // Filter by standardized level if provided
    const filtered = level
      ? salaries.filter(s => (s.standardized_level || getStandardizedLevel(s.experience_years)) === level)
      : salaries;

    // Group by company
    const companyMap = {};
    filtered.forEach(s => {
      if (!companyMap[s.company]) {
        companyMap[s.company] = { totals: [], bases: [], bonuses: [], stocks: [] };
      }
      companyMap[s.company].totals.push(s.total_compensation);
      companyMap[s.company].bases.push(s.base_salary);
      companyMap[s.company].bonuses.push(s.bonus);
      companyMap[s.company].stocks.push(s.stock);
    });

    const avg = arr => arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length;

    // Compute median TC for each company
    const companies = Object.entries(companyMap).map(([name, data]) => {
      data.totals.sort((a, b) => a - b);
      const mid = Math.floor(data.totals.length / 2);
      const medianTC = data.totals.length % 2 !== 0 ? data.totals[mid] : (data.totals[mid - 1] + data.totals[mid]) / 2;
      return {
        name,
        medianTC,
        avgBase: Math.round(avg(data.bases)),
        avgBonus: Math.round(avg(data.bonuses)),
        avgStock: Math.round(avg(data.stocks)),
        count: data.totals.length,
      };
    });

    // Sort by median TC descending and add rank
    companies.sort((a, b) => b.medianTC - a.medianTC);
    companies.forEach((c, i) => {
      c.rank = i + 1;
      c.logo = c.name.substring(0, 2).toUpperCase();
    });

    res.json({ success: true, data: companies });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 6. GET /analytics
app.get('/api/analytics', async (req, res) => {
  try {
    const salaries = await prisma.salary.findMany();

    // Compensation by Level
    const levelMap = {};
    salaries.forEach(s => {
      if (!levelMap[s.level]) levelMap[s.level] = [];
      levelMap[s.level].push(s.total_compensation);
    });

    const compensationByLevel = Object.entries(levelMap).map(([level, totals]) => {
      totals.sort((a, b) => a - b);
      const mid = Math.floor(totals.length / 2);
      const median = totals.length % 2 !== 0 ? totals[mid] : (totals[mid - 1] + totals[mid]) / 2;
      return { level, median, count: totals.length };
    }).sort((a, b) => a.median - b.median);

    // TC Distribution (buckets)
    const buckets = [
      { range: '<100k', min: 0, max: 100000 },
      { range: '100-200k', min: 100000, max: 200000 },
      { range: '200-300k', min: 200000, max: 300000 },
      { range: '300-400k', min: 300000, max: 400000 },
      { range: '400-500k', min: 400000, max: 500000 },
      { range: '500k+', min: 500000, max: Infinity },
    ];

    const tcDistribution = buckets.map(b => ({
      range: b.range,
      count: salaries.filter(s => s.total_compensation >= b.min && s.total_compensation < b.max).length
    }));

    res.json({
      success: true,
      data: { compensationByLevel, tcDistribution }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 7. GET /standardized-levels — Average compensation per company per standardized level
app.get('/api/standardized-levels', async (req, res) => {
  try {
    const salaries = await prisma.salary.findMany();

    // Group by company → standardized_level
    const companyLevelMap = {};
    salaries.forEach(s => {
      // For records without standardized_level (legacy), compute it
      const stdLevel = s.standardized_level || getStandardizedLevel(s.experience_years);
      const key = `${s.company}::${stdLevel}`;
      if (!companyLevelMap[key]) {
        companyLevelMap[key] = {
          company: s.company,
          standardized_level: stdLevel,
          base_salaries: [],
          bonuses: [],
          stocks: [],
          totals: [],
          company_levels: new Set(),
        };
      }
      companyLevelMap[key].base_salaries.push(s.base_salary);
      companyLevelMap[key].bonuses.push(s.bonus);
      companyLevelMap[key].stocks.push(s.stock);
      companyLevelMap[key].totals.push(s.total_compensation);
      companyLevelMap[key].company_levels.add(s.level);
    });

    const avg = arr => arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length;

    // Build response grouped by company
    const companyData = {};
    Object.values(companyLevelMap).forEach(group => {
      if (!companyData[group.company]) {
        companyData[group.company] = { company: group.company, levels: [] };
      }
      companyData[group.company].levels.push({
        standardized_level: group.standardized_level,
        label: LEVEL_LABELS[group.standardized_level] || group.standardized_level,
        company_levels_mapped: Array.from(group.company_levels),
        count: group.totals.length,
        avg_base: Math.round(avg(group.base_salaries)),
        avg_bonus: Math.round(avg(group.bonuses)),
        avg_stock: Math.round(avg(group.stocks)),
        avg_total: Math.round(avg(group.totals)),
      });
    });

    // Sort levels within each company
    Object.values(companyData).forEach(c => {
      c.levels.sort((a, b) => (LEVEL_ORDER[a.standardized_level] || 0) - (LEVEL_ORDER[b.standardized_level] || 0));
    });

    // Also compute cross-company averages per standardized level
    const crossCompany = {};
    salaries.forEach(s => {
      const stdLevel = s.standardized_level || getStandardizedLevel(s.experience_years);
      if (!crossCompany[stdLevel]) {
        crossCompany[stdLevel] = { base: [], bonus: [], stock: [], total: [] };
      }
      crossCompany[stdLevel].base.push(s.base_salary);
      crossCompany[stdLevel].bonus.push(s.bonus);
      crossCompany[stdLevel].stock.push(s.stock);
      crossCompany[stdLevel].total.push(s.total_compensation);
    });

    const marketAverages = Object.entries(crossCompany)
      .map(([level, data]) => ({
        standardized_level: level,
        label: LEVEL_LABELS[level] || level,
        count: data.total.length,
        avg_base: Math.round(avg(data.base)),
        avg_bonus: Math.round(avg(data.bonus)),
        avg_stock: Math.round(avg(data.stock)),
        avg_total: Math.round(avg(data.total)),
      }))
      .sort((a, b) => (LEVEL_ORDER[a.standardized_level] || 0) - (LEVEL_ORDER[b.standardized_level] || 0));

    res.json({
      success: true,
      data: {
        companies: Object.values(companyData),
        market_averages: marketAverages,
        level_definitions: LEVEL_LABELS,
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 8. GET /level-map — Per-company internal level breakdown for stacked comparison
app.get('/api/level-map', async (req, res) => {
  try {
    const salaries = await prisma.salary.findMany();
    const avg = arr => arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length;

    // Group by company → internal level
    const map = {};
    salaries.forEach(s => {
      const key = `${s.company}::${s.level}`;
      if (!map[key]) {
        map[key] = {
          company: s.company,
          level: s.level,
          standardized_levels: new Set(),
          base: [], bonus: [], stock: [], total: [],
          experience: [],
        };
      }
      map[key].standardized_levels.add(s.standardized_level || getStandardizedLevel(s.experience_years));
      map[key].base.push(s.base_salary);
      map[key].bonus.push(s.bonus);
      map[key].stock.push(s.stock);
      map[key].total.push(s.total_compensation);
      map[key].experience.push(s.experience_years);
    });

    // Build per-company arrays, sorted by avg_total ascending
    const companyData = {};
    Object.values(map).forEach(group => {
      if (!companyData[group.company]) companyData[group.company] = [];
      companyData[group.company].push({
        level: group.level,
        standardized_levels: Array.from(group.standardized_levels),
        count: group.total.length,
        avg_base: Math.round(avg(group.base)),
        avg_bonus: Math.round(avg(group.bonus)),
        avg_stock: Math.round(avg(group.stock)),
        avg_total: Math.round(avg(group.total)),
        avg_experience: parseFloat(avg(group.experience).toFixed(1)),
      });
    });

    // Sort each company's levels by avg_total ascending (entry → senior)
    Object.values(companyData).forEach(levels => {
      levels.sort((a, b) => a.avg_total - b.avg_total);
    });

    res.json({
      success: true,
      data: Object.entries(companyData).map(([company, levels]) => ({ company, levels }))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Production: Serve static assets from client/dist
const clientDistPath = path.join(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  // Robust fallback for SPA: any request not caught by static files or API routes
  // is redirected to index.html (Express 5 safe)
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      res.sendFile(path.join(clientDistPath, 'index.html'));
    } else {
      next();
    }
  });
  console.log('Serving production build from:', clientDistPath);
}

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
