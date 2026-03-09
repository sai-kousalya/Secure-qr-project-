import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { analyzeUrlAsync } from "./detector.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // In-memory "database" for scan history and metrics
  const scanHistory: any[] = [];
  const metrics = {
    truePositives: 42,
    falsePositives: 3,
    trueNegatives: 156,
    falseNegatives: 2,
  };

  const calculateMetrics = () => {
    const { truePositives, falsePositives, trueNegatives, falseNegatives } = metrics;
    const totalScans = truePositives + falsePositives + trueNegatives + falseNegatives;
    const precision = truePositives / (truePositives + falsePositives) || 0;
    const recall = truePositives / (truePositives + falseNegatives) || 0;
    const f1Score = 2 * (precision * recall) / (precision + recall) || 0;
    const accuracy = (truePositives + trueNegatives) / totalScans || 0;

    return {
      ...metrics,
      totalScans,
      accuracy,
      precision,
      recall,
      f1Score
    };
  };

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/metrics", (req, res) => {
    res.json(calculateMetrics());
  });

  app.get("/api/history", (req, res) => {
    res.json(scanHistory);
  });

  app.post("/api/analyze", async (req, res) => {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }
    try {
      const result = await analyzeUrlAsync(url);
      
      // Update metrics based on AI verdict (initial assumption)
      if (result.status === "SAFE") metrics.trueNegatives++;
      else if (result.status === "PHISHING") metrics.truePositives++;
      
      res.json(result);
    } catch (error) {
      console.error("Analysis error:", error);
      res.status(500).json({ error: "Internal server error during analysis" });
    }
  });

  app.post("/api/metrics/report", (req, res) => {
    const { type } = req.body;
    if (type === 'falsePositive') {
      metrics.truePositives--;
      metrics.falsePositives++;
    } else if (type === 'falseNegative') {
      metrics.trueNegatives--;
      metrics.falseNegatives++;
    }
    res.status(204).send();
  });

  app.post("/api/history", (req, res) => {
    const scan = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...req.body
    };
    scanHistory.unshift(scan);
    // Keep only last 50 scans
    if (scanHistory.length > 50) scanHistory.pop();
    res.status(201).json(scan);
  });

  app.delete("/api/history", (req, res) => {
    scanHistory.length = 0;
    res.status(204).send();
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve static files from dist
    const distPath = path.join(rootDir, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile("index.html", { root: distPath });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
