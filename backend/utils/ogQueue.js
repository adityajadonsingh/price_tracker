const { chromium } = require("playwright");
const extractOG = require("./fetchOG");
const TrackedUrl = require("../models/TrackedUrl");
const runScraper = require("./runScraper");
async function processQueue(items, concurrency = 2) {
  console.log(`🚀 Queue started (${items.length} items)`);

  let index = 0;

  async function worker(workerId) {
    while (true) {
      if (index >= items.length) break;

      const currentIndex = index++;
      const item = items[currentIndex];

      let browser;
      let context;
      let page;

      try {
        console.log(`👷 Worker ${workerId}: ${item.url}`);

        const isAxiosSite = item.url.includes("universalpaving");
        const isCloudflareSite = item.url.includes("pavedirect");

        let og = { title: null, description: null, image: null };
        let scraped = null;

        // AXIOS SITE (no browser)
        if (isAxiosSite) {
          scraped = await runScraper(null, item.url);

          og = {
  title: scraped?.name || null,
  description: null,
  image: scraped?.image || null,
};
        } else {
          // DIFFERENT MODES
          if (isCloudflareSite) {
            console.log("🛡 Trying stealth mode (Cloudflare)");

            browser = await chromium.launch({
              headless: false, // keep false for testing
            });

            context = await browser.newContext({
              userAgent:
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
              viewport: { width: 1366, height: 768 },
            });

            page = await context.newPage();

            await page.goto(item.url, {
              waitUntil: "domcontentloaded",
              timeout: 60000,
            });

            await page.waitForTimeout(8000);

            og = await extractOG(page);
            scraped = await runScraper(page, item.url);

            await page.close();
            await context.close();
            await browser.close();
          } else {
            browser = await chromium.launch({
              headless: true,
            });
          }

          context = await browser.newContext({
            userAgent:
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
            viewport: { width: 1366, height: 768 },
          });

          page = await context.newPage();

          await page.goto(item.url, {
            waitUntil: "domcontentloaded",
            timeout: 60000,
          });

          // ⏳ wait (Cloudflare sites need more)
          if (isCloudflareSite) {
            await page.waitForTimeout(8000);
          } else {
            await page.waitForTimeout(3000);
          }

          og = await extractOG(page);
          scraped = await runScraper(page, item.url);

          await page.close();
          await context.close();
          await browser.close();
        }

        await TrackedUrl.findByIdAndUpdate(item._id, {
          title: og.title,
          description: og.description,
          image: og.image,
          priceData: scraped,
        });

        console.log(`✅ Saved: ${item.url}`);
      } catch (err) {
        console.log(`❌ Failed: ${item.url}`, err.message);

        if (browser) await browser.close();
      }
    }
  }

  const workers = [];

  for (let i = 0; i < concurrency; i++) {
    workers.push(worker(i + 1));
  }

  await Promise.all(workers);

  console.log("🎉 Queue finished");
}

module.exports = processQueue;
