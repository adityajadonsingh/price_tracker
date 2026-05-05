const fs = require("fs");

const competitor = JSON.parse(fs.readFileSync("results.json"));
const mine = JSON.parse(fs.readFileSync("myProducts.json"));

function normalize(text) {
  return text
    ?.toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

function findMatch(comp) {
  const compName = normalize(comp.name);
  const compSize = normalize(comp.size);

  for (const product of mine) {
    if (normalize(product.name).includes(compName)) {
      const variation = product.variations.find(
        (v) => normalize(v.size) === compSize
      );

      if (variation) return variation;
    }
  }

  return null;
}

const report = competitor.map((c) => {
  if (!c.inStock) {
    return {
      name: c.name,
      size: c.size,
      status: "Competitor Out of Stock",
      competitorPrice: null,
      yourPrice: null,
    };
  }

  const match = findMatch(c);

  if (!match) {
    return {
      name: c.name,
      size: c.size,
      status: "Missing on Your Site",
      competitorPrice: Number(c.price),
      yourPrice: null,
    };
  }

  const compPrice = Number(c.price);
  const yourPrice = Number(match.price);

  let status = "Same";

  if (yourPrice < compPrice) status = "You are Cheaper";
  if (yourPrice > compPrice) status = "You are Expensive";

  return {
    name: c.name,
    size: c.size,
    competitorPrice: compPrice,
    yourPrice,
    status,
    difference: (yourPrice - compPrice).toFixed(2),
  };
});

fs.writeFileSync("comparison.json", JSON.stringify(report, null, 2));

console.log("📊 Comparison ready → comparison.json");