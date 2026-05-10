/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { createRequire } from 'module';
import compression from "compression";
import { stringify } from "csv-stringify/sync";
import fs from "fs";

const require = createRequire(import.meta.url);
import "dotenv/config";

const multer = require("multer");
const mammoth = require("mammoth");
const natural = require("natural");

const TfIdf = natural.TfIdf;
const tokenizer = new natural.WordTokenizer();

async function startServer() {
  console.log(">>> [Server] Bootstrapping...");
  const app = express();
  const PORT = 3000;
  const upload = multer({ storage: multer.memoryStorage() });

  // Parsers (Lazy loaded)
  let pdfParser: any = null;
  let docxParser: any = null;

  async function getPdfText(buffer: Buffer): Promise<string> {
    console.log("[System] Parsing PDF with pdf-parse...");
    try {
      const pdf = require("pdf-parse");
      const data = await pdf(buffer);
      console.log(`[System] PDF parsed. Text length: ${data.text?.length || 0}`);
      return data.text || "";
    } catch (err) {
      console.error("[System] pdf-parse failed:", err);
      throw err;
    }
  }

  async function getDocxParser() {
    if (docxParser) return docxParser;
    console.log("[System] Loading Docx parser...");
    try {
      docxParser = require("mammoth");
      return docxParser;
    } catch (err) {
      console.error("[System] Failed to load Docx parser:", err);
      throw err;
    }
  }

  // Log environment
  console.log(`>>> [Server] NODE_ENV: ${process.env.NODE_ENV}`);

  app.use(compression());
  app.use(express.json());

  // Log every request for debugging
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // ML Scoring Logic
  function calculateScore(text: string, jobDescription: string, requiredSkills: string[], minExperience: number) {
    const resumeText = text.toLowerCase();
    const jdText = jobDescription.toLowerCase();

    // 1. TF-IDF Similarity (50%)
    const tfidf = new TfIdf();
    tfidf.addDocument(jdText);
    tfidf.addDocument(resumeText);
    
    const jdTerms = tokenizer.tokenize(jdText);
    let jdScore = 0;
    let resumeScore = 0;
    
    tfidf.tfidfs(jdTerms, (i: number, measure: number) => {
      if (i === 0) jdScore += measure;
      if (i === 1) resumeScore += measure;
    });
    
    const tfidfSimilarity = jdScore > 0 ? (resumeScore / jdScore) * 100 : 0;
    const finalTfidf = Math.min(tfidfSimilarity, 100);

    // 2. Skill Match (30%)
    const matchedSkills = requiredSkills.filter(skill => resumeText.includes(skill.toLowerCase()));
    const missingSkills = requiredSkills.filter(skill => !resumeText.includes(skill.toLowerCase()));
    const skillScore = requiredSkills.length > 0 ? (matchedSkills.length / requiredSkills.length) * 100 : 100;

    // 3. Experience Match (20%)
    // Simple heuristic: look for numbers followed by "years" or "yrs"
    const expRegex = /(\d+)\s*(years?|yrs?)/gi;
    let maxExpFound = 0;
    let match;
    while ((match = expRegex.exec(resumeText)) !== null) {
      const val = parseInt(match[1]);
      if (val > maxExpFound) maxExpFound = val;
    }
    const expScore = minExperience > 0 ? Math.min((maxExpFound / minExperience) * 100, 100) : 100;

    const finalScore = (finalTfidf * 0.5) + (skillScore * 0.3) + (expScore * 0.2);

    return {
      score: Math.round(finalScore),
      tfidfScore: Math.round(finalTfidf),
      skillScore: Math.round(skillScore),
      expScore: Math.round(expScore),
      matchedSkills,
      missingSkills,
      experienceFound: maxExpFound,
      status: finalScore >= 75 ? "Shortlisted" : finalScore >= 50 ? "Review" : "Rejected",
      reason: `Match: ${matchedSkills.length}/${requiredSkills.length} skills. ${maxExpFound} years experience found.`
    };
  }

  // Final Reports Store (In-memory for simplicity in this dev env)
  let scanHistory: any[] = [];

  // Screen endpoint
  app.post("/api/screen", upload.single("resume"), async (req, res) => {
    try {
      const file = req.file;
      const jobDescription = req.body.jobDescription || "";
      const requiredSkills = JSON.parse(req.body.requiredSkills || "[]");
      const minExperience = parseInt(req.body.minExperience || "0");

      if (!file) {
        console.warn("[API] Missing file in request");
        return res.status(400).json({ error: "Missing resume file" });
      }
      if (!jobDescription) {
        console.warn("[API] Missing job description in request");
        return res.status(400).json({ error: "Missing job description" });
      }

      console.log(`[AI] Processing: ${file.originalname} (${file.mimetype})`);

      let text = "";
      if (file.mimetype === "application/pdf") {
        try {
          text = await getPdfText(file.buffer);
        } catch (pdfError) {
          console.error("PDF Parsing failed:", pdfError);
          throw new Error(`PDF Error: ${pdfError instanceof Error ? pdfError.message : String(pdfError)}`);
        }
      } else if (file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        const mammoth = await getDocxParser();
        const data = await mammoth.extractRawText({ buffer: file.buffer });
        text = data.value;
      } else {
        text = file.buffer.toString("utf-8");
      }

      if (!text || text.trim().length < 5) {
        throw new Error("Could not extract enough text from file.");
      }

      const analysis = calculateScore(text, jobDescription, requiredSkills, minExperience);
      
      const candidateResult = {
        id: Math.random().toString(36).substring(7),
        fileName: file.originalname,
        analysis,
        timestamp: new Date().toISOString()
      };

      scanHistory.push(candidateResult);

      res.json(candidateResult);
    } catch (error) {
      console.error("Screening error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Internal server error during screening" 
      });
    }
  });

  // Report Download
  app.get("/api/download-report", (req, res) => {
    try {
      const columns = ["fileName", "score", "status", "matchedSkills", "missingSkills", "reason"];
      const data = scanHistory.map(h => [
        h.fileName, 
        h.analysis.score, 
        h.analysis.status, 
        h.analysis.matchedSkills.join(", "), 
        h.analysis.missingSkills.join(", "), 
        h.analysis.reason
      ]);
      
      const csv = stringify(data, { header: true, columns });
      
      // Ensure outputs dir exists
      if (!fs.existsSync("./outputs")) {
        fs.mkdirSync("./outputs");
      }
      fs.writeFileSync("./outputs/ranking_report.csv", csv);

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=ranking_report.csv");
      res.send(csv);
    } catch (error) {
      console.error("Report generation failed:", error);
      res.status(500).json({ error: "Failed to generate report" });
    }
  });

  // API 404 handler
  app.all("/api/*", (req, res) => {
    console.warn(`[API] 404 Not Found: ${req.method} ${req.url}`);
    res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
  });

  // Global error handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("[Global Error Handler]", err);
    if (res.headersSent) {
      return next(err);
    }
    res.status(err.status || 500).json({ 
      error: err.message || "Internal Server Error",
      operation: "global_error_handler"
    });
  });

  // Vite Middleware
  if (process.env.NODE_ENV !== "production") {
    console.log(">>> [Vite] Starting dev middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`>>> [Server] Listening on port ${PORT}`);
    console.log(`>>> [Server] PID: ${process.pid}`);
    console.log(`>>> [System] Node: ${process.version}`);
  });
}

startServer().catch(err => {
  console.error(">>> [Server] FAILED TO START:", err);
  process.exit(1);
});

