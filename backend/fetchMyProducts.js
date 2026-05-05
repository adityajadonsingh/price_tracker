const fs = require("fs");
const axios = require("axios");

const BASE_URL = "https://admin.stonecera.co.uk/api/products";
const TOKEN = process.env.STRAPI_TOKEN;

async function fetchProducts() {
  let page = 1;
  const pageSize = 100;

  const allProducts = [];

  while (true) {
    console.log(`📦 Fetching page ${page}...`);

    const res = await axios.get(BASE_URL, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
      params: {
        publicationState: "live",
        populate: "deep,3",
        page,
        pageSize,
      },
    });

    const products = res.data.products || [];

    if (products.length === 0) break;

    products.forEach((item) => {
      const product = item.product;
      const variations = item.variations || [];

      const formatted = {
        name: product.name,
        variations: variations.map((v) => ({
          size: v.Size || "",
          thickness: v.Thickness || "",
          price: Number(v.Price) || 0,
          stock: v.Stock || 0,
          sku: v.SKU || "",
        })),
      };

      allProducts.push(formatted);
    });

    page++;
  }

  fs.writeFileSync("myProducts.json", JSON.stringify(allProducts, null, 2));

  console.log("✅ Saved myProducts.json");
}

fetchProducts();