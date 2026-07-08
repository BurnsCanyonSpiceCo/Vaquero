const body = document.body;
const announcement = document.querySelector(".announcement");
const announcementClose = document.querySelector(".announcement__close");
const navToggle = document.querySelector(".nav-toggle");
const navMenu = document.querySelector(".nav-menu");
const cartButton = document.querySelector(".cart-button");
const cartDrawer = document.querySelector(".cart-drawer");
const cartClose = document.querySelector(".cart-close");
const cartItems = document.querySelector(".cart-items");
const cartCount = document.querySelector(".cart-count");
const cartTotal = document.querySelector(".cart-total strong");
const filters = document.querySelectorAll(".filter");
const productCards = document.querySelectorAll(".product-card");
const stepperGroups = document.querySelectorAll("[data-stepper]");

function syncMenuOffset() {
  const root = document.documentElement;
  const header = document.querySelector(".site-header");
  if (!header) return;
  const headerHeight = Math.round(header.getBoundingClientRect().height);
  const announcementHeight =
    announcement?.isConnected ? Math.round(announcement.getBoundingClientRect().height) : 0;
  const announcementOffset = Math.max(announcementHeight - Math.round(window.scrollY), 0);

  root.style.setProperty("--header-height", `${headerHeight}px`);
  root.style.setProperty("--announcement-offset", `${announcementOffset}px`);
  root.style.setProperty("--menu-top", `${announcementOffset + headerHeight}px`);
}

function formatMoney(cents) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: window.Shopify?.currency?.active || "USD",
  }).format(cents / 100);
}

function openCart() {
  if (!cartDrawer || !cartButton || !cartClose) return;
  cartDrawer.classList.add("is-open");
  cartDrawer.setAttribute("aria-hidden", "false");
  cartButton.setAttribute("aria-expanded", "true");
  body.classList.add("cart-open");
  cartClose.focus();
}

function closeCart() {
  if (!cartDrawer || !cartButton) return;
  cartDrawer.classList.remove("is-open");
  cartDrawer.setAttribute("aria-hidden", "true");
  cartButton.setAttribute("aria-expanded", "false");
  body.classList.remove("cart-open");
  cartButton.focus();
}

async function getCart() {
  const response = await fetch(`${window.Shopify?.routes?.root || "/"}cart.js`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("Could not load cart");
  return response.json();
}

function renderCart(cart) {
  if (!cartItems || !cartCount || !cartTotal) return;

  cartCount.textContent = cart.item_count;
  cartTotal.textContent = formatMoney(cart.total_price);

  if (!cart.items.length) {
    cartItems.innerHTML = '<p class="empty-cart">Your cart is ready for bold flavor.</p>';
    return;
  }

  cartItems.innerHTML = cart.items
    .map(
      (item) => `
        <article class="cart-line">
          ${item.image ? `<img src="${item.image}" alt="">` : ""}
          <div>
            <strong>${item.product_title}</strong>
            <span>Qty ${item.quantity}</span>
          </div>
          <b>${formatMoney(item.final_line_price)}</b>
        </article>
      `,
    )
    .join("");
}

async function addFormToCart(form) {
  const formData = new FormData(form);
  const button = form.querySelector("button[type='submit']");
  button?.setAttribute("aria-busy", "true");

  const response = await fetch(`${window.Shopify?.routes?.root || "/"}cart/add.js`, {
    method: "POST",
    headers: { Accept: "application/json" },
    body: formData,
  });

  button?.removeAttribute("aria-busy");
  if (!response.ok) {
    form.submit();
    return;
  }

  renderCart(await getCart());
  openCart();
}

announcementClose?.addEventListener("click", () => {
  announcement?.remove();
  syncMenuOffset();
});

navToggle?.addEventListener("click", () => {
  syncMenuOffset();
  const isOpen = navMenu.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
  body.classList.toggle("menu-open", isOpen);
});

navMenu?.addEventListener("click", (event) => {
  if (event.target instanceof HTMLAnchorElement) {
    navMenu.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    body.classList.remove("menu-open");
  }
});

filters.forEach((filter) => {
  filter.addEventListener("click", () => {
    const category = filter.dataset.filter;

    filters.forEach((button) => button.classList.remove("is-active"));
    filter.classList.add("is-active");

    productCards.forEach((card) => {
      const shouldShow = category === "all" || card.dataset.category === category;
      card.classList.toggle("is-hidden", !shouldShow);
    });
  });
});

document.querySelector(".gallery__thumbs")?.addEventListener("click", (event) => {
  const thumb = event.target.closest(".thumb");
  const activeGalleryMain = document.querySelector(".gallery__main");
  if (!thumb || !activeGalleryMain) return;

  const image = thumb.dataset.image;
  if (!image) return;

  document.querySelectorAll(".thumb").forEach((button) => button.classList.remove("is-active"));
  thumb.classList.add("is-active");
  activeGalleryMain.src = image;
});

stepperGroups.forEach((stepper) => {
  stepper.addEventListener("click", (event) => {
    const button = event.target.closest("[data-step]");
    const input = stepper.querySelector("input");
    if (!button || !input) return;

    const current = Number(input.value) || 1;
    const next = button.dataset.step === "up" ? current + 1 : Math.max(1, current - 1);
    input.value = String(next);
  });
});

document.querySelectorAll("[data-add-to-cart-form]").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    addFormToCart(form).catch(() => form.submit());
  });
});

document.querySelectorAll("[data-video-embed]").forEach((video) => {
  video.querySelector(".video-thumb")?.addEventListener("click", () => {
    const id = video.dataset.videoEmbed?.trim();
    if (!id) return;
    video.innerHTML = `
      <iframe
        src="https://www.youtube.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0"
        title="Burns Canyon story video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen>
      </iframe>
    `;
  });
});

cartButton?.addEventListener("click", (event) => {
  if (!cartDrawer) return;
  event.preventDefault();
  getCart().then(renderCart).finally(openCart);
});

cartClose?.addEventListener("click", closeCart);

cartDrawer?.addEventListener("click", (event) => {
  if (event.target === cartDrawer) closeCart();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && cartDrawer?.classList.contains("is-open")) {
    closeCart();
  }
});

window.addEventListener("resize", syncMenuOffset);
window.addEventListener("scroll", syncMenuOffset, { passive: true });
syncMenuOffset();
