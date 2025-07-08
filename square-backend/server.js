require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { Client } = require("square");

const app = express();
const port = 3000;

const client = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: process.env.SQUARE_ENVIRONMENT === "production" ? "production" : "sandbox",
});

app.use(cors());

app.get("/catalog", async (req, res) => {
  console.log("📦 Fetching catalog from Square...");

  try {
    const response = await client.catalogApi.listCatalog(undefined, "ITEM,ITEM_VARIATION,IMAGE,CATEGORY");
    const objects = response.result.objects || [];

    const items = objects.filter(obj => obj.type === "ITEM");
    const images = objects.filter(obj => obj.type === "IMAGE");
    const variations = objects.filter(obj => obj.type === "ITEM_VARIATION");
    const categories = objects.filter(obj => obj.type === "CATEGORY");

    const imageMap = {};
    for (const img of images) {
      imageMap[img.id] = img.imageData?.url || null;
    }

    const variationMap = {};
    for (const variation of variations) {
      const itemId = variation.itemVariationData?.itemId;
      if (!variationMap[itemId]) variationMap[itemId] = [];
      variationMap[itemId].push(variation);
    }

    const categoryLookup = {};
    for (const category of categories) {
      const name = category.categoryData?.name?.trim();
      const categoryId = category.id;

      // Map each item ID to its category name
      const itemsInCategory = category.categoryData?.items || [];
      for (const itemRef of itemsInCategory) {
        categoryLookup[itemRef.catalogObjectId] = name;
      }
    }

    const normalized = items.map(item => {
      const itemData = item.itemData;
      const imageId = itemData?.imageIds?.[0];
      const itemVariations = variationMap[item.id] || [];

      const categoryName = categoryLookup[item.id] || "Uncategorized";

      console.log("🔎 Item:", {
        name: itemData?.name,
        resolvedCategory: categoryName
      });

      const variationsFormatted = itemVariations.map(variation => {
        const vData = variation.itemVariationData;
        const priceMoney = vData?.priceMoney;
        return {
          id: variation.id,
          name: vData?.name || "Default",
          price: priceMoney && typeof priceMoney.amount !== "undefined"
            ? (Number(priceMoney.amount) / 100).toFixed(2)
            : null,
          currency: priceMoney?.currency || "USD"
        };
      });

      const defaultPrice = variationsFormatted[0]?.price || null;
      const defaultCurrency = variationsFormatted[0]?.currency || "USD";

      return {
        id: item.id,
        name: itemData?.name || "Unnamed Item",
        description: itemData?.description || "",
        imageUrl: imageMap[imageId] || null,
        price: defaultPrice,
        currency: defaultCurrency,
        variations: variationsFormatted,
        category_name: categoryName
      };
    });

    res.json(normalized);
  } catch (error) {
    console.error("❌ Error fetching catalog:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(port, () => {
  console.log(`🟢 Server listening on http://localhost:${port}`);
});