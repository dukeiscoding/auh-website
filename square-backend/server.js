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
    const response = await client.catalogApi.listCatalog(undefined, "ITEM,ITEM_VARIATION,IMAGE");
    const objects = response.result.objects || [];

    const items = objects.filter(obj => obj.type === "ITEM");
    const images = objects.filter(obj => obj.type === "IMAGE");
    const variations = objects.filter(obj => obj.type === "ITEM_VARIATION");

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

    const normalized = items.map(item => {
      const itemData = item.itemData;
      const imageId = itemData?.imageIds?.[0];
      const itemVariations = variationMap[item.id] || [];

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
        variations: variationsFormatted
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