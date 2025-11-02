import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import path from "path";
import { fileURLToPath } from "url";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { html, type = "png", width = 1080, height = 1920 } = req.body || {};
    if (!html) return res.status(400).json({ error: "HTML requerido" });

    // Ajustes recomendados para serverless
    chromium.setHeadlessMode = true;
    chromium.setGraphicsMode = false;

    const executablePath = await chromium.executablePath();

    // --- FIX CLAVE: asegurar que las .so estén en el LD_LIBRARY_PATH ---
    // Ubicamos la carpeta base del binario y su carpeta lib
    const chromeDir = path.dirname(executablePath);            // .../@sparticuz/chromium/bin
    const libDir    = path.join(chromeDir, "..", "lib");       // .../@sparticuz/chromium/lib

    // Prependemos rutas para que el loader encuentre libnss3.so y demás
    const currentLd = process.env.LD_LIBRARY_PATH || "";
    process.env.LD_LIBRARY_PATH = [libDir, chromeDir, currentLd].filter(Boolean).join(":");
    // -------------------------------------------------------------------

    const browser = await puppeteer.launch({
      executablePath,
      headless: "new",
      args: [
        ...chromium.args,
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--single-process",
        "--no-zygote",
        "--use-gl=swiftshader"
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
