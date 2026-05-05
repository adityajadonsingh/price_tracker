async function scrapeNaturalPaving(page, url) {
  try {
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    // 🧠 wait until product content actually appears
    await page.waitForSelector(".product-title, h1", {
      timeout: 15000,
    });

    let data;

    try {
      data = await page.evaluate(() => {
        const bodyText = document.body.innerText.toLowerCase();

        const isOutOfStock =
          bodyText.includes("out of stock") ||
          bodyText.includes("unavailable") ||
          bodyText.includes("sold out");

        const name =
          document.querySelector(".product-title")?.textContent.trim() ||
          document.querySelector("h1")?.innerText.trim() ||
          null;

        const size =
          document.querySelector(".product-subtitle")?.textContent.trim() ||
          null;

        let pieces = null;
        let coverage = null;

        // 🟢 PRIMARY (from title)
        if (name) {
          const slabsMatch = name.match(/(\d+)\s*slabs?/i);
          if (slabsMatch) pieces = Number(slabsMatch[1]);

          const coverageMatch = name.match(/=\s*(\d+(\.\d+)?)\s*sqm/i);
          if (coverageMatch) coverage = Number(coverageMatch[1]);
        }

        // 🔥 FALLBACK (from packline selector)
        if (!pieces || !coverage) {
          const packLine =
            document.querySelector('[data-out="packline"]')?.innerText || "";

          if (packLine) {
            // extract pcs
            const pcsMatch = packLine.match(/(\d+)\s*pcs/i);
            if (pcsMatch) pieces = Number(pcsMatch[1]);

            // extract m²
            const coverageMatch = packLine.match(/\((\d+(\.\d+)?)\s*m²\)/i);
            if (coverageMatch) coverage = Number(coverageMatch[1]);
          }
        }

        const calcPrice = document.querySelector('[data-out="price"]');
        if (calcPrice) {
          return {
            name,
            size,
            pieces,
            coverage,
            price: calcPrice.textContent.trim(),
            inStock: true,
          };
        }

        const normalPrice = document.querySelector(".price");
        if (normalPrice) {
          const match = normalPrice.innerText.match(/£\s?\d+(\.\d{1,2})?/);
          if (match) {
            return {
              name,
              size,
              pieces,
              coverage,
              price: match[0],
              inStock: !isOutOfStock,
            };
          }
        }

        const match = document.body.innerText.match(/£\s?\d+(\.\d{1,2})?/);

        if (match) {
          return {
            name,
            size,
            pieces,
            coverage,
            price: match[0],
            inStock: !isOutOfStock,
          };
        }

        return null;
      });
    } catch (e) {
      data = null;
    }

    // 🔥 fallback retry
    if (!data) {
      await page.waitForTimeout(2000);

      data = await page.evaluate(() => {
        const match = document.body.innerText.match(/£\s?\d+(\.\d{1,2})?/);
        return match
          ? {
              name: document.title,
              size: null,
              pieces: null,
              coverage: null,
              price: match[0],
              inStock: true,
            }
          : null;
      });
    }

    return (
      data || {
        name: null,
        size: null,
        price: null,
        inStock: false,
        error: true,
      }
    );

    return data;
  } catch (err) {
    return { name: null, size: null, price: null, inStock: false, error: true };
  }
}

module.exports = scrapeNaturalPaving;
