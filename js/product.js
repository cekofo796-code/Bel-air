/* ============================================================
   BEL-AIR — PRODUCT.JS
   Affichage du détail d'un produit à partir de son ID dans l'URL
   (product.html?id=xxx), lu depuis Firestore.
   ============================================================ */

let currentProduct = null;
let galleryImages = [];
let galleryIndex = 0;

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
  galleryImages = getProductImages(product);
  galleryIndex = 0;

  document.getElementById("crumb-name").textContent = product.name;
  document.title = `${product.name} — BEL-AIR`;

  container.innerHTML = `
    <div class="product-detail">
      <div class="product-detail-image">
        <div class="gallery-main" id="gallery-main">
          <img id="gallery-image" src="${galleryImages[0] || ""}" alt="${escapeHtml(product.name)}">
          ${galleryImages.length > 1 ? `
            <button type="button" class="gallery-arrow gallery-arrow-left" id="gallery-prev" aria-label="Image précédente">‹</button>
            <button type="button" class="gallery-arrow gallery-arrow-right" id="gallery-next" aria-label="Image suivante">›</button>
            <div class="gallery-dots" id="gallery-dots"></div>
          ` : ""}
        </div>
        ${galleryImages.length > 1 ? `<div class="gallery-thumbs" id="gallery-thumbs"></div>` : ""}
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

  if (galleryImages.length > 1) {
    initGallery();
  }

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

/* ---------- Galerie : miniatures, flèches, points, swipe tactile ---------- */

function initGallery() {
  renderGalleryThumbs();
  renderGalleryDots();

  document.getElementById("gallery-prev").addEventListener("click", () => showGalleryImage(galleryIndex - 1));
  document.getElementById("gallery-next").addEventListener("click", () => showGalleryImage(galleryIndex + 1));

  const mainEl = document.getElementById("gallery-main");
  let touchStartX = 0;

  mainEl.addEventListener("touchstart", (e) => {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });

  mainEl.addEventListener("touchend", (e) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(deltaX) < 40) return;
    if (deltaX < 0) {
      showGalleryImage(galleryIndex + 1);
    } else {
      showGalleryImage(galleryIndex - 1);
    }
  }, { passive: true });
}

function showGalleryImage(index) {
  const total = galleryImages.length;
  galleryIndex = ((index % total) + total) % total;
  document.getElementById("gallery-image").src = galleryImages[galleryIndex];
  renderGalleryThumbs();
  renderGalleryDots();
}

function renderGalleryThumbs() {
  const thumbs = document.getElementById("gallery-thumbs");
  if (!thumbs) return;
  thumbs.innerHTML = galleryImages
    .map(
      (img, i) => `<button type="button" class="gallery-thumb ${i === galleryIndex ? "is-active" : ""}" data-index="${i}">
        <img src="${img}" alt="Vue ${i + 1}">
      </button>`
    )
    .join("");
  thumbs.querySelectorAll(".gallery-thumb").forEach((btn) => {
    btn.addEventListener("click", () => showGalleryImage(parseInt(btn.dataset.index, 10)));
  });
}

function renderGalleryDots() {
  const dots = document.getElementById("gallery-dots");
  if (!dots) return;
  dots.innerHTML = galleryImages
    .map((_, i) => `<span class="gallery-dot ${i === galleryIndex ? "is-active" : ""}"></span>`)
    .join("");
}

document.addEventListener("DOMContentLoaded", renderProductDetail);
