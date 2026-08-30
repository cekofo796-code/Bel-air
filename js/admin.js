/* ============================================================
   BEL-AIR — ADMIN.JS
   Connexion Firebase Authentication, tableau de bord, gestion
   des produits (Firestore + image redimensionnée en base64)
   et gestion des commandes (Firestore).
   ============================================================ */

let uploadedImages = [];
let allProductsCache = [];
let allOrdersCache = [];

/* ---------- Connexion (Firebase Authentication) ---------- */

function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value;
  const errorEl = document.getElementById("login-error");
  errorEl.textContent = "";

  auth.signInWithEmailAndPassword(email, password).catch(() => {
    errorEl.textContent = "Identifiants incorrects. Réessayez.";
  });
}

function handleLogout() {
  auth.signOut();
}

auth.onAuthStateChanged((user) => {
  document.getElementById("login-screen").style.display = user ? "none" : "flex";
  document.getElementById("admin-shell").style.display = user ? "grid" : "none";
  if (user) {
    refreshAllViews();
  }
});

/* ---------- Navigation entre vues ---------- */

function switchAdminView(view) {
  document.querySelectorAll(".admin-view").forEach((v) => v.classList.remove("is-active"));
  document.getElementById(`view-${view}`).classList.add("is-active");
  document.querySelectorAll(".admin-nav-btn[data-view]").forEach((b) => b.classList.remove("is-active"));
  document.querySelector(`.admin-nav-btn[data-view="${view}"]`).classList.add("is-active");
}

async function refreshAllViews() {
  allProductsCache = await getProducts();
  allOrdersCache = await getOrders();
  renderDashboard();
  renderProductsTable();
  renderOrdersTable();
}

/* ---------- Dashboard ---------- */

function renderDashboard() {
  const revenue = allOrdersCache.reduce((sum, o) => sum + o.total, 0);

  document.getElementById("stat-products").textContent = allProductsCache.length;
  document.getElementById("stat-orders").textContent = allOrdersCache.length;
  document.getElementById("stat-new").textContent = allOrdersCache.filter((o) => o.status === "Nouvelle").length;
  document.getElementById("stat-delivered").textContent = allOrdersCache.filter((o) => o.status === "Livrée").length;
  document.getElementById("stat-revenue").textContent = formatPrice(revenue);

  const recent = allOrdersCache.slice(0, 5);
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

  const seedBtn = document.getElementById("seed-demo-btn");
  if (seedBtn) {
    seedBtn.style.display = allProductsCache.length === 0 ? "inline-flex" : "none";
  }
}

/* ---------- Produits ---------- */

function renderProductsTable() {
  const tbody = document.getElementById("products-table-body");

  tbody.innerHTML = allProductsCache.length
    ? allProductsCache
        .map(
          (p) => `
        <tr>
          <td><img class="table-thumb" src="${getProductThumbnail(p)}" alt="${escapeHtml(p.name)}"></td>
          <td>${escapeHtml(p.name)}</td>
          <td>${escapeHtml(p.category)}</td>
          <td>${formatPrice(p.price)}</td>
          <td>${p.createdAt && p.createdAt.toDate ? formatDate(p.createdAt.toDate().toISOString()) : "—"}</td>
          <td class="table-actions">
            <button class="btn btn-ghost btn-sm" onclick="openProductModal('${p.id}')">✏️ Modifier</button>
            <button class="btn btn-danger btn-sm" onclick="handleDeleteProduct('${p.id}')">🗑 Supprimer</button>
          </td>
        </tr>`
        )
        .join("")
    : `<tr><td colspan="6" class="muted" style="text-align:center;padding:30px;">Aucun produit. Cliquez sur "Ajouter un produit" pour commencer.</td></tr>`;

  const categoryList = document.getElementById("category-list");
  const categories = [...new Set(allProductsCache.map((p) => p.category))];
  categoryList.innerHTML = categories.map((c) => `<option value="${escapeHtml(c)}">`).join("");
}

function openProductModal(productId) {
  const modal = document.getElementById("product-modal");
  const form = document.getElementById("product-form");
  form.reset();
  uploadedImages = [];

  if (productId) {
    const product = allProductsCache.find((p) => p.id === productId);
    document.getElementById("product-modal-title").textContent = "Modifier le produit";
    document.getElementById("product-id").value = product.id;
    document.getElementById("product-name").value = product.name;
    document.getElementById("product-description").value = product.description;
    document.getElementById("product-price").value = product.price;
    document.getElementById("product-category").value = product.category;
    uploadedImages = [...getProductImages(product)];
  } else {
    document.getElementById("product-modal-title").textContent = "Ajouter un produit";
    document.getElementById("product-id").value = "";
  }

  renderImageThumbGrid();
  modal.classList.add("is-open");
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove("is-open");
}

