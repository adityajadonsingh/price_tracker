const extractOG = async (page) => {
  try {
    // 🚫 NO page.goto here

    // ⏳ small wait (page already loaded, but let JS settle)
    await page.waitForTimeout(1000);

    // 🚫 Detect Cloudflare
    const isBlocked = await page.evaluate(() => {
      return document.body.innerText.includes("Just a moment");
    });

    if (isBlocked) {
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
    return {
      title: null,
      image: null,
      description: null,
    };
  }
};

module.exports = extractOG;