const axios = require("axios");

function normalizeVariation(product, variation) {
  const label =
    variation?.attributes?.[0]?.value || "default";

  const rawPrice =
    product?.prices?.price ||
    product?.prices?.regular_price;

  const price = rawPrice
    ? Number(rawPrice) / 100
    : null;

  return {
    label,

    size:
      product?.dimensions?.height || null,

    pieces: null,

    coverage: null,

    price,

    pricePerM2: null,

    inStock: product?.is_in_stock || false,

    sku: product?.sku || null,
  };
}

async function scrapeNaturalPaving(page, url) {
  try {
    const slug =
      url
        .split("/")
        .filter(Boolean)
        .pop() || "";

    const apiUrl = `https://www.naturalpavingstore.co.uk/wp-json/wc/store/products?slug=${slug}`;

    console.log("🌐 API:", apiUrl);

    const res = await axios.get(apiUrl, {
      headers: {
        Accept: "application/json",

        "User-Agent":
          "PostmanRuntime/7.43.4",

        Connection: "keep-alive",
      },
    });

    const product = res.data?.[0];

    if (!product) {
      return {
        name: null,
        productType: "single",
        variations: [],
        error: true,
      };
    }

    const variations =
      product.variations?.length > 0
        ? product.variations.map((v) =>
            normalizeVariation(product, v),
          )
        : [
            normalizeVariation(product, {
              attributes: [],
            }),
          ];

    return {
      name: product.name,

      productType:
        variations.length > 1
          ? "variation"
          : "single",

      variations,
    };
  } catch (err) {
    console.log(
      "❌ Natural scraper error:",
      err.response?.status || err.message,
    );

    return {
      name: null,
      productType: "single",
      variations: [],
      error: true,
    };
  }
}

module.exports = scrapeNaturalPaving;