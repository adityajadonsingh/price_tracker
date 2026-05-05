const { chromium } = require("playwright");
const axios = require("axios");
const xml2js = require("xml2js");
const inquirer = require("inquirer");
const fs = require("fs");

const SITEMAP_URL =
  "https://www.naturalpavingstore.co.uk/product-sitemap.xml";

const OUTPUT_FILE = "selectedUrls.json";

async function fetchSitemapUrls() {
  const browser = await chromium.launch({ headless: true });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
  });

  const page = await context.newPage();

  try {
    console.log("🌐 Visiting homepage first (bypass Cloudflare)...");

    // Step 1: enter site like human
    await page.goto("https://www.naturalpavingstore.co.uk/", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    await page.waitForTimeout(5000);

    console.log("📄 Now fetching sitemap...");

    // Step 2: fetch sitemap using browser context
    const sitemapXML = await page.evaluate(async () => {
      const res = await fetch("/product-sitemap.xml");
      return await res.text();
    });

    if (!sitemapXML.includes("<urlset")) {
      console.log("❌ Still blocked by Cloudflare");
      return [];
    }

    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(sitemapXML);

    const urls = result.urlset.url.map((u) => u.loc[0]);

    console.log(`✅ Found ${urls.length} URLs`);

    return urls;

  } catch (err) {
    console.error("❌ Error:", err.message);
    return [];
  } finally {
    await browser.close();
  }
}

async function selectUrls(urls) {
  const answers = await inquirer.prompt([
    {
      type: "checkbox",
      name: "selected",
      message: "Select product URLs to track:",
      choices: urls.map((url) => ({
        name: url,
        value: url,
      })),
      pageSize: 20,
    },
  ]);

  return answers.selected;
}

function saveUrls(urls) {
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(urls, null, 2));
  console.log(`\n✅ Saved ${urls.length} URLs to ${OUTPUT_FILE}`);
}

function loadUrls() {
  if (!fs.existsSync(OUTPUT_FILE)) return [];
  return JSON.parse(fs.readFileSync(OUTPUT_FILE));
}

async function run() {
  const existing = loadUrls();

  if (existing.length > 0) {
    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: "What do you want to do?",
        choices: [
          "Use existing URLs",
          "Select new URLs",
          "View saved URLs",
        ],
      },
    ]);

    if (action === "Use existing URLs") {
      console.log("\n📦 Using saved URLs:");
      console.log(existing);
      return existing;
    }

    if (action === "View saved URLs") {
      console.log("\n📦 Saved URLs:");
      console.log(existing);
      return run();
    }
  }

  console.log("\n🌐 Fetching sitemap...");
  const urls = await fetchSitemapUrls();

  console.log(`✅ Found ${urls.length} URLs`);

  const selected = await selectUrls(urls);

  saveUrls(selected);

  return selected;
}

module.exports = run;