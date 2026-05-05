const axios = require("axios");

function extractPricePerM2(text) {
  const match = text.match(/£\s?(\d+(\.\d+)?)\s*\/\s*m2/i);
  return match ? Number(match[1]) : null;
}

function extractSizeDims(size) {
  // "900x600x20mm" → [900, 600, 20]
  const m = size?.match(/(\d+)x(\d+)x(\d+)mm/i);
  if (!m) return null;
  return {
    l: Number(m[1]),
    w: Number(m[2]),
    t: Number(m[3]),
  };
}

function computeTilesFromArea(size, areaStr) {
  const dims = extractSizeDims(size);
  if (!dims || !areaStr) return null;

  // areaStr "22 sqm" → 22
  const area = Number(areaStr.replace(/[^0-9.]/g, ""));
  if (!area) return null;

  // tile area in m²: (mm → m)
  const tileArea = (dims.l / 1000) * (dims.w / 1000);
  if (!tileArea) return null;

  return Math.round(area / tileArea);
}

function cleanSize(text) {
  if (!text) return null;

  // extract size
  const sizeMatch = text.match(/\d+x\d+x\d+mm/i);

  return sizeMatch ? sizeMatch[0].toLowerCase() : null;
}

function extractArea(text) {
  const match = text.match(/(\d+(\.\d+)?)\s*sqm/i);
  return match ? match[1] + " sqm" : null;
}

function extractTiles(text) {
  const match = text.match(/(\d+)\s*tiles/i);
  return match ? Number(match[1]) : null;
}

async function scrapeUniversalPaving(pageOrUrl, maybeUrl) {
  try {
    const url = typeof pageOrUrl === "string" ? pageOrUrl : maybeUrl;
    const jsonUrl = url.split("?")[0] + ".js";

    const res = await axios.get(jsonUrl);
    const product = res.data;

    const name = product.title;

    const variations = product.variants.map((v) => {
      const raw = v.title;

      const size = cleanSize(raw);
      const area = extractArea(raw);
      let tiles = extractTiles(raw);

      const pricePerM2 = extractPricePerM2(raw);

      // 🧠 if tiles missing → compute from area
      if (!tiles && size && area) {
        tiles = computeTilesFromArea(size, area);
      }

      return {
        rawTitle: raw,
        size,
        area,
        tiles,
        pricePerM2,
        price: v.price / 100,
        inStock: v.available,
        sku: v.sku,
      };
    });

    return {
      name,
      variations,
    };
  } catch (err) {
    return {
      name: null,
      variations: [],
      error: true,
    };
  }
}

module.exports = scrapeUniversalPaving;
