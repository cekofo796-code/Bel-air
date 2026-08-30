/* ============================================================
   BEL-AIR — ADMIN.JS
   Connexion admin, tableau de bord, gestion des produits
   (ajout/modification/suppression + image en base64) et
   gestion des commandes (statuts, détails, suppression).
   ============================================================ */

let uploadedImageData = null;

/* ---------- Connexion ---------- */

function checkAdminSession() {
  const isLoggedIn = sessionStorage.getItem(LS_KEYS.ADMIN_SESSION) === "1";
  document.getElementById("login-screen").style.display = isLoggedIn ? "none" : "flex";
  document.getElementById("admin-shell").style.display = isLoggedIn ? "grid" : "none";
  if (isLoggedIn) {
    refreshAllViews();
  }
}

function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value;
  const errorEl = document.getElementById("login-error");

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    sessionStorage.setItem(LS_KEYS.ADMIN_SESSION, "1");
    errorEl.textContent = "";
    checkAdminSession();
  } else {
    errorEl.textContent = "Identifiants incorrects. Réessayez.";
  }
}

function handleLogout() {
  sessionStorage.removeItem(LS_KEYS.ADMIN_SESSION);
  checkAdminSession();
}

/* ---------- Navigation entre vues ---------- */

function switchAdminView(view) {
  document.querySelectorAll(".admin-view").forEach((v) => v.classList.remove("is-active"));
  document.getElementById(`view-${view}`).classList.add("is-active");
  document.querySelectorAll(".admin-nav-btn[data-view]").forEach((b) => b.classList.remove("is-active"));
  document.querySelector(`.admin-nav-btn[data-view="${view}"]`).classList.add("is-active");
}

function refreshAllViews() {
  renderDashboard();
  renderProductsTable();
  renderOrdersTable();
}

/* ---------- Dashboard ---------- */

function renderDashboard() {
  const products = getProducts();
  const orders = getOrders();
  const revenue = orders.reduce((sum, o) => sum + o.total, 0);

  document.getElementById("stat-products").textContent = products.length;
  document.getElementById("stat-orders").textContent = orders.length;
  document.getElementById("stat-new").textContent = orders.filter((o) => o.status === "Nouvelle").length;
  document.getElementById("stat-delivered").textContent = orders.filter((o) => o.status === "Livrée").length;
  document.getElementById("stat-revenue").textContent = formatPrice(revenue);

  const recent = orders.slice(0, 5);
  const recentContainer = document.getElementById("dashboard-recent-orders");
  recentContainer.innerHTML = recent.length
    ? `<table class="admin-table"><thead><tr><th>N°</th><th>Client</th><th>Date</th><th>Total</th><th>Statut</th></tr></thead><tbody>
        ${recent
          .map(
            (o) => `<tr>
              <td>#${o.orderNumber}</td>
              <td>${escapeHtml(o.customer.nom)} ${escapeHtml(o.customer.prenom)}</td>
              <td>${formatDate(o.date)}</td>
              <td>${formatPrice(o.total)}</td>
              <td><span class="status-pill status-${o.status.replace(" ", "-")}">${o.status}</span></td>
            </tr>`
          )
          .join("")}
      </tbody></table>`
    : `<p class="muted">Aucune commande pour le moment.</p>`;
}

/* ---------- Produits ---------- */

function renderProductsTable() {
  const products = getProducts();
  const tbody = document.getElementById("products-table-body");

  tbody.innerHTML = products.length
    ? products
        .map(
          (p) => `
        <tr>
          <td><img class="table-thumb" src="${p.image}" alt="${escapeHtml(p.name)}"></td>
          <td>${escapeHtml(p.name)}</td>
          <td>${escapeHtml(p.category)}</td>
          <td>${formatPrice(p.price)}</td>
          <td>${formatDate(p.createdAt)}</td>
          <td class="table-actions">
            <button class="btn btn-ghost btn-sm" onclick="openProductModal('${p.id}')">✏️ Modifier</button>
            <button class="btn btn-danger btn-sm" onclick="handleDeleteProduct('${p.id}')">🗑 Supprimer</button>
          </td>
        </tr>`
        )
        .join("")
    : `<tr><td colspan="6" class="muted" style="text-align:center;padding:30px;">Aucun produit. Cliquez sur "Ajouter un produit" pour commencer.</td></tr>`;

  const categoryList = document.getElementById("category-list");
  const categories = [...new Set(products.map((p) => p.category))];
  categoryList.innerHTML = categories.map((c) => `<option value="${escapeHtml(c)}">`).join("");
}

