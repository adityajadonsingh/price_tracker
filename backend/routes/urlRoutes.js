const express = require("express");
const router = express.Router();
const TrackedUrl = require("../models/TrackedUrl");
const processQueue = require("../utils/ogQueue");
const refreshTrackedProduct = require("../utils/refreshTrackedProduct");

// Save URLs
router.post("/save", async (req, res) => {
  try {
    const { site, urls } = req.body;

    if (!site || !urls?.length) {
      return res.status(400).json({ message: "Invalid data" });
    }

    // 🚫 remove duplicates
    const existing = await TrackedUrl.find({
      site,
      url: { $in: urls },
    });

    const existingUrls = new Set(existing.map((e) => e.url));

    const newUrls = urls.filter((u) => !existingUrls.has(u));

    const docs = newUrls.map((url) => ({
      site,
      url,
      selected: true,
    }));

    const inserted = await TrackedUrl.insertMany(docs);

    // 🔥 Start queue (DO NOT await)
    processQueue(inserted, 1); // ⚠️ IMPORTANT: 1 for Cloudflare sites

    res.json({
      message: "URLs saved. OG processing started...",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const Product = require("../models/Product");

router.get("/:site", async (req, res) => {
  try {
    // 🔥 Stonecera products
    if (req.params.site === "stonecera") {
      const data = await Product.find({
        source: "self",
      }).sort({
        updatedAt: -1,
      });

      return res.json(data);
    }

    // 🔥 competitor products
    const data = await TrackedUrl.find({
      site: req.params.site,
    }).sort({
      createdAt: -1,
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

// 🗑️ Delete
router.delete("/delete/:site", async (req, res) => {
  try {
    await TrackedUrl.deleteMany({ site: req.params.site });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Single Product
router.delete("/:id", async (req, res) => {
  try {
    await TrackedUrl.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Product deleted",
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

// Refresh Single Product
router.post("/refresh/:id", async (req, res) => {
  try {
    const success = await refreshTrackedProduct(req.params.id);

    res.json({
      success,
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

// Refresh All Products
router.post("/refresh-all/:site", async (req, res) => {
  try {
    const { site } = req.params;

    // 🔥 STONECERA
    if (site === "stonecera") {
      const response = await fetch(
        `${process.env.API_BASE_URL}/api/products/import-self`,
        {
          method: "POST",
        },
      );

      const data = await response.json();

      return res.json({
        success: true,
        type: "stonecera",
        data,
      });
    }

    // 🔥 COMPETITORS
    const products = await TrackedUrl.find({
      site,
    });

    for (const item of products) {
      await refreshTrackedProduct(item._id);
    }

    res.json({
      success: true,
      refreshed: products.length,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: err.message,
    });
  }
});

module.exports = router;
