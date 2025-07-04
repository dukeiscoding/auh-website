document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get("id");

  if (!productId) {
    document.getElementById("productContainer").innerHTML = "<p>Product not found.</p>";
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/catalog");
    const catalog = await response.json();

    const product = catalog.find(item => item.id === productId);

    if (!product) {
      document.getElementById("productContainer").innerHTML = "<p>Product not found.</p>";
      return;
    }

    const variations = product.variations || [];
    const hasMultiple = variations.length > 1;
    const defaultVariation = variations[0] || {};
    const defaultPrice = defaultVariation.price || "N/A";
    const defaultCurrency = defaultVariation.currency || "USD";

    const variationSelector = hasMultiple
      ? `
        <label for="variantSelect">Select Option:</label>
        <select id="variantSelect" class="sizeSelect">
          ${variations.map(v => `<option value="${v.id}">${v.name}</option>`).join("")}
        </select>
      `
      : `<input type="hidden" id="variantSelect" value="${defaultVariation.id}">`;

    document.getElementById("productContainer").innerHTML = `
      <div class="productCard">
        <div class="productImageWrap">
          <img src="${product.imageUrl}" alt="${product.name}" class="productImage">
        </div>
        <div class="productDetails">
          <h1 class="productName">${product.name}</h1>
          <p class="productDescription">${product.description}</p>
          <strong class="productPrice">$${defaultPrice} ${defaultCurrency}</strong>

          ${variationSelector}

          <button class="addToCartBtn">Add to Cart</button>
        </div>
      </div>
    `;

    document.querySelector(".addToCartBtn").addEventListener("click", () => {
      const selectedId = document.getElementById("variantSelect").value;
      const selected = variations.find(v => v.id === selectedId);
      const selectedName = selected?.name || "Default";
      alert(`Added to cart: ${product.name} (${selectedName})`);
      // 🔜 TODO: add cart storage logic here
    });

  } catch (error) {
    console.error("Error loading product:", error);
    document.getElementById("productContainer").innerHTML = "<p>Error loading product.</p>";
  }
});