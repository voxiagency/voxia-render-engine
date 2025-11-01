import puppeteer from "puppeteer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { html, type = "png", width = 1080, height = 1920 } = req.body || {};

  if (!html) {
    return res.status(400).json({ error: "HTML requerido" });
  }

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--single-process",
        "--no-zygote"
      ],
    });

    const page = await browser.newPage();
    await page.setViewport({ width, height });
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
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
