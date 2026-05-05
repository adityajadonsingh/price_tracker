const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const urlRoutes = require("./routes/urlRoutes");
const sitemapRoutes = require("./routes/sitemapRoutes");
const ogRoutes = require("./routes/ogRoutes");
const testScraperRoute = require("./routes/testScraper");

const app = express();

connectDB();

// Middlewares
app.use(cors());
app.use(express.json());


app.use("/api/test-scraper", testScraperRoute);
app.use("/api/urls", urlRoutes);


app.use("/api/sitemap", sitemapRoutes);


app.use("/api/og", ogRoutes);

// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});