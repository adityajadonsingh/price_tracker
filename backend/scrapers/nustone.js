async function scrapeNuStone(page, url) {
  try {
    console.log("🌐 Scraping NuStone:", url);

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    await page.waitForTimeout(4000);

    const data = await page.evaluate(() => {
      const name = document.querySelector("h1")?.innerText.trim() || null;

      let cratePrice = null;
      let inStock = true;

      const bodyText = document.body.innerText.toLowerCase();

      // 🛑 STOCK CHECK
      if (
        bodyText.includes("out of stock") ||
        bodyText.includes("please contact us")
      ) {
        inStock = false;
      }

      // 🥇 METHOD 1 — DIRECT CRATE LABEL (BEST)
      const labels = Array.from(document.querySelectorAll("label"));

      for (const label of labels) {
        const text = label.innerText.toLowerCase();

        if (text.includes("crate") && text.includes("£")) {
          const match = text.match(/£\s?\d+(\.\d{1,2})?/);
          if (match) {
            cratePrice = parseFloat(match[0].replace(/[^0-9.]/g, ""));
            break;
          }
        }
      }

      // 🥈 METHOD 2 — SALE / NORMAL PRICE BLOCK
      if (!cratePrice) {
        const container = document.querySelector(
          "div.tw-mt-3.tw-flex.tw-flex-col.tw-font-poppins",
        );

        if (container) {
          const spans = container.querySelectorAll("span");

          const validPrices = [];

          spans.forEach((span) => {
            const text = span.innerText;

            if (!text.includes("£")) return;

            const isOld =
              span.classList.contains("tw-line-through") ||
              window
                .getComputedStyle(span)
                .textDecoration.includes("line-through");

            if (isOld) return;

            const num = parseFloat(text.replace(/[^0-9.]/g, ""));

            if (!isNaN(num) && num > 100) {
              validPrices.push(num);
            }
          });

          if (validPrices.length > 0) {
            cratePrice = validPrices[validPrices.length - 1];
          }
        }
      }

      if (!cratePrice) {
        const bodyText = document.body.innerText;

        // 🟢 find crate size (e.g. "23.50M² CRATE")
        const sizeMatch = bodyText.match(/([\d.]+)\s*m²\s*crate/i);

        const priceMatch = bodyText.match(/£\s?\d+(\.\d{1,2})?\s*\/\s*m/);

        if (sizeMatch && priceMatch) {
          const crateSize = parseFloat(sizeMatch[1]);
          const perM2 = parseFloat(priceMatch[0].replace(/[^0-9.]/g, ""));

          cratePrice = Math.round(perM2 * crateSize);
        }
      }

      return {
        name,
        cratePrice,
        inStock,
      };
    });

    return {
      name: data.name,
      variations: [
        {
          type: "crate",
          price: data.cratePrice,
          inStock: data.inStock,
        },
      ],
    };
  } catch (err) {
    console.log("❌ NuStone error:", err.message);
    return { error: true };
  } 
}

module.exports = scrapeNuStone;
