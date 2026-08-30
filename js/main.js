/* ============================================================
   BEL-AIR — MAIN.JS
   Fonctions communes à toutes les pages.
   Produits et commandes : Firestore (base de données cloud).
   Panier : LocalStorage (propre à chaque appareil/visiteur).
   ============================================================ */

const LS_KEYS = {
  CART: "belair_cart"
};

/* ---------- Utilitaires génériques ---------- */

function formatPrice(value) {
  const n = Number(value) || 0;
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + " $";
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR") + " " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

/* Retourne toujours un tableau d'images "legacy" pour un produit créé
   AVANT la séparation miniature/galerie (elles étaient stockées
   directement sur le document). Sert de repli pour les anciens produits. */
function getProductImages(product) {
  if (!product) return [];
  if (Array.isArray(product.images) && product.images.length) return product.images;
  if (product.image) return [product.image];
  return [];
}

/* Vignette légère utilisée sur les pages de liste (accueil, catalogue,
   panier, tableau admin) : ne télécharge JAMAIS la galerie complète. */
function getProductThumbnail(product) {
  if (!product) return placeholderImage("Sans image", "#ece7dd", "#1B1F1D");
  if (product.thumbnail) return product.thumbnail;
  const legacy = getProductImages(product);
  return legacy[0] || placeholderImage("Sans image", "#ece7dd", "#1B1F1D");
}

/* Galerie complète d'un produit (plusieurs photos en taille normale),
   stockée à part dans une sous-collection Firestore et chargée
   uniquement sur la page de détail du produit. */
async function getProductGalleryImages(productId) {
  const doc = await db.collection("products").doc(productId).collection("gallery").doc("photos").get();
  if (doc.exists && Array.isArray(doc.data().images) && doc.data().images.length) {
    return doc.data().images;
  }
  return null;
}

/* ---------- Produits (Firestore) ---------- */

async function getProducts() {
  const snapshot = await db.collection("products").orderBy("createdAt", "desc").get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

async function getProductById(id) {
  if (!id) return null;
  const doc = await db.collection("products").doc(id).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

/* "product" doit contenir : name, description, price, category,
   thumbnail (petite image), et éventuellement "images" (galerie
   complète) qui est stockée à part pour garder le document léger. */
async function addProduct(product) {
  const { images, ...mainFields } = product;
  const docRef = await db.collection("products").add({
    ...mainFields,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  if (images && images.length) {
    await docRef.collection("gallery").doc("photos").set({ images });
  }
  return docRef.id;
}

async function updateProduct(id, updates) {
  const { images, ...mainFields } = updates;
  if (Object.keys(mainFields).length) {
    await db.collection("products").doc(id).update(mainFields);
  }
  if (images && images.length) {
    await db.collection("products").doc(id).collection("gallery").doc("photos").set({ images });
  }
}

async function deleteProduct(id) {
  await db.collection("products").doc(id).delete();
}

/* Placeholder SVG en data-URI, utilisé uniquement pour les produits de démonstration */
function placeholderImage(label, bg, fg) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600">
    <rect width="100%" height="100%" fill="${bg}"/>
    <text x="50%" y="50%" font-family="Georgia, serif" font-size="42" fill="${fg}" text-anchor="middle" dominant-baseline="middle">${label}</text>
  </svg>`;
  return "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));
}

/* Ajoute des produits de démonstration dans Firestore.
   Nécessite d'être connecté en admin (règles de sécurité).
   Ne fait rien si des produits de démo ont déjà été ajoutés. */
async function seedDemoProducts() {
  const seedDoc = await db.collection("meta").doc("seed").get();
  if (seedDoc.exists) return false;

  const demo = [
    { name: "Montre Élégance Or", description: "Montre habillée au bracelet acier doré et cadran minimaliste. Idéale pour les grandes occasions.", price: 89, category: "Montres", thumb: placeholderImage("Montre Or", "#1B1F1D", "#A88B5C") },
    { name: "Montre Sport Noire", description: "Montre robuste au design sportif, étanche et confortable au quotidien.", price: 59, category: "Montres", thumb: placeholderImage("Montre Sport", "#26433A", "#F5F3EF") },
    { name: "Chaussures Cuir Homme", description: "Chaussures en cuir véritable, finition soignée, parfaites pour le bureau comme pour le soir.", price: 72, category: "Chaussures", thumb: placeholderImage("Chaussures H.", "#3A2E26", "#F5F3EF") },
    { name: "Escarpins Élégance", description: "Escarpins raffinés à talon fin, pour une allure sophistiquée en toute occasion.", price: 65, category: "Chaussures", thumb: placeholderImage("Escarpins", "#5C2A3A", "#F5F3EF") },
    { name: "Parfum Bel Air Homme", description: "Fragrance boisée et ambrée, sillage longue tenue, flacon 100ml.", price: 45, category: "Parfums", thumb: placeholderImage("Parfum H.", "#1B1F1D", "#A88B5C") },
    { name: "Parfum Bel Air Femme", description: "Fragrance florale et suave, notes de jasmin et de vanille, flacon 100ml.", price: 45, category: "Parfums", thumb: placeholderImage("Parfum F.", "#26433A", "#F5F3EF") },
    { name: "Enceinte Bluetooth Portable", description: "Son puissant, autonomie 12h, idéale pour la maison comme pour l'extérieur.", price: 38, category: "Électronique", thumb: placeholderImage("Enceinte", "#1B1F1D", "#A88B5C") },
    { name: "Powerbank 20000mAh", description: "Batterie externe haute capacité, charge rapide, deux ports USB.", price: 28, category: "Électronique", thumb: placeholderImage("Powerbank", "#3A2E26", "#F5F3EF") }
  ];

  const batch = db.batch();
  demo.forEach((p) => {
    const ref = db.collection("products").doc();
    batch.set(ref, {
      name: p.name,
      description: p.description,
      price: p.price,
      category: p.category,
      thumbnail: p.thumb,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    batch.set(ref.collection("gallery").doc("photos"), { images: [p.thumb] });
  });
  batch.set(db.collection("meta").doc("seed"), { done: true });
  await batch.commit();
  return true;
}

/* ---------- Panier (LocalStorage) ---------- */

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEYS.CART)) || [];
  } catch (e) {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(LS_KEYS.CART, JSON.stringify(cart));
  updateCartBadge();
}

function addToCart(productId, quantity = 1) {
  const cart = getCart();
  const existing = cart.find((item) => item.productId === productId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ productId, quantity });
  }
  saveCart(cart);
}

function updateCartItemQuantity(productId, quantity) {
  let cart = getCart();
  if (quantity <= 0) {
    cart = cart.filter((item) => item.productId !== productId);
  } else {
    const item = cart.find((i) => i.productId === productId);
    if (item) item.quantity = quantity;
  }
  saveCart(cart);
}

function removeFromCart(productId) {
  const cart = getCart().filter((item) => item.productId !== productId);
  saveCart(cart);
}

function clearCart() {
  saveCart([]);
}

function getCartCount() {
  return getCart().reduce((sum, item) => sum + item.quantity, 0);
}

/* Récupère les produits du panier depuis Firestore (async, car les
   produits ne sont plus en LocalStorage). Ignore les produits qui
   n'existent plus (supprimés entre-temps par l'admin). */
async function getCartDetails() {
  const cart = getCart();
  const details = [];
  for (const item of cart) {
    const product = await getProductById(item.productId);
    if (product) {
      details.push({ product, quantity: item.quantity, subtotal: product.price * item.quantity });
    }
  }
  return details;
}

async function getCartTotal() {
  const details = await getCartDetails();
  return details.reduce((sum, item) => sum + item.subtotal, 0);
}

function updateCartBadge() {
  const badges = document.querySelectorAll("[data-cart-count]");
  const count = getCartCount();
  badges.forEach((b) => {
    b.textContent = count;
    b.style.display = count > 0 ? "inline-flex" : "none";
  });
}

/* ---------- Commandes (Firestore) ---------- */

async function getOrders() {
  const snapshot = await db.collection("orders").orderBy("date", "desc").get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

/* Compteur de numéro de commande, incrémenté de façon atomique
   (sûr même si plusieurs clients commandent en même temps). */
async function nextOrderNumber() {
  const counterRef = db.collection("meta").doc("orderCounter");
  return db.runTransaction(async (t) => {
    const doc = await t.get(counterRef);
    const current = doc.exists ? doc.data().value : 1000;
    const next = current + 1;
    t.set(counterRef, { value: next });
    return next;
  });
}

async function createOrder(customer, items, total) {
  const orderNumber = await nextOrderNumber();
  const order = {
    orderNumber,
    customer,
    items,
    total,
    date: new Date().toISOString(),
    status: "Nouvelle"
  };
  const ref = await db.collection("orders").add(order);
  return { id: ref.id, ...order };
}

async function updateOrderStatus(orderId, status) {
  await db.collection("orders").doc(orderId).update({ status });
}

async function deleteOrder(orderId) {
  await db.collection("orders").doc(orderId).delete();
}

/* ---------- WhatsApp ---------- */

function buildWhatsAppMessage(order) {
  const lines = [];
  lines.push(`${SHOP_NAME} 🛍️`);
  lines.push("");
  lines.push("NOUVELLE COMMANDE");
  lines.push(`Numéro de commande : #${order.orderNumber}`);
  lines.push("");
  lines.push("CLIENT");
  lines.push(`Nom : ${order.customer.nom}`);
  lines.push(`Prénom : ${order.customer.prenom}`);
  lines.push(`Téléphone : ${order.customer.telephone}`);
  lines.push("");
  lines.push("LIVRAISON");
  lines.push(`Ville : ${order.customer.ville}`);
  lines.push(`Commune : ${order.customer.commune}`);
  lines.push(`Quartier : ${order.customer.quartier}`);
  lines.push(`Adresse : ${order.customer.adresse}`);
  if (order.customer.infos) {
    lines.push(`Infos supplémentaires : ${order.customer.infos}`);
  }
  lines.push("");
  lines.push("PRODUITS");
  order.items.forEach((item) => {
    lines.push(`- ${item.name}`);
    lines.push(`  Quantité : ${item.quantity}`);
    lines.push(`  Prix : ${formatPrice(item.price)}`);
  });
  lines.push("");
  lines.push(`TOTAL : ${formatPrice(order.total)}`);
  lines.push("");
  lines.push(`DATE : ${formatDate(order.date)}`);
  lines.push("");
  lines.push(`Merci d'avoir commandé chez ${SHOP_NAME}.`);
  return lines.join("\n");
}

function openWhatsAppOrder(order) {
  const message = buildWhatsAppMessage(order);
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
}

/* ---------- Menu mobile ---------- */

function initMobileMenu() {
  const toggle = document.querySelector(".nav-toggle");
  const menu = document.querySelector(".nav-menu");
  if (!toggle || !menu) return;
  toggle.addEventListener("click", () => {
    menu.classList.toggle("is-open");
    toggle.classList.toggle("is-open");
  });
}

/* ---------- Toast de confirmation ---------- */

function showToast(message) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2600);
}

/* ---------- Initialisation commune ---------- */

document.addEventListener("DOMContentLoaded", () => {
  updateCartBadge();
  initMobileMenu();

  const yearEls = document.querySelectorAll("[data-year]");
  yearEls.forEach((el) => (el.textContent = new Date().getFullYear()));
});
