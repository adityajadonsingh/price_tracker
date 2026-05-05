const express = require("express");
const router = express.Router();
const fetchOG = require("../utils/fetchOG");

// 🔍 Fetch OG for single URL
router.post("/single", async (req, res) => {
  try {
    const { url } = req.body;

    const data = await fetchOG(url);
    console.log(data);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;