function openProductModal(productId) {
  const modal = document.getElementById("product-modal");
  const form = document.getElementById("product-form");
  form.reset();
  uploadedImageData = null;
  document.getElementById("image-preview").classList.remove("is-visible");
  document.getElementById("image-preview").src = "";

  if (productId) {
    const product = getProductById(productId);
    document.getElementById("product-modal-title").textContent = "Modifier le produit";
    document.getElementById("product-id").value = product.id;
    document.getElementById("product-name").value = product.name;
    document.getElementById("product-description").value = product.description;
    document.getElementById("product-price").value = product.price;
    document.getElementById("product-category").value = product.category;
    uploadedImageData = product.image;
    document.getElementById("image-preview").src = product.image;
    document.getElementById("image-preview").classList.add("is-visible");
  } else {
    document.getElementById("product-modal-title").textContent = "Ajouter un produit";
    document.getElementById("product-id").value = "";
  }

  modal.classList.add("is-open");
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove("is-open");
}

function handleImageFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    uploadedImageData = e.target.result;
    const preview = document.getElementById("image-preview");
    preview.src = uploadedImageData;
    preview.classList.add("is-visible");
  };
  reader.readAsDataURL(file);
}

function handleProductFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById("product-id").value;
  const name = document.getElementById("product-name").value.trim();
  const description = document.getElementById("product-description").value.trim();
  const price = parseFloat(document.getElementById("product-price").value);
  const category = document.getElementById("product-category").value.trim();

  if (!uploadedImageData) {
    showToast("Veuillez sélectionner une image");
    return;
  }

  const data = { name, description, price, category, image: uploadedImageData };

  if (id) {
    updateProduct(id, data);
    showToast("Produit modifié");
  } else {
    addProduct(data);
    showToast("Produit ajouté");
  }

  closeModal("product-modal");
  renderProductsTable();
  renderDashboard();
}

function handleDeleteProduct(productId) {
  if (!confirm("Voulez-vous vraiment supprimer ce produit ? Cette action est irréversible.")) return;
  deleteProduct(productId);
  showToast("Produit supprimé");
  renderProductsTable();
  renderDashboard();
}

/* ---------- Commandes ---------- */

const ORDER_STATUSES = ["Nouvelle", "En cours", "Confirmée", "Livrée", "Annulée"];

function renderOrdersTable() {
  const orders = getOrders();
  const tbody = document.getElementById("orders-table-body");

  tbody.innerHTML = orders.length
    ? orders
        .map(
          (o) => `
        <tr>
          <td>#${o.orderNumber}</td>
          <td>${escapeHtml(o.customer.nom)} ${escapeHtml(o.customer.prenom)}</td>
          <td>${escapeHtml(o.customer.telephone)}</td>
          <td>${formatDate(o.date)}</td>
          <td>${formatPrice(o.total)}</td>
          <td><span class="status-pill status-${o.status.replace(" ", "-")}">${o.status}</span></td>
          <td class="table-actions">
            <button class="btn btn-ghost btn-sm" onclick="openOrderModal('${o.id}')">Voir</button>
            <button class="btn btn-danger btn-sm" onclick="handleDeleteOrder('${o.id}')">🗑</button>
          </td>
        </tr>`
        )
        .join("")
    : `<tr><td colspan="7" class="muted" style="text-align:center;padding:30px;">Aucune commande pour le moment.</td></tr>`;
}

