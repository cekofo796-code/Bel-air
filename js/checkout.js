/* ============================================================
   BEL-AIR — CHECKOUT.JS
   Formulaire client, résumé de commande, enregistrement de la
   commande dans Firestore puis ouverture de WhatsApp.
   ============================================================ */

async function renderCheckout() {
  const items = await getCartDetails();
  const container = document.getElementById("checkout-content");

  if (items.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="glyph">🛒</div>
        <h2>Votre panier est vide</h2>
        <p class="muted">Ajoutez des produits avant de passer commande.</p>
        <a href="products.html" class="btn btn-primary">Voir les produits</a>
      </div>`;
    return;
  }

  const total = items.reduce((sum, i) => sum + i.subtotal, 0);

  const summaryRows = items
    .map(
      (item) => `
      <div class="order-summary-item">
        <span>${escapeHtml(item.product.name)} × ${item.quantity}</span>
        <span>${formatPrice(item.subtotal)}</span>
      </div>`
    )
    .join("");

  container.innerHTML = `
    <div class="checkout-layout">
      <form class="panel" id="checkout-form" novalidate>
        <div class="form-grid">
          <div class="form-group">
            <label for="nom">Nom *</label>
            <input class="input" type="text" id="nom" required>
          </div>
          <div class="form-group">
            <label for="prenom">Prénom *</label>
            <input class="input" type="text" id="prenom" required>
          </div>
          <div class="form-group">
            <label for="telephone">Numéro de téléphone *</label>
            <input class="input" type="tel" id="telephone" required>
          </div>
          <div class="form-group">
            <label for="ville">Ville *</label>
            <input class="input" type="text" id="ville" required>
          </div>
          <div class="form-group">
            <label for="commune">Commune *</label>
            <input class="input" type="text" id="commune" required>
          </div>
          <div class="form-group">
            <label for="quartier">Quartier *</label>
            <input class="input" type="text" id="quartier" required>
          </div>
          <div class="form-group full">
            <label for="adresse">Adresse *</label>
            <input class="input" type="text" id="adresse" required>
          </div>
          <div class="form-group full">
            <label for="infos">Informations supplémentaires</label>
            <textarea class="input" id="infos" rows="3"></textarea>
          </div>
        </div>
        <button type="submit" class="btn btn-whatsapp btn-block" id="submit-order-btn">Commander via WhatsApp</button>
      </form>

      <div class="order-summary-card">
        <h3>Récapitulatif</h3>
        ${summaryRows}
        <div class="summary-row total"><span>Total</span><span>${formatPrice(total)}</span></div>
      </div>
    </div>`;

  document.getElementById("checkout-form").addEventListener("submit", handleCheckoutSubmit);
}

async function handleCheckoutSubmit(e) {
  e.preventDefault();
  const form = e.target;
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const submitBtn = document.getElementById("submit-order-btn");
  submitBtn.disabled = true;
  submitBtn.textContent = "Envoi en cours...";

  const customer = {
    nom: document.getElementById("nom").value.trim(),
    prenom: document.getElementById("prenom").value.trim(),
    telephone: document.getElementById("telephone").value.trim(),
    ville: document.getElementById("ville").value.trim(),
    commune: document.getElementById("commune").value.trim(),
    quartier: document.getElementById("quartier").value.trim(),
    adresse: document.getElementById("adresse").value.trim(),
    infos: document.getElementById("infos").value.trim()
  };

  try {
    const items = await getCartDetails();
    const orderItems = items.map((item) => ({
      productId: item.product.id,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity
    }));
    const total = items.reduce((sum, i) => sum + i.subtotal, 0);

    const order = await createOrder(customer, orderItems, total);
    openWhatsAppOrder(order);
    clearCart();

    const container = document.getElementById("checkout-content");
    container.innerHTML = `
      <div class="empty-state">
        <div class="glyph">✅</div>
        <h2>Commande #${order.orderNumber} envoyée !</h2>
        <p class="muted">Votre commande a été enregistrée. Envoyez le message WhatsApp qui vient de s'ouvrir pour confirmer votre commande auprès de BEL-AIR.</p>
        <a href="products.html" class="btn btn-primary">Continuer mes achats</a>
      </div>`;
  } catch (err) {
    console.error(err);
    showToast("Erreur lors de l'envoi de la commande. Réessayez.");
    submitBtn.disabled = false;
    submitBtn.textContent = "Commander via WhatsApp";
  }
}

document.addEventListener("DOMContentLoaded", renderCheckout);
