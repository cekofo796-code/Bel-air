/* ============================================================
   BEL-AIR — MAIN.JS
   Fonctions communes à toutes les pages : LocalStorage, produits
   de démonstration, panier, utilitaires, menu mobile.
   ============================================================ */

const LS_KEYS = {
  PRODUCTS: "belair_products",
  SEEDED: "belair_seeded",
  CART: "belair_cart",
  ORDERS: "belair_orders",
  ORDER_SEQ: "belair_order_seq",
  ADMIN_SESSION: "belair_admin_session"
};

/* ---------- Utilitaires génériques ---------- */

function generateId() {
  return "p_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
}

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

/* ---------- Produits ---------- */

function getProducts() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEYS.PRODUCTS)) || [];
  } catch (e) {
    return [];
  }
}

function saveProducts(products) {
  localStorage.setItem(LS_KEYS.PRODUCTS, JSON.stringify(products));
}

function getProductById(id) {
  return getProducts().find((p) => p.id === id);
}

function addProduct(product) {
  const products = getProducts();
  product.id = generateId();
  product.createdAt = new Date().toISOString();
  products.unshift(product);
  saveProducts(products);
  return product;
}

function updateProduct(id, updates) {
  const products = getProducts();
  const idx = products.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  products[idx] = { ...products[idx], ...updates };
  saveProducts(products);
  return products[idx];
}

function deleteProduct(id) {
  const products = getProducts().filter((p) => p.id !== id);
  saveProducts(products);
}

/* Placeholder SVG en data-URI utilisé quand un produit démo n'a pas de vraie photo */
function placeholderImage(label, bg, fg) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600">
    <rect width="100%" height="100%" fill="${bg}"/>
    <text x="50%" y="50%" font-family="Georgia, serif" font-size="42" fill="${fg}" text-anchor="middle" dominant-baseline="middle">${label}</text>
  </svg>`;
  return "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));
}

function seedDemoProducts() {
  if (localStorage.getItem(LS_KEYS.SEEDED)) return;

  const demo = [
    {
      name: "Montre Élégance Or",
      description: "Montre habillée au bracelet acier doré et cadran minimaliste. Idéale pour les grandes occasions.",
      price: 89,
      category: "Montres",
      image: placeholderImage("Montre Or", "#1B1F1D", "#A88B5C")
    },
    {
      name: "Montre Sport Noire",
      description: "Montre robuste au design sportif, étanche et confortable au quotidien.",
      price: 59,
      category: "Montres",
      image: placeholderImage("Montre Sport", "#26433A", "#F5F3EF")
    },
    {
      name: "Chaussures Cuir Homme",
      description: "Chaussures en cuir véritable, finition soignée, parfaites pour le bureau comme pour le soir.",
      price: 72,
      category: "Chaussures",
      image: placeholderImage("Chaussures H.", "#3A2E26", "#F5F3EF")
    },
    {
      name: "Escarpins Élégance",
      description: "Escarpins raffinés à talon fin, pour une allure sophistiquée en toute occasion.",
      price: 65,
      category: "Chaussures",
      image: placeholderImage("Escarpins", "#5C2A3A", "#F5F3EF")
    },
    {
      name: "Parfum Bel Air Homme",
      description: "Fragrance boisée et ambrée, sillage longue tenue, flacon 100ml.",
      price: 45,
      category: "Parfums",
      image: placeholderImage("Parfum H.", "#1B1F1D", "#A88B5C")
    },
    {
      name: "Parfum Bel Air Femme",
      description: "Fragrance florale et suave, notes de jasmin et de vanille, flacon 100ml.",
      price: 45,
      category: "Parfums",
      image: placeholderImage("Parfum F.", "#26433A", "#F5F3EF")
    },
    {
      name: "Enceinte Bluetooth Portable",
      description: "Son puissant, autonomie 12h, idéale pour la maison comme pour l'extérieur.",
      price: 38,
      category: "Électronique",
      image: placeholderImage("Enceinte", "#1B1F1D", "#A88B5C")
    },
    {
      name: "Powerbank 20000mAh",
      description: "Batterie externe haute capacité, charge rapide, deux ports USB.",
      price: 28,
      category: "Électronique",
      image: placeholderImage("Powerbank", "#3A2E26", "#F5F3EF")
    }
  ];

  const withMeta = demo.map((p) => ({
    ...p,
    id: generateId(),
    createdAt: new Date().toISOString()
  }));

  saveProducts(withMeta);
  localStorage.setItem(LS_KEYS.SEEDED, "1");
}

/* ---------- Panier ---------- */

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

function getCartDetails() {
  const products = getProducts();
  return getCart()
    .map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) return null;
      return {
        product,
        quantity: item.quantity,
        subtotal: product.price * item.quantity
      };
    })
    .filter(Boolean);
}

function getCartTotal() {
  return getCartDetails().reduce((sum, item) => sum + item.subtotal, 0);
}

function updateCartBadge() {
  const badges = document.querySelectorAll("[data-cart-count]");
  const count = getCartCount();
  badges.forEach((b) => {
    b.textContent = count;
    b.style.display = count > 0 ? "inline-flex" : "none";
  });
}

/* ---------- Commandes ---------- */

function getOrders() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEYS.ORDERS)) || [];
  } catch (e) {
    return [];
  }
}

function saveOrders(orders) {
  localStorage.setItem(LS_KEYS.ORDERS, JSON.stringify(orders));
}

function nextOrderNumber() {
  let seq = parseInt(localStorage.getItem(LS_KEYS.ORDER_SEQ) || "1000", 10);
  seq += 1;
  localStorage.setItem(LS_KEYS.ORDER_SEQ, String(seq));
  return seq;
}

function createOrder(customer, items, total) {
  const orders = getOrders();
  const order = {
    id: generateId(),
    orderNumber: nextOrderNumber(),
    customer,
    items,
    total,
    date: new Date().toISOString(),
    status: "Nouvelle"
  };
  orders.unshift(order);
  saveOrders(orders);
  return order;
}

function updateOrderStatus(orderId, status) {
  const orders = getOrders();
  const order = orders.find((o) => o.id === orderId);
  if (order) {
    order.status = status;
    saveOrders(orders);
  }
}

function deleteOrder(orderId) {
  const orders = getOrders().filter((o) => o.id !== orderId);
  saveOrders(orders);
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
  seedDemoProducts();
  updateCartBadge();
  initMobileMenu();

  const yearEls = document.querySelectorAll("[data-year]");
  yearEls.forEach((el) => (el.textContent = new Date().getFullYear()));
});
