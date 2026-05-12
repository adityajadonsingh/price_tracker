const express = require("express");
const router = express.Router();

const Product = require("../models/Product");
const TrackedUrl = require("../models/TrackedUrl");
const ProductComparison = require("../models/ProductComparison");

// SAVE COMPARISON
router.post("/save", async (req, res) => {
  try {
    const {
      myProductId,
      myVariationIndex,
      competitors,
    } = req.body;

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

    // 🔥 FIND EXISTING
    let comparison =
      await ProductComparison.findOne({
        myProductId,
        myVariationIndex,
      });

    // 🔥 CREATE NEW
    if (!comparison) {
      comparison =
        await ProductComparison.create({
          myProductId,
          myVariationIndex,

          competitors,
        });

      return res.json({
        success: true,
        comparison,
      });
    }

    // 🔥 APPEND NEW COMPETITORS
    for (const competitor of competitors) {
      const exists =
        comparison.competitors.find(
          (c) =>
            c.site === competitor.site &&
            String(
              c.competitorProductId,
            ) ===
              String(
                competitor.competitorProductId,
              ) &&
            c.competitorVariationIndex ===
              competitor.competitorVariationIndex,
        );

      if (!exists) {
        comparison.competitors.push(
          competitor,
        );
      }
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

// GET ALL COMPARISONS
router.get("/all", async (req, res) => {
  try {
    const comparisons =
      await ProductComparison.find()
        .sort({ updatedAt: -1 })
        .lean();

    const formatted =
      await Promise.all(
        comparisons.map(async (item) => {
          const myProduct =
            await Product.findById(
              item.myProductId,
            );

          const competitors =
            await Promise.all(
              item.competitors.map(
                async (c) => {
                  const competitorProduct =
                    await TrackedUrl.findById(
                      c.competitorProductId,
                    );

                  return {
                    ...c,
                    competitorProduct,
                  };
                },
              ),
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

module.exports = router;
