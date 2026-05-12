const mongoose = require("mongoose");

const VariationSchema = new mongoose.Schema(
  {
    label: String,

    size: String,

    pieces: Number,

    coverage: Number,

    price: Number,

    thickness: String,

    pricePerM2: Number,

    finish: String,
    
    inStock: Boolean,

    sku: String,
  },
  { _id: false },
);

const ProductSchema = new mongoose.Schema(
  {
    source: {
      type: String,
      enum: ["self", "competitor"],
      required: true,
    },

    site: String,

    // original source URL
    url: String,

    slug: String,

    name: String,

    image: String,

    description: String,

    productType: {
      type: String,
      enum: ["single", "variation"],
      default: "single",
    },

    // legacy support
    size: String,
    pieces: Number,
    price: Number,
    inStock: Boolean,

    // normalized variations
    variations: [VariationSchema],

    // future comparison helpers
    matchedProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],

    // price history
    history: [
      {
        price: Number,

        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    rawData: Object,
  },
  { timestamps: true },
);

module.exports = mongoose.model("Product", ProductSchema);
