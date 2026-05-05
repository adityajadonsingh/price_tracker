async function scrapePaveDirect(page, url) {
  try {
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    await page.waitForTimeout(3000);

    const data = await page.evaluate(() => {
      const name =
        document.querySelector(".itemTitle h1")?.innerText.trim() || null;

      const rows = document.querySelectorAll(".pricingTable table tr");

      const variations = [];

      rows.forEach((row) => {
        const cells = row.querySelectorAll("td");
        if (!cells.length) return;

        const sizeText = cells[2]?.innerText.trim();

        // ❌ skip samples
        if (!sizeText || sizeText.toLowerCase().includes("sample")) return;

        const coverage = cells[4]?.innerText.trim();
        const thickness = cells[5]?.innerText.trim();

        const priceSpans = row.querySelectorAll(".multiPrice");

        const perM2 = priceSpans[0]?.innerText.trim();
        const perPack = priceSpans[2]?.innerText.trim();

        const stockText =
          row.querySelector(".inStock")?.innerText.toLowerCase() || "";

        const inStock = stockText.includes("in stock");

        variations.push(
          (() => {
            const raw = sizeText;

            // 🟢 Extract size (600x900)
            const sizeMatch = raw.match(/\d+\s*x\s*\d+/i);
            const cleanSize = sizeMatch
              ? sizeMatch[0].replace(/\s/g, "")
              : null;

            // 🟢 Extract pieces (40pcs / 52pcs)
            const piecesMatch = raw.match(/(\d+)\s*pcs/i);
            const pieces = piecesMatch ? Number(piecesMatch[1]) : null;

            return {
              rawSize: raw, // keep original for debug
              size: cleanSize,
              pieces, // ✅ NEW FIELD
              coverage,
              thickness,
              pricePerM2: perM2 ? Number(perM2.replace(/[^0-9.]/g, "")) : null,
              price: perPack ? Number(perPack.replace(/[^0-9.]/g, "")) : null,
              inStock,
            };
          })(),
        );
      });

      return {
        name,
        variations,
      };
    });

    return data;
  } catch (err) {
    return {
      name: null,
      variations: [],
      error: true,
    };
  }
}

module.exports = scrapePaveDirect;
