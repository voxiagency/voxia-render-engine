import express from "express";
import { chromium } from "playwright";

const app = express();
app.use(express.json({ limit: "10mb" }));

app.get("/health", (_, res) => res.json({ status: "ok" }));

app.post("/render", async (req, res) => {
  const { html, type = "png", width = 1080, height = 1920, fullPage = true } = req.body || {};
  if (!html) return res.status(400).json({ error: "HTML requerido" });

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
    });

    const context = await browser.newContext({ viewport: { width: Number(width), height: Number(height) } });
    const page = await context.newPage();
    await page.setContent(html, { waitUntil: "networkidle" });

    const isPdf = type === "pdf";
    const buffer = isPdf
      ? await page.pdf({ format: "A4", printBackground: true })
      : await page.screenshot({ type: "png", fullPage: Boolean(fullPage) });

    await browser.close();
    res.setHeader("Content-Type", isPdf ? "application/pdf" : "image/png");
    res.send(buffer);
  } catch (err) {
    if (browser) try { await browser.close(); } catch {}
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🟢 VoxIA Render Engine (Playwright) en puerto ${PORT}`));
