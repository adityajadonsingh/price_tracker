async function scrapeNuStone(page) {
  try {
    await page.waitForTimeout(4000);

    const data = await page.evaluate(() => {
      const bodyText = document.body.innerText.toLowerCase();

      const name =
        document.querySelector("h1")?.innerText.trim() || null;

      let inStock = true;

      if (
        bodyText.includes("out of stock") ||
        bodyText.includes("please contact us")
      ) {
        inStock = false;
      }

      // ======================================================
      // PRICE EXTRACTION
      // ======================================================

      let price = null;

      // 🆕 METHOD 1 — NEW SALE/NORMAL LAYOUT
      const salePriceContainer = document.querySelector(
        "p.tw-text-xl.tw-font-bold.tw-text-black",
      );

      if (salePriceContainer) {
        const spans = Array.from(
          salePriceContainer.querySelectorAll("span"),
        );

        const validPrices = [];

        spans.forEach((span) => {
          const text = span.textContent?.trim() || "";

          if (!text.includes("£")) return;

          const isOld =
            span.classList.contains("tw-line-through") ||
            window
              .getComputedStyle(span)
              .textDecoration
              .includes("line-through");

          if (isOld) return;

          const num = parseFloat(
            text.replace(/[^0-9.]/g, ""),
          );

          if (!isNaN(num) && num > 100) {
            validPrices.push(num);
          }
        });

        if (validPrices.length > 0) {
          price = validPrices[validPrices.length - 1];
        }
      }

      // 🆕 METHOD 2 — EXISTING LAYOUT
      if (!price) {
        const priceContainer = document.querySelector(
          ".tw-mt-4.tw-flex.tw-flex-row.tw-gap-x-3.tw-items-center",
        );

        if (priceContainer) {
          const finalPrice =
            priceContainer.querySelector(".tw-text-3xl");

          if (finalPrice) {
            price = parseFloat(
              finalPrice.innerText.replace(/[^0-9.]/g, ""),
            );
          }
        }
      }

      // ======================================================
      // SPECIFICATION TABLE
      // ======================================================

      const specs = {};

      const allDivs = Array.from(
        document.querySelectorAll("div"),
      );

      const specBox = allDivs.find((div) => {
        const heading = div.querySelector("h2");

        return (
          heading &&
          heading.innerText
            .toLowerCase()
            .includes("specifications")
        );
      });

      if (specBox) {
        const rows =
          specBox.querySelectorAll(".tw-flex.tw-flex-row");

        rows.forEach((row) => {
          const cols = row.querySelectorAll("div");

          if (cols.length >= 2) {
            const key = cols[0]
              .innerText.trim()
              .toLowerCase()
              .replace(":", "");

            const value = cols[1].innerText.trim();

            if (key && value) {
              specs[key] = value;
            }
          }
        });
      }

      // ======================================================
      // NORMALIZED DATA
      // ======================================================

      const size = specs["size"] || null;

      const thickness =
        specs["thickness"] || null;

      const finish =
        specs["finish"] || null;

      const pieces = specs["tiles per crate"]
        ? Number(
            specs["tiles per crate"].replace(
              /[^0-9]/g,
              "",
            ),
          )
        : null;

      // ======================================================
      // COVERAGE EXTRACTION
      // ======================================================

      let coverage = null;

      // 🆕 METHOD 1 — BODY TEXT
      const coverageMatch =
        document.body.innerText.match(
          /([\d.]+)\s*m²\s*crate/i,
        );

      if (coverageMatch) {
        coverage = Number(coverageMatch[1]);
      }

      // 🆕 METHOD 2 — PRODUCT CODE
      if (!coverage && specs["product code"]) {
        const match =
          specs["product code"].match(
            /-(\d+(\.\d+)?)$/,
          );

        if (match) {
          coverage = Number(match[1]);
        }
      }

      // ======================================================
      // SKU
      // ======================================================

      const sku =
        specs["product code"] || null;

      // ======================================================
      // PRICE PER M2
      // ======================================================

      let pricePerM2 = null;

      if (coverage && price) {
        pricePerM2 = Number(
          (price / coverage).toFixed(2),
        );
      }

      return {
        name,

        productType: "single",

        variations: [
          {
            label: size || "crate",

            size,

            thickness,

            finish,

            pieces,

            coverage,

            price,

            pricePerM2,

            inStock,

            sku,
          },
        ],
      };
    });

    return data;
  } catch (err) {
    console.log("❌ NuStone error:", err.message);

    return {
      name: null,
      productType: "single",
      variations: [],
      error: true,
    };
  }
}

module.exports = scrapeNuStone;