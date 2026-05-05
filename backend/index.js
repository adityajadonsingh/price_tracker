const fs = require("fs");
const cliProgress = require("cli-progress");
const { chromium } = require("playwright");

const getScraper = require("./utils/scraperRouter");

const urls = JSON.parse(fs.readFileSync("selectedUrls.json"));

const CONCURRENCY = 5;

async function run() {
  console.log("🚀 Starting scraper...");

  const browser = await chromium.launch({ headless: true });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
  });

  await context.route("**/*", (route) => {
    const type = route.request().resourceType();

    if (type === "image" || type === "font" || type === "stylesheet") {
      route.abort();
    } else {
      route.continue();
    }
  });

  const total = urls.length;

  const progressBar = new cliProgress.SingleBar(
    {
      format: "⚡ Scraping |{bar}| {value}/{total}",
    },
    cliProgress.Presets.shades_classic,
  );

  progressBar.start(total, 0);

  const results = [];
  let index = 0;

  async function worker() {
    const page = await context.newPage();

    while (index < total) {
      const currentIndex = index++;
      const url = urls[currentIndex];

      const scraper = getScraper(url);

      if (!scraper) {
        results.push({ url, error: "No scraper" });
        progressBar.increment();
        continue;
      }

      try {
        const data = await scraper(page, url); // 👈 KEY CHANGE

        results.push({
          url,
          ...data,
        });
      } catch (err) {
        results.push({ url, error: true });
      }

      progressBar.increment();
    }

    await page.close();
  }

  const workers = [];
  for (let i = 0; i < CONCURRENCY; i++) {
    workers.push(worker());
  }

  await Promise.all(workers);

  progressBar.stop();

  fs.writeFileSync("results.json", JSON.stringify(results, null, 2));

  await browser.close();

  console.log("\n✅ Done.");
}

run();

// const fs = require("fs");
// const cliProgress = require("cli-progress");
// const { chromium } = require("playwright");

// const scrapeNaturalPaving = require("./scrapers/naturalPaving");

// const urls = JSON.parse(fs.readFileSync("selectedUrls.json"));

// const CONCURRENCY = 5;

// async function runScraper() {
//   console.log("🚀 Starting scraper...");

//   const browser = await chromium.launch({ headless: true });

//   const context = await browser.newContext({
//     userAgent:
//       "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
//   });

//   const total = urls.length;

//   const progressBar = new cliProgress.SingleBar(
//     {
//       format: "⏳ Scraping |{bar}| {value}/{total}",
//     },
//     cliProgress.Presets.shades_classic
//   );

//   progressBar.start(total, 0);

//   const results = [];
//   let index = 0;

//   async function worker() {
//     const page = await context.newPage(); // 👈 each worker gets 1 tab

//     while (index < total) {
//       const currentIndex = index++;
//       const url = urls[currentIndex];

//       console.log(`🔍 ${url}`);

//       const data = await scrapeNaturalPaving(page, url);

//       results.push({
//         url,
//         name: data?.name || null,
//         size: data?.size || null,
//         price: data?.price || null,
//         inStock: data?.inStock ?? false,
//       });

//       progressBar.increment();
//     }

//     await page.close();
//   }

//   const workers = [];
//   for (let i = 0; i < CONCURRENCY; i++) {
//     workers.push(worker());
//   }

//   await Promise.all(workers);

//   progressBar.stop();

//   fs.writeFileSync("results.json", JSON.stringify(results, null, 2));

//   await browser.close();

//   console.log("\n✅ Done. Results saved.");
// }

// runScraper();

// const scrape = require("./scrapers/universalPaving");

// (async () => {
//   const data = await scrape(
//     "https://universalpaving.co.uk/products/kandla-grey-porcelain-paving-900x600"
//   );

//   console.log(data);
// })();

// const { chromium } = require("playwright");
// const scrape = require("./scrapers/paveDirect");

// (async () => {
//   const browser = await chromium.launch({ headless: true });
//   const page = await browser.newPage();

//   try {
//     const data = await scrape(
//       page,
//       "https://www.pavedirect.co.uk/product/dunestone-black-porcelain-anti-slip-paving-packs"
//     );

//     console.log(JSON.stringify(data, null, 2));
//   } catch (err) {
//     console.error("❌ Error:", err);
//   } finally {
//     await browser.close();
//   }
// })();

// const scrape = require("./scrapers/pavingSuperstore");

// (async () => {
//   const data = await scrape(
//     "https://www.pavingsuperstore.co.uk/paving-superstore-porcelain-choice-range-river-stone-paving-slabs"
//   );

//   console.log(JSON.stringify(data, null, 2));
// })();

// const scrape = require("./scrapers/nustone");

// (async () => {
//   const data = await scrape(
//     "https://nustone.co.uk/product/raj-green-porcelain-patio-kit/"
//   );

//   console.log(JSON.stringify(data, null, 2));
// })();

// const getScraper = require("./utils/scraperRouter");

// (async () => {
//   const url = "https://nustone.co.uk/product/raj-green-porcelain-patio-kit/";

//   const scraper = getScraper(url);

//   if (!scraper) {
//     console.log("❌ No scraper found");
//     return;
//   }

//   const data = await scraper(url);

//   console.log(data);
// })();
