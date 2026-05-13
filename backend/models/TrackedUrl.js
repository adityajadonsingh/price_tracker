const mongoose = require("mongoose");

const TrackedUrlSchema = new mongoose.Schema(
  {
    site: String,
    url: String,
    selected: { type: Boolean, default: true },
    priceData: { type: Object },
    // OG data
    title: String,
    description: String,
    image: String,
    history: [
      {
        variationIndex: Number,

        price: Number,

        pricePerM2: Number,

        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },

  { timestamps: true },
);

module.exports = mongoose.model("TrackedUrl", TrackedUrlSchema);
