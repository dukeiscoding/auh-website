document.addEventListener("DOMContentLoaded", async () => {
    await fetchCatalog();
});

async function fetchCatalog() {
    console.log("Fetching catalog...");

    try {
        const response = await fetch("http://localhost:3000/catalog");
        const catalog = await response.json();

        console.log("Raw catalog data:", catalog);

        const catalogContainer = document.getElementById("catalog");

        if (!catalogContainer) {
            console.error("Catalog container not found.");
            return;
        }

        if (!Array.isArray(catalog) || catalog.length === 0) {
            catalogContainer.innerHTML = "<p>No items available.</p>";
            return;
        }

        catalogContainer.innerHTML = "";

        // Group items by category
        const groupedItems = {};

        catalog.forEach(item => {
            const category = item.category_name || "Uncategorized";
            if (!groupedItems[category]) {
                groupedItems[category] = [];
            }
            groupedItems[category].push(item);
        });

        // Render each group
        for (const category in groupedItems) {
            const categoryHeading = document.createElement("h2");
            categoryHeading.textContent = category.toUpperCase();
            categoryHeading.classList.add("categoryTitle");
            catalogContainer.appendChild(categoryHeading);

            const grid = document.createElement("div");
            grid.classList.add("catalogGrid");

            groupedItems[category].forEach(item => {
                const name = item.name || "Untitled";
                const description = item.description || "";
                const imageUrl = item.imageUrl || "images/placeholder.png";
                const price = item.price ? `$${item.price} ${item.currency || "USD"}` : "N/A";

                const itemCard = document.createElement("div");
                itemCard.classList.add("catalogCard");

                itemCard.innerHTML = `
                    <a href="product.html?id=${item.id}" class="catalogLink">
                        <div class="catalogImageWrap">
                            <img src="${imageUrl}" alt="${name}" class="catalogImage">
                        </div>
                        <h2>${name}</h2>
                        <p>${description}</p>
                        <strong>${price}</strong>
                    </a>
                `;

                grid.appendChild(itemCard);
            });

            catalogContainer.appendChild(grid);
        }

    } catch (error) {
        console.error("Failed to fetch catalog:", error);
        const catalogContainer = document.getElementById("catalog");
        if (catalogContainer) {
            catalogContainer.innerHTML = "<p>Failed to load items. Please try again later.</p>";
        }
    }
}