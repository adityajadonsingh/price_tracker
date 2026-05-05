const { chromium } = require("playwright");

async function scrapePavingSuperstore(url) {
  // 👇 use real Chrome profile
  const context = await chromium.launchPersistentContext(
    "./chrome-profile", // folder will be created
    {
      headless: false, // IMPORTANT for first run
      args: ["--start-maximized"],
      viewport: null,
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      locale: "en-GB",
      timezoneId: "Europe/London",
    }
  );

  const page = await context.newPage();

  try {
    console.log("🌐 Opening:", url);

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    // 🧠 WAIT for Cloudflare manually
    console.log("⏳ Waiting for Cloudflare...");
    await page.waitForTimeout(15000);

    // 🧪 check if still blocked
    const html = await page.content();

    if (html.includes("Just a moment")) {
      console.log("❌ Still blocked");
      return { error: true, blocked: true };
    }

    console.log("✅ Cloudflare passed");

    
    await page.mouse.move(200, 300);
    await page.waitForTimeout(2000);
    await page.mouse.wheel(0, 500);

    const data = await page.evaluate(() => {
      const name =
        document
          .querySelector(".pack-item-product-or-sample .title")
          ?.innerText.trim() || null;

      const variations = [];

      const items = document.querySelectorAll(".pack-option-item");

      items.forEach((item) => {
        const size = item
          .querySelector(".pack-option-item-details-pack-type")
          ?.innerText.trim();

        const coverage = item
          .querySelector(".pack-option-item-details-pack-coverage")
          ?.innerText.replace("Coverage:", "")
          .trim();

        const pricePerM2 = item.getAttribute("data-price");

        const packPriceText = item.querySelector(
          ".pack-option-item-price-per-pack .pack-item-price"
        )?.innerText;

        const packPrice = packPriceText
          ? parseFloat(packPriceText.replace(/[^0-9.]/g, ""))
          : null;

        if (!size || size.toLowerCase().includes("sample")) return;

        variations.push({
          size,
          coverage,
          pricePerM2: pricePerM2 ? parseFloat(pricePerM2) : null,
          packPrice,
          inStock: true,
        });
      });

      return { name, variations };
    });

    return data;
  } catch (err) {
    console.log("❌ Error:", err.message);
    return { error: true };
  } finally {
    // ⚠️ do NOT close context on first run if you want session saved
    // await context.close();
  }
}

module.exports = scrapePavingSuperstore;