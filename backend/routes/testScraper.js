const express = require("express");
const router = express.Router();
const { chromium } = require("playwright");
const runScraper = require("../utils/runScraper");
const extractOG = require("../utils/fetchOG");

router.post("/test", async (req, res) => {
  let browser;

  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    console.log("🔍 Testing:", url);

    const isAxiosSite = url.includes("universalpaving");
    const isCloudflareSite = url.includes("pavedirect");

    let result = null;
    let og = null;

    if (isAxiosSite) {
      result = await runScraper(null, url);

      og = {
        title: result?.name || null,
        image: null,
        description: null,
      };
    } else {
      browser = await chromium.launch({
        headless: !isCloudflareSite, // key line
      });

      const context = await browser.newContext({
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      });

      const page = await context.newPage();
      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });

      if (isCloudflareSite) {
        await page.waitForTimeout(8000);
      } else {
        await page.waitForTimeout(3000);
      }

      og = await extractOG(page);
      result = await runScraper(page, url);

      await page.close();
      await browser.close();
    }

    res.json({
      url,
      og,
      result,
    });
  } catch (err) {
    console.error("❌ Error:", err.message);

    res.status(500).json({
      error: err.message,
    });
  } finally {
    if (browser) await browser.close();
  }
});

module.exports = router;
