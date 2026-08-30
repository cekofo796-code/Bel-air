/* ============================================================
   BEL-AIR — PRODUCTS.JS
   Affichage du catalogue, recherche par nom, filtre par catégorie.
   ============================================================ */

function renderProductGrid() {
  const products = getProducts();
  const grid = document.getElementById("product-grid");
  const emptyMsg = document.getElementById("empty-message");
  const search = document.getElementById("search-input").value.trim().toLowerCase();
  const category = document.getElementById("category-filter").value;

  const filtered = products.filter((p) => {
    const matchesSearch = !search || p.name.toLowerCase().includes(search);
    const matchesCategory = !category || p.category === category;
    return matchesSearch && matchesCategory;
  });

  grid.innerHTML = filtered
    .map(
      (p) => `
      <div class="product-card">
        <a href="product.html?id=${p.id}" class="product-thumb"><img src="${p.image}" alt="${escapeHtml(p.name)}"></a>
        <div class="product-body">
          <span class="product-category">${escapeHtml(p.category)}</span>
          <h3 class="product-name">${escapeHtml(p.name)}</h3>
          <span class="product-price">${formatPrice(p.price)}</span>
          <div class="product-actions">
            <a href="product.html?id=${p.id}" class="btn btn-ghost">Voir</a>
            <button class="btn btn-primary" onclick="addToCart('${p.id}');showToast('Ajouté au panier');">Ajouter</button>
          </div>
        </div>
      </div>`
    )
    .join("");

  emptyMsg.style.display = filtered.length === 0 ? "block" : "none";
}

function populateCategoryFilter() {
  const select = document.getElementById("category-filter");
  const categories = [...new Set(getProducts().map((p) => p.category))];
  categories.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    select.appendChild(opt);
  });

  const preset = getQueryParam("category");
  if (preset && categories.includes(preset)) {
    select.value = preset;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  populateCategoryFilter();
  renderProductGrid();

  document.getElementById("search-input").addEventListener("input", renderProductGrid);
  document.getElementById("category-filter").addEventListener("change", renderProductGrid);
});
