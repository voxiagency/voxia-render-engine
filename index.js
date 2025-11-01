import express from 'express';
import bodyParser from 'body-parser';
import puppeteer from 'puppeteer';

const app = express();
app.use(bodyParser.json({ limit: '10mb' }));

app.post('/render', async (req, res) => {
  const { html, type = 'png', width = 1080, height = 1920 } = req.body;

  if (!html) return res.status(400).send({ error: 'HTML requerido' });

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    await page.setViewport({ width, height });
    await page.setContent(html, { waitUntil: 'networkidle0' });

    let buffer;
    let mimeType;

    if (type === 'pdf') {
      buffer = await page.pdf({ format: 'A4', printBackground: true });
      mimeType = 'application/pdf';
    } else {
      buffer = await page.screenshot({ type: 'png', fullPage: true });
      mimeType = 'image/png';
    }

    await browser.close();

    res.setHeader('Content-Type', mimeType);
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🟢 VoxIA Render Engine activo en puerto ${PORT}`));

