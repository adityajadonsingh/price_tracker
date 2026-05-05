const mongoose = require("mongoose");

const VariationSchema = new mongoose.Schema({
  size: String,
  pieces: Number,
  coverage: Number,
  price: Number,
  pricePerM2: Number,
  inStock: Boolean,
});

const ProductSchema = new mongoose.Schema({
  url: String,
  site: String,
  name: String,

  // hybrid support
  size: String,
  pieces: Number,
  price: Number,
  inStock: Boolean,

  variations: [VariationSchema],

  history: [
    {
      price: Number,
      date: { type: Date, default: Date.now },
    }
  ],
}, { timestamps: true });

module.exports = mongoose.model("Product", ProductSchema);