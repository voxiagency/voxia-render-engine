import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { html, type = "png", width = 1080, height = 1920 } = req.body || {};
    if (!html) return res.status(400).json({ error: "HTML requerido" });

    // Opcional: mejora fuentes en serverless
    chromium.setGraphicsMode = true;

    const executablePath = await chromium.executablePath(); // Binario de Sparticuz en Vercel

    const browser = await puppeteer.launch({
      executablePath,
      headless: "new",                    // evita warning deprecations
      args: [
        ...chromium.args,                 // flags correctas para serverless
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--single-process",
        "--no-zygote"
      ],
      defaultViewport: { width, height }
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    let buffer, mime;
    if (type === "pdf") {
      buffer = await page.pdf({ format: "A4", printBackground: true });
      mime = "application/pdf";
    } else {
      buffer = await page.screenshot({ type: "png", fullPage: true });
      mime = "image/png";
    }

    await browser.close();
    res.setHeader("Content-Type", mime);
    res.send(buffer);
  } catch (err) {
    console.error("Render error:", err);
    res.status(500).json({ error: err.message });
  }
}
