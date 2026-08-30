/* ============================================================
   BEL-AIR — CART.JS
   Affichage du panier (produits lus depuis Firestore, quantités
   stockées en LocalStorage), modification des quantités,
   suppression, calcul du total.
   ============================================================ */

async function renderCart() {
  const items = await getCartDetails();
  const container = document.getElementById("cart-content");

  if (items.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="glyph">🛒</div>
        <h2>Votre panier est vide</h2>
        <p class="muted">Parcourez nos produits et ajoutez vos coups de cœur.</p>
        <a href="products.html" class="btn btn-primary">Voir les produits</a>
      </div>`;
    return;
  }

  const rows = items
    .map(
      (item) => `
      <div class="cart-item" data-id="${item.product.id}">
        <img src="${item.product.image}" alt="${escapeHtml(item.product.name)}">
        <div>
          <div class="cart-item-name">${escapeHtml(item.product.name)}</div>
          <div class="muted">${escapeHtml(item.product.category)}</div>
          <div class="cart-item-price">${formatPrice(item.product.price)}</div>
        </div>
        <div class="qty-selector">
          <button type="button" class="qty-minus" aria-label="Diminuer">−</button>
          <input type="number" class="qty-input" value="${item.quantity}" min="1">
          <button type="button" class="qty-plus" aria-label="Augmenter">+</button>
        </div>
        <div style="text-align:right;">
          <div style="font-weight:800;margin-bottom:8px;">${formatPrice(item.subtotal)}</div>
          <button class="btn btn-danger btn-sm remove-item">Supprimer</button>
        </div>
      </div>`
    )
    .join("");

  const total = items.reduce((sum, i) => sum + i.subtotal, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  container.innerHTML = `
    <div class="cart-layout">
      <div class="panel">${rows}</div>
      <div class="cart-summary">
        <h3>Résumé</h3>
        <div class="summary-row"><span>Articles</span><span>${count}</span></div>
        <div class="summary-row total"><span>Total</span><span>${formatPrice(total)}</span></div>
        <a href="checkout.html" class="btn btn-primary btn-block" style="margin-top:16px;">Passer la commande</a>
        <a href="products.html" class="btn btn-ghost btn-block" style="margin-top:10px;">Continuer mes achats</a>
      </div>
    </div>`;

  attachCartEvents();
}

function attachCartEvents() {
  document.querySelectorAll(".cart-item").forEach((row) => {
    const id = row.dataset.id;
    const input = row.querySelector(".qty-input");

    row.querySelector(".qty-minus").addEventListener("click", () => {
      const newQty = Math.max(1, parseInt(input.value || "1", 10) - 1);
      updateCartItemQuantity(id, newQty);
      renderCart();
    });
    row.querySelector(".qty-plus").addEventListener("click", () => {
      const newQty = parseInt(input.value || "1", 10) + 1;
      updateCartItemQuantity(id, newQty);
      renderCart();
    });
    input.addEventListener("change", () => {
      const newQty = Math.max(1, parseInt(input.value || "1", 10));
      updateCartItemQuantity(id, newQty);
      renderCart();
    });
    row.querySelector(".remove-item").addEventListener("click", () => {
      removeFromCart(id);
      showToast("Produit retiré du panier");
      renderCart();
    });
  });
}

document.addEventListener("DOMContentLoaded", renderCart);
