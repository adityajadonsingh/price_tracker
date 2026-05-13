const express = require("express");
const router = express.Router();

const Product = require("../models/Product");
const TrackedUrl = require("../models/TrackedUrl");
const ProductComparison = require("../models/ProductComparison");

// SAVE COMPARISON
router.post("/save", async (req, res) => {
  try {
    const { myProductId, myVariationIndex, competitors } = req.body;

    // VALIDATION

    if (
      !myProductId ||
      myVariationIndex === undefined ||
      !Array.isArray(competitors) ||
      competitors.length === 0
    ) {
      return res.status(400).json({
        error: "Missing fields",
      });
    }

    // FIND EXISTING COMPARISON

    let comparison = await ProductComparison.findOne({
      myProductId,
      myVariationIndex,
    });

    // CREATE NEW IF NOT EXISTS

    if (!comparison) {
      comparison = await ProductComparison.create({
        myProductId,
        myVariationIndex,
        competitors,
      });

      return res.json({
        success: true,
        type: "created",
        comparison,
      });
    }

    // MERGE COMPETITORS

    for (const competitor of competitors) {
      const trackedProduct = await TrackedUrl.findById(
        competitor.competitorProductId,
      );

      if (!trackedProduct) continue;

      // NEVER TRUST FRONTEND SITE
      const normalizedCompetitor = {
        site: trackedProduct.site,
        competitorProductId: competitor.competitorProductId,
        competitorVariationIndex: competitor.competitorVariationIndex,
      };

      const existingIndex = comparison.competitors.findIndex(
        (c) => c.site === normalizedCompetitor.site,
      );

      // SAME SITE EXISTS → UPDATE
      if (existingIndex !== -1) {
        comparison.competitors[existingIndex] = normalizedCompetitor;
      }

      // NEW SITE → ADD
      else {
        comparison.competitors.push(normalizedCompetitor);
      }
    }

    await comparison.save();

    res.json({
      success: true,
      type: "updated",
      comparison,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: err.message,
    });
  }
});

// GET ALL COMPARISONS
router.get("/all", async (req, res) => {
  try {
    const comparisons = await ProductComparison.find()
      .sort({ updatedAt: -1 })
      .lean();

    const formatted = await Promise.all(
      comparisons.map(async (item) => {
        const myProduct = await Product.findById(item.myProductId);

        const competitors = await Promise.all(
          item.competitors.map(async (c) => {
            const competitorProduct = await TrackedUrl.findById(
              c.competitorProductId,
            );

            return {
              ...c,
              competitorProduct,
            };
          }),
        );

        return {
          ...item,
          myProduct,
          competitors,
        };
      }),
    );

    res.json(formatted);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

// DELETE WHOLE COMPARISON
router.delete("/:id", async (req, res) => {
  try {
    await ProductComparison.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

// REMOVE ONE COMPETITOR
router.put("/:id/remove-competitor", async (req, res) => {
  try {
    const { site } = req.body;

    const comparison = await ProductComparison.findById(req.params.id);

    if (!comparison) {
      return res.status(404).json({
        error: "Comparison not found",
      });
    }

    comparison.competitors = comparison.competitors.filter(
      (c) => c.site !== site,
    );

    // AUTO DELETE IF EMPTY
    if (comparison.competitors.length === 0) {
      await ProductComparison.findByIdAndDelete(comparison._id);

      return res.json({
        success: true,
        deleted: true,
      });
    }

    await comparison.save();

    res.json({
      success: true,
      comparison,
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

// GET COMPARISON BY PRODUCT + VARIATION
router.get("/find", async (req, res) => {
  try {
    const { myProductId, myVariationIndex } = req.query;

    const comparison = await ProductComparison.findOne({
      myProductId,
      myVariationIndex,
    }).lean();

    if (!comparison) {
      return res.json(null);
    }

    const competitors = await Promise.all(
      comparison.competitors.map(async (c) => {
        const competitorProduct = await TrackedUrl.findById(
          c.competitorProductId,
        );

        return {
          ...c,
          competitorProduct,
        };
      }),
    );

    res.json({
      ...comparison,
      competitors,
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

// GET STATUS MAP
router.get("/status-map/:site", async (req, res) => {
  try {
    const { site } = req.params;

    // ALL COMPARISONS
    const comparisons = await ProductComparison.find().lean();

    const map = {};

    const trackedProducts = await TrackedUrl.find({
      site,
    }).select("url");

    const urlMap = {};

    trackedProducts.forEach((p) => {
      urlMap[p._id.toString()] = p.url;
    });

    comparisons.forEach((comparison) => {
      comparison.competitors.forEach((c) => {
        if (c.site !== site) return;

        const rawUrl = urlMap[c.competitorProductId.toString()];

        const url = rawUrl?.toLowerCase()?.replace(/\/$/, "")?.split("?")[0];

        if (!url) return;

        if (!map[url]) {
          map[url] = {
            exists: true,
            count: 0,
          };
        }

        map[url].count += 1;
      });
    });

    res.json(map);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

module.exports = router;