/* Redimensionne une image (max 900px) et la convertit en JPEG base64
   afin de rester largement sous la limite de 1 Mo par document Firestore. */
function resizeImageFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 900;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const scale = maxDim / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

async function handleImageFiles(fileList) {
  const files = Array.from(fileList || []).filter((f) => f.type.startsWith("image/"));
  for (const file of files) {
    const resized = await resizeImageFile(file);
    uploadedImages.push(resized);
  }
  renderImageThumbGrid();
}

function renderImageThumbGrid() {
  const grid = document.getElementById("image-thumb-grid");
  grid.innerHTML = uploadedImages
    .map(
      (img, i) => `
      <div class="image-thumb-item ${i === 0 ? "is-main" : ""}">
        <img src="${img}" alt="Photo ${i + 1}">
        <button type="button" class="remove-thumb" data-index="${i}" aria-label="Supprimer cette photo">✕</button>
      </div>`
    )
    .join("");

  grid.querySelectorAll(".remove-thumb").forEach((btn) => {
    btn.addEventListener("click", () => {
      uploadedImages.splice(parseInt(btn.dataset.index, 10), 1);
      renderImageThumbGrid();
    });
  });
}

async function handleProductFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById("product-id").value;
  const name = document.getElementById("product-name").value.trim();
  const description = document.getElementById("product-description").value.trim();
  const price = parseFloat(document.getElementById("product-price").value);
  const category = document.getElementById("product-category").value.trim();

  if (uploadedImages.length === 0) {
    showToast("Veuillez sélectionner au moins une image");
    return;
  }

  const submitBtn = e.target.querySelector("button[type=submit]");
  submitBtn.disabled = true;
  submitBtn.textContent = "Enregistrement...";

  const data = { name, description, price, category, images: uploadedImages };

  try {
    if (id) {
      await updateProduct(id, data);
      showToast("Produit modifié");
    } else {
      await addProduct(data);
      showToast("Produit ajouté");
    }
    closeModal("product-modal");
    await refreshAllViews();
  } catch (err) {
    console.error(err);
    showToast("Erreur lors de l'enregistrement");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Enregistrer";
  }
}

async function handleDeleteProduct(productId) {
  if (!confirm("Voulez-vous vraiment supprimer ce produit ? Cette action est irréversible.")) return;
  await deleteProduct(productId);
  showToast("Produit supprimé");
  await refreshAllViews();
}

async function handleSeedDemo() {
  const added = await seedDemoProducts();
  showToast(added ? "Produits de démonstration ajoutés" : "Des produits existent déjà");
  await refreshAllViews();
}

/* ---------- Commandes ---------- */

const ORDER_STATUSES = ["Nouvelle", "En cours", "Confirmée", "Livrée", "Annulée"];

function renderOrdersTable() {
  const tbody = document.getElementById("orders-table-body");

  tbody.innerHTML = allOrdersCache.length
    ? allOrdersCache
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
  const order = allOrdersCache.find((o) => o.id === orderId);
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

  document.getElementById("save-order-status-btn").addEventListener("click", async () => {
    const newStatus = document.getElementById("order-status-select").value;
    await updateOrderStatus(order.id, newStatus);
    showToast("Statut mis à jour");
    closeModal("order-modal");
    await refreshAllViews();
  });

  document.getElementById("order-modal").classList.add("is-open");
}

async function handleDeleteOrder(orderId) {
  if (!confirm("Voulez-vous vraiment supprimer cette commande ?")) return;
  await deleteOrder(orderId);
  showToast("Commande supprimée");
  await refreshAllViews();
}

/* ---------- Initialisation ---------- */

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("login-form").addEventListener("submit", handleLogin);
  document.getElementById("logout-btn").addEventListener("click", handleLogout);

  document.querySelectorAll(".admin-nav-btn[data-view]").forEach((btn) => {
    btn.addEventListener("click", () => switchAdminView(btn.dataset.view));
  });

  document.getElementById("add-product-btn").addEventListener("click", () => openProductModal(null));
  document.getElementById("product-form").addEventListener("submit", handleProductFormSubmit);

  const seedBtn = document.getElementById("seed-demo-btn");
  if (seedBtn) seedBtn.addEventListener("click", handleSeedDemo);

  document.getElementById("image-drop").addEventListener("click", () => {
    document.getElementById("image-input").click();
  });
  document.getElementById("image-input").addEventListener("change", (e) => {
    handleImageFiles(e.target.files);
    e.target.value = "";
  });
  document.getElementById("image-drop").addEventListener("dragover", (e) => {
    e.preventDefault();
  });
  document.getElementById("image-drop").addEventListener("drop", (e) => {
    e.preventDefault();
    handleImageFiles(e.dataTransfer.files);
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
