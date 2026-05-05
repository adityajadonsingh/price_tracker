const express = require("express");
const router = express.Router();
const { chromium } = require("playwright");
const buildUrlTree = require("../utils/buildUrlTree");
const SiteMap = require("../models/SiteMap");

// 🧠 helper to extract <loc> URLs
function extractXMLUrls(content) {
  return [...content.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
}

router.post("/fetch", async (req, res) => {
  let context;

  try {
    const { sitemapUrl, site } = req.body;
    if (!site) {
      return res.status(400).json({ error: "site is required" });
    }

    if (!sitemapUrl) {
      return res.status(400).json({ message: "Sitemap URL required" });
    }

    console.log("🌐 Opening sitemap:", sitemapUrl);

    // 🔥 Persistent browser (saves cookies/session)
    context = await chromium.launchPersistentContext("./user-data", {
      headless: false,
      viewport: { width: 1366, height: 768 },
    });

    const page = await context.newPage();

    // 🧠 Basic stealth (light)
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", {
        get: () => false,
      });
    });

    await page.goto(sitemapUrl, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    console.log("⏳ Waiting for Cloudflare (if any)...");

    // ⏳ give time for CF challenge
    await page.waitForTimeout(8000);

    const content = await page.content();

    let urls = [];

    // 🟢 CASE 1: XML sitemap
    if (content.includes("<loc>")) {
      urls = extractXMLUrls(content);
    }
    // 🟡 CASE 2: HTML sitemap
    else {
      urls = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("a[href]")).map(
          (a) => a.href,
        );
      });
    }

    // 🧼 clean duplicates
    urls = [...new Set(urls)];
    const tree = buildUrlTree(urls);
    console.log(`✅ Extracted ${urls.length} URLs`);

    await SiteMap.findOneAndUpdate({ site }, { urls, tree }, { upsert: true });

    res.json({ urls, tree });
  } catch (err) {
    console.error("❌ Error:", err.message);
    res.status(500).json({ error: err.message });
  } finally {
    if (context) await context.close();
  }
});
router.get("/:site", async (req, res) => {
  const data = await SiteMap.findOne({ site: req.params.site });

  if (!data) return res.json({ urls: [], tree: {} });

  res.json(data);
});
module.exports = router;
