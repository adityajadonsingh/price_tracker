const mongoose = require("mongoose");

const TrackedUrlSchema = new mongoose.Schema({
  site: String,
  url: String,
  selected: { type: Boolean, default: true },
priceData: { type: Object },
  // OG data
  title: String,
  description: String,
  image: String,
}, { timestamps: true });

module.exports = mongoose.model("TrackedUrl", TrackedUrlSchema);