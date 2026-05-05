const fetchOG = async (page, url) => {
  try {
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    // ⏳ wait for JS + possible Cloudflare
    await page.waitForTimeout(5000);

    // 🚫 Detect Cloudflare block
    const isBlocked = await page.evaluate(() => {
      return document.body.innerText.includes("Just a moment");
    });

    if (isBlocked) {
      console.log("🚫 Blocked by Cloudflare:", url);
      return {
        title: "Blocked",
        image: null,
        description: null,
      };
    }

    // ✅ Extract OG / fallback
    const data = await page.evaluate(() => {
      const getMeta = (prop) => {
        const el =
          document.querySelector(`meta[property="${prop}"]`) ||
          document.querySelector(`meta[name="${prop}"]`);
        return el?.content || null;
      };

      return {
        title:
          getMeta("og:title") ||
          document.querySelector("h1")?.innerText ||
          document.title ||
          "No title",
        image: getMeta("og:image"),
        description: getMeta("og:description") || "",
      };
    });

    return data;
  } catch (err) {
    console.log("❌ OG error:", url);
    return {
      title: null,
      image: null,
      description: null,
    };
  }
};

module.exports = fetchOG;