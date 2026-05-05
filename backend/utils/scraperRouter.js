const scrapeNaturalPaving = require("../scrapers/naturalPaving");
const scrapePaveDirect = require("../scrapers/paveDirect");
const scrapeNuStone = require("../scrapers/nustone");
const scrapeUniversalPaving = require("../scrapers/universalPaving");
// future:
// const scrapeUniversal = require("../scrapers/universalPaving");

function getScraper(url) {
  if (url.includes("naturalpavingstore.co.uk")) {
    return scrapeNaturalPaving;
  }

  if (url.includes("pavedirect.co.uk")) {
    return scrapePaveDirect;
  }

  if (url.includes("nustone.co.uk")) {
    return scrapeNuStone;
  }

  if (url.includes("universalpaving.co.uk")) {
    return scrapeUniversalPaving;
  }

  // future sites
  // if (url.includes("universalpaving.co.uk")) return scrapeUniversal;

  return null;
}

module.exports = getScraper;