const mongoose = require("mongoose");

const SiteMapSchema = new mongoose.Schema(
  {
    site: String,
    urls: Array,
    tree: Object,
  },
  { timestamps: true }
);

module.exports = mongoose.model("SiteMap", SiteMapSchema);