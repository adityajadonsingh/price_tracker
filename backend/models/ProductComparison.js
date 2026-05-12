const mongoose = require("mongoose");

const CompetitorSchema =
  new mongoose.Schema(
    {
      site: String,

      competitorProductId:
        mongoose.Schema.Types.ObjectId,

      competitorVariationIndex:
        Number,
    },
    { _id: false },
  );

const ProductComparisonSchema =
  new mongoose.Schema(
    {
      myProductId: {
        type:
          mongoose.Schema.Types.ObjectId,

        required: true,
      },

      myVariationIndex: {
        type: Number,
        required: true,
      },

      competitors: [
        CompetitorSchema,
      ],
    },
    {
      timestamps: true,
    },
  );

module.exports = mongoose.model(
  "ProductComparison",
  ProductComparisonSchema,
);