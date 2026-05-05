const scrapePaveDirect = require("../scrapers/paveDirect");
const scrapeUniversal = require("../scrapers/universalPaving");
const scrapeNustone = require("../scrapers/nustone");
const scrapeNaturalPaving = require("../scrapers/naturalPaving");

async function runScraper(page, url) {
  if (url.includes("naturalpavingstore")) {
    return await scrapeNaturalPaving(page, url);
  }

  if (url.includes("nustone")) {
    return await scrapeNustone(page, url);
  }

  if (url.includes("pavedirect")) {
    return await scrapePaveDirect(page, url);
  }

  if (url.includes("universalpaving")) {
    return await scrapeUniversal(url); // axios based
  }

  return { error: "No scraper matched" };
}

module.exports = runScraper;