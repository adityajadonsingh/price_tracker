require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");

const urlRoutes = require("./routes/urlRoutes");
const sitemapRoutes = require("./routes/sitemapRoutes");
const ogRoutes = require("./routes/ogRoutes");
const testScraperRoute = require("./routes/testScraper");

const app = express();

/* DB */
connectDB();

/* MIDDLEWARES */
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);

app.use(express.json({ limit: "10mb" }));

/* ROUTES */
app.use("/api/test-scraper", testScraperRoute);

app.use("/api/urls", urlRoutes);

app.use("/api/sitemap", sitemapRoutes);

app.use("/api/og", ogRoutes);

/* HEALTH CHECK */
app.get("/", (req, res) => {
  res.send("🚀 Price Tracker Backend Running");
});

/* START SERVER */
const PORT = process.env.PORT || 5050;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});