function openOrderModal(orderId) {
  const order = getOrders().find((o) => o.id === orderId);
  if (!order) return;

  document.getElementById("order-modal-title").textContent = `Commande #${order.orderNumber}`;

  const itemsHtml = order.items
    .map(
      (item) => `
      <div class="order-summary-item">
        <span>${escapeHtml(item.name)} × ${item.quantity}</span>
        <span>${formatPrice(item.price * item.quantity)}</span>
      </div>`
    )
    .join("");

  const statusOptions = ORDER_STATUSES.map(
    (s) => `<option value="${s}" ${s === order.status ? "selected" : ""}>${s}</option>`
  ).join("");

  document.getElementById("order-modal-body").innerHTML = `
    <div class="panel" style="margin-bottom:16px;">
      <p><strong>Client :</strong> ${escapeHtml(order.customer.nom)} ${escapeHtml(order.customer.prenom)}</p>
      <p><strong>Téléphone :</strong> ${escapeHtml(order.customer.telephone)}</p>
      <p><strong>Livraison :</strong> ${escapeHtml(order.customer.ville)}, ${escapeHtml(order.customer.commune)}, ${escapeHtml(order.customer.quartier)} — ${escapeHtml(order.customer.adresse)}</p>
      ${order.customer.infos ? `<p><strong>Infos :</strong> ${escapeHtml(order.customer.infos)}</p>` : ""}
      <p><strong>Date :</strong> ${formatDate(order.date)}</p>
    </div>
    <h4>Produits commandés</h4>
    ${itemsHtml}
    <div class="summary-row total"><span>Total</span><span>${formatPrice(order.total)}</span></div>
    <div class="form-group" style="margin-top:20px;">
      <label for="order-status-select">Statut de la commande</label>
      <select class="input" id="order-status-select">${statusOptions}</select>
    </div>
    <button class="btn btn-primary btn-block" id="save-order-status-btn">Mettre à jour le statut</button>
  `;

  document.getElementById("save-order-status-btn").addEventListener("click", () => {
    const newStatus = document.getElementById("order-status-select").value;
    updateOrderStatus(order.id, newStatus);
    showToast("Statut mis à jour");
    closeModal("order-modal");
    renderOrdersTable();
    renderDashboard();
  });

  document.getElementById("order-modal").classList.add("is-open");
}

function handleDeleteOrder(orderId) {
  if (!confirm("Voulez-vous vraiment supprimer cette commande ?")) return;
  deleteOrder(orderId);
  showToast("Commande supprimée");
  renderOrdersTable();
  renderDashboard();
}

/* ---------- Initialisation ---------- */

document.addEventListener("DOMContentLoaded", () => {
  checkAdminSession();

  document.getElementById("login-form").addEventListener("submit", handleLogin);
  document.getElementById("logout-btn").addEventListener("click", handleLogout);

  document.querySelectorAll(".admin-nav-btn[data-view]").forEach((btn) => {
    btn.addEventListener("click", () => switchAdminView(btn.dataset.view));
  });

  document.getElementById("add-product-btn").addEventListener("click", () => openProductModal(null));
  document.getElementById("product-form").addEventListener("submit", handleProductFormSubmit);

  document.getElementById("image-drop").addEventListener("click", () => {
    document.getElementById("image-input").click();
  });
  document.getElementById("image-input").addEventListener("change", (e) => {
    handleImageFile(e.target.files[0]);
  });
  document.getElementById("image-drop").addEventListener("dragover", (e) => {
    e.preventDefault();
  });
  document.getElementById("image-drop").addEventListener("drop", (e) => {
    e.preventDefault();
    handleImageFile(e.dataTransfer.files[0]);
  });

  document.querySelectorAll("[data-close-modal]").forEach((btn) => {
    btn.addEventListener("click", () => closeModal(btn.dataset.closeModal));
  });
  document.querySelectorAll(".modal-overlay").forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.classList.remove("is-open");
    });
  });
});
