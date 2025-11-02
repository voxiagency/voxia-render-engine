import express from "express";
import puppeteer from "puppeteer";

const app = express();
app.use(express.json({ limit: "12mb" }));

// Healthcheck
app.get("/", (_req, res) => res.json({ ok: true, name: "VoxIA Render Engine", mode: "railway" }));

// Renderiza HTML a PDF (o PNG). Devuelve BINARIO directamente.
app.post("/render", async (req, res) => {
  try {
    const {
      html,
      type = "pdf",          // "pdf" | "png"
      width = 1080,
      height = 1600,
      fullPage = true,       // para PNG largo
      pdf = { format: "A4", printBackground: true } // opciones PDF
    } = req.body || {};

    if (!html || typeof html !== "string" || html.length < 16) {
      return res.status(400).json({ error: "HTML requerido" });
    }

    const browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--single-process",
        "--no-zygote"
      ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: Number(width), height: Number(height) });
    await page.setContent(html, { waitUntil: "networkidle0" });

    let buffer;
    if (type === "png") {
      buffer = await page.screenshot({ type: "png", fullPage: Boolean(fullPage) });
      res.setHeader("Content-Type", "image/png");
    } else {
      buffer = await page.pdf({ ...pdf });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", 'inline; filename="diagnostico.pdf"');
    }

    await browser.close();
    res.send(buffer);
  } catch (err) {
    console.error("Render error:", err);
    res.status(500).json({ error: String(err && err.message ? err.message : err) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🟢 VoxIA Render (Puppeteer) escuchando en ${PORT}`));
