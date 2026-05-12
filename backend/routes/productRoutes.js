const express = require("express");
const router = express.Router();

const Product = require("../models/Product");

router.post("/import-self", async (req, res) => {
  try {
    console.log("🚀 Importing self products...");

    const response = await fetch(
      "https://admin.stonecera.co.uk/api/products?limit=1000&page=1",
    );

    if (!response.ok) {
      throw new Error("Failed to fetch Strapi products");
    }

    const data = await response.json();

    const products = data.products || [];

    let imported = 0;

    for (const item of products) {
      const product = item.product;

      const variations = (item.variations || []).map((v) => ({
        label: v.Size || "Default",
        thickness: v.Thickness || null,
        size: v.Size || null,

        pieces: v.Pcs || null,

        coverage: v.PackSize || null,
        finish: v.Finish || null,
        price: v.Price || null,

        pricePerM2: v.Per_m2 || null,

        inStock: (v.Stock || 0) > 0,

        sku: v.SKU || null,
      }));

      const firstVariation = variations[0] || null;

      const image = product?.images?.[0]?.url
        ? `https://admin.stonecera.co.uk${product.images[0].url}`
        : null;

      await Product.findOneAndUpdate(
        {
          source: "self",

          slug: product.slug,
        },
        {
          source: "self",

          site: "stonecera",

          url: `https://stonecera.co.uk/product/${product.slug}`,

          slug: product.slug,

          image,

          priceData: {
            name: product.name,

            productType: variations.length > 1 ? "variation" : "single",

            variations,
          },

          // optional legacy fallback
          name: product.name,

          variations,

          size: firstVariation?.size || null,

          thickness: firstVariation?.thickness || null,

          pieces: firstVariation?.pieces || null,

          price: firstVariation?.price || null,
finish: firstVariation?.finish || null,
          inStock: firstVariation?.inStock || false,

          rawData: item,
        },
        {
          upsert: true,
          returnDocument: "after",
        },
      );

      imported++;
    }

    res.json({
      success: true,
      imported,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: err.message,
    });
  }
});

// 📦 Get self products
router.get("/self", async (req, res) => {
  try {
    const products = await Product.find({
      source: "self",
    }).sort({
      updatedAt: -1,
    });

    res.json(products);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

module.exports = router;
