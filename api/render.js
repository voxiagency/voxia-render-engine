import chromium from "chrome-aws-lambda";
import puppeteer from "puppeteer-core";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { html, type = "png", width = 1080, height = 1920 } = req.body || {};

  if (!html) {
    return res.status(400).json({ error: "HTML requerido" });
  }

  try {
    // Intentamos obtener el path de Chrome válido para Vercel
    const executablePath = (await chromium.executablePath) || "/usr/bin/google-chrome-stable";

    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath,
      headless: chromium.headless,
      defaultViewport: { width, height },
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    let buffer;
    let mimeType;

    if (type === "pdf") {
      buffer = await page.pdf({ format: "A4", printBackground: true });
      mimeType = "application/pdf";
    } else {
      buffer = await page.screenshot({ type: "png", fullPage: true });
      mimeType = "image/png";
    }

    await browser.close();

    res.setHeader("Content-Type", mimeType);
    res.send(buffer);
  } catch (error) {
    console.error("Error en render:", error);
    res.status(500).json({ error: error.message });
  }
}
