const productGrid = document.getElementById("productGrid");

fetch("http://localhost:3000/products")
  .then(res => res.json())
  .then(data => {
  console.log("Square API response:", data);

  if (!data.objects) {
    productGrid.innerHTML = "<p>No products found or invalid response from Square.</p>";
    return;
  }

  const items = data.objects.filter(obj => obj.type === "ITEM");

    items.forEach(item => {
      const name = item.item_data.name;
      const id = item.id;

      // Optional: use description if available
      const description = item.item_data.description || "";

      // Use a placeholder if no image (Square doesn't always provide one)
      const image = item.item_data.image_url || "images/placeholder.jpg";

      // Price is stored in cents — convert to dollars
      const price = item.item_data.variations?.[0]?.item_variation_data?.price_money?.amount || 0;
      const formattedPrice = `$${(price / 100).toFixed(2)}`;

      // Create a product card
      const card = document.createElement("div");
      card.classList.add("product-card");

      card.innerHTML = `
        <a href="product.html?id=${id}">
          <img src="${image}" alt="${name}" />
          <h3>${name}</h3>
          <p>${formattedPrice}</p>
        </a>
      `;

      productGrid.appendChild(card);
    });
  })
  .catch(err => {
    console.error("Error fetching products:", err);
    productGrid.innerHTML = "<p>Could not load products. Try again later.</p>";
  });