/* ============================================================
   BEL-AIR — PRODUCT.JS
   Affichage du détail d'un produit à partir de son ID dans l'URL
   (product.html?id=xxx), lu depuis Firestore.
   ============================================================ */

let currentProduct = null;

async function renderProductDetail() {
  const id = getQueryParam("id");
  const product = id ? await getProductById(id) : null;
  const container = document.getElementById("product-container");
  const notFound = document.getElementById("not-found");

  if (!product) {
    container.style.display = "none";
    notFound.style.display = "block";
    return;
  }

  currentProduct = product;
  document.getElementById("crumb-name").textContent = product.name;
  document.title = `${product.name} — BEL-AIR`;

  container.innerHTML = `
    <div class="product-detail">
      <div class="product-detail-image">
        <img src="${product.image}" alt="${escapeHtml(product.name)}">
      </div>
      <div class="product-detail-info">
        <span class="product-category">${escapeHtml(product.category)}</span>
        <h1>${escapeHtml(product.name)}</h1>
        <div class="product-detail-price">${formatPrice(product.price)}</div>
        <p class="muted">${escapeHtml(product.description)}</p>

        <div class="qty-selector">
          <button type="button" id="qty-minus" aria-label="Diminuer">−</button>
          <input type="number" id="qty-input" value="1" min="1">
          <button type="button" id="qty-plus" aria-label="Augmenter">+</button>
        </div>

        <div>
          <button class="btn btn-primary btn-block" id="add-to-cart-btn">Ajouter au panier</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById("qty-minus").addEventListener("click", () => {
    const input = document.getElementById("qty-input");
    input.value = Math.max(1, parseInt(input.value || "1", 10) - 1);
  });
  document.getElementById("qty-plus").addEventListener("click", () => {
    const input = document.getElementById("qty-input");
    input.value = parseInt(input.value || "1", 10) + 1;
  });
  document.getElementById("add-to-cart-btn").addEventListener("click", () => {
    const qty = Math.max(1, parseInt(document.getElementById("qty-input").value || "1", 10));
    addToCart(currentProduct.id, qty);
    showToast("Ajouté au panier");
  });
}

document.addEventListener("DOMContentLoaded", renderProductDetail);
