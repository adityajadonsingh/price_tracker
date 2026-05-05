const express = require("express");
const router = express.Router();
const TrackedUrl = require("../models/TrackedUrl");
const processQueue = require("../utils/ogQueue");

// ➕ Save URLs
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

// 📥 Get URLs
router.get("/:site", async (req, res) => {
  try {
    const data = await TrackedUrl.find({ site: req.params.site }).sort({
      createdAt: -1,
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
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

module.exports = router;