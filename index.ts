import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // In-memory "database" for scan history
  const scanHistory: any[] = [];

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/history", (req, res) => {
    res.json(scanHistory);
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
