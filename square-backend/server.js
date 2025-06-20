const express = require("express");
const fetch = require("node-fetch");

const app = express();
const PORT = 3000;

// Replace with your actual token:
const SQUARE_TOKEN = "Bearer EAAAlzKRbNG-AW0OVlYvfCPjE9GfiG29dTvfbNdRt9OvgfI3g4ukrtKyrkPTipRC";

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*"); // for dev only
  next();
});

app.get("/products", async (req, res) => {
  try {
    const response = await fetch("https://connect.squareupsandbox.com/v2/catalog/list", {
      method: "GET",
      headers: {
        "Authorization": SQUARE_TOKEN,
        "Content-Type": "application/json",
        "Accept": "application/json"
      }
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});