const { chromium } = require("playwright");

const TrackedUrl = require("../models/TrackedUrl");

const extractOG = require("./fetchOG");

const runScraper = require("./runScraper");

async function refreshTrackedProduct(id) {
  const item = await TrackedUrl.findById(id);

  if (!item) return null;

const browser = await chromium.launch({
  headless: true,
});

const context =
  await browser.newContext();

const page =
  await context.newPage();

  try {
    await page.goto(item.url, {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });

    const og = await extractOG(page);

    const scraped = await runScraper(
      page,
      item.url,
    );

    const newHistory = [
      ...(item.history || []),
    ];

    scraped?.variations?.forEach(
      (variation, index) => {
        const latest =
          [...newHistory]
            .reverse()
            .find(
              (h) =>
                h.variationIndex ===
                index,
            );

        const changed =
          !latest ||
          latest.price !==
            variation.price ||
          latest.pricePerM2 !==
            variation.pricePerM2;

        if (changed) {
          newHistory.push({
            variationIndex: index,

            price: variation.price,

            pricePerM2:
              variation.pricePerM2,

            date: new Date(),
          });
        }
      },
    );

    await TrackedUrl.findByIdAndUpdate(
      id,
      {
        title: og.title,

        description:
          og.description,

        image: og.image,

        priceData: scraped,

        history: newHistory,
      },
    );

    return true;
  } catch (err) {
    console.log(
      "Refresh failed:",
      err.message,
    );

    return false;
  } finally {
    await browser.close();
  }
}

module.exports = refreshTrackedProduct;