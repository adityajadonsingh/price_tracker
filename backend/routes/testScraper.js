const express = require("express");
const router = express.Router();
const { chromium } = require("playwright");

const runScraper = require("../utils/runScraper");

router.post("/test", async (req, res) => {
  let browser;

  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    console.log("🔍 Testing:", url);

    browser = await chromium.launch({
      headless: true,
    });

    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    });

    const page = await context.newPage();
    console.log(page, url);
    // 🔥 run your scraper
    const result = await runScraper(page, url);

    console.log("✅ Result:", result);

    await page.close();

    res.json({
      url,
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