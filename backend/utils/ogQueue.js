const { chromium } = require("playwright");
const fetchOG = require("./fetchOG");
const TrackedUrl = require("../models/TrackedUrl");
const runScraper = require("./runScraper");
async function processQueue(items, concurrency = 1) {
  console.log(`🚀 OG Queue started (${items.length} items)`);

  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    viewport: { width: 1366, height: 768 },
  });

  let index = 0;

  async function worker(workerId) {
    const page = await context.newPage();

    while (true) {
      let currentIndex;

      if (index >= items.length) break;

      currentIndex = index++;
      const item = items[currentIndex];

      try {
        console.log(`👷 Worker ${workerId}: ${item.url}`);

        // 🔥 OG
        const og = await fetchOG(page, item.url);

        // 🔥 PRICE SCRAPER (THIS IS WHAT YOU WERE ASKING)
        const scraped = await runScraper(page, item.url);

        // 🔥 SAVE EVERYTHING
        await TrackedUrl.findByIdAndUpdate(item._id, {
          title: og.title,
          description: og.description,
          image: og.image,

          // 👇 THIS IS THE IMPORTANT PART
          priceData: scraped,
        });

        console.log(`✅ Saved: ${item.url}`);
      } catch (err) {
        console.log(`❌ Failed: ${item.url}`);
      }
    }

    await page.close();
  }

  const workers = [];

  for (let i = 0; i < concurrency; i++) {
    workers.push(worker(i + 1));
  }

  await Promise.all(workers);

  await browser.close();

  console.log("🎉 OG Queue finished");
}

module.exports = processQueue;
