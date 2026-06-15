const products = {
  mono: { name: "Aevum Mono", price: 159000 },
  noct: { name: "Aevum Noct", price: 189000 },
  sol: { name: "Aevum Sol", price: 169000 }
};

const formatPrice = (value) => `${value.toLocaleString("hu-HU")} Ft`;

const getCart = () => {
  try {
    return JSON.parse(localStorage.getItem("aevumCart")) || {};
  } catch {
    return {};
  }
};

const saveCart = (cart) => {
  localStorage.setItem("aevumCart", JSON.stringify(cart));
};

const updateCartCount = () => {
  const count = Object.values(getCart()).reduce((sum, quantity) => sum + quantity, 0);
  document.querySelectorAll("[data-cart-count]").forEach((item) => {
    item.textContent = count;
    item.hidden = count === 0;
  });
};

const updateProductControls = () => {
  const cart = getCart();
  document.querySelectorAll("[data-product-control]").forEach((control) => {
    const productId = control.dataset.productControl;
    const quantity = cart[productId] || 0;
    const label = control.querySelector(".add-label");
    const count = control.querySelector("[data-item-count]");

    control.classList.toggle("added", quantity > 0);
    if (label) label.textContent = quantity > 0 ? "Hozzáadva" : "Hozzáadás";
    if (count) count.textContent = quantity;
  });
};

const addToCart = (productId) => {
  const cart = getCart();
  cart[productId] = (cart[productId] || 0) + 1;
  saveCart(cart);
  updateCartCount();
  updateProductControls();
};

const revealItems = document.querySelectorAll(".reveal");

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.18 }
);

revealItems.forEach((item, index) => {
  item.style.transitionDelay = `${Math.min(index * 70, 280)}ms`;
  observer.observe(item);
});

document.querySelectorAll(".bubble-button").forEach((button) => {
  button.addEventListener("pointermove", (event) => {
    const rect = button.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    button.style.setProperty("--x", `${x}px`);
    button.style.setProperty("--y", `${y}px`);
  });

  button.addEventListener("click", () => {
    button.classList.remove("pop");
    void button.offsetWidth;
    button.classList.add("pop");
  });
});

document.querySelectorAll(".cart-link").forEach((link) => {
  link.addEventListener("click", (event) => {
    if (event.defaultPrevented) return;
    const href = link.getAttribute("href");
    if (!href) return;

    event.preventDefault();
    link.classList.remove("cart-ride");
    void link.offsetWidth;
    link.classList.add("cart-ride");

    window.setTimeout(() => {
      window.location.href = href;
    }, 520);
  });
});

document.querySelectorAll(".add-to-cart").forEach((button) => {
  button.addEventListener("click", () => {
    const productId = button.dataset.product;
    const cart = getCart();
    if (!cart[productId]) {
      addToCart(productId);
    }
  });
});

document.querySelectorAll("[data-plus-product]").forEach((button) => {
  button.addEventListener("click", () => {
    addToCart(button.dataset.plusProduct);
  });
});

const scrollHour = document.querySelector("[data-scroll-hour]");
const scrollMinute = document.querySelector("[data-scroll-minute]");

const moveWatchHands = () => {
  if (!scrollHour || !scrollMinute) return;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight || 1;
  const progress = window.scrollY / maxScroll;
  const minuteRotation = 42 + progress * 720;
  const hourRotation = 315 + progress * 180;
  scrollMinute.style.transform = `translateX(-50%) rotate(${minuteRotation}deg)`;
  scrollHour.style.transform = `translateX(-50%) rotate(${hourRotation}deg)`;
};

window.addEventListener("scroll", moveWatchHands, { passive: true });
moveWatchHands();

const cartItems = document.querySelector("#cartItems");
const cartTotal = document.querySelector("#cartTotal");

const addQueryProductToCart = () => {
  const params = new URLSearchParams(window.location.search);
  const watchName = params.get("ora");
  const productId = Object.keys(products).find((id) => products[id].name === watchName);
  if (productId) {
    const cart = getCart();
    if (!cart[productId]) {
      cart[productId] = 1;
      saveCart(cart);
    }
  }
};

const renderCheckoutCart = () => {
  if (!cartItems || !cartTotal) return;
  addQueryProductToCart();
  const cart = getCart();
  const entries = Object.entries(cart).filter(([id, quantity]) => products[id] && quantity > 0);
  const total = entries.reduce((sum, [id, quantity]) => sum + products[id].price * quantity, 0);

  cartTotal.textContent = formatPrice(total);

  if (entries.length === 0) {
    cartItems.innerHTML = `<p class="empty-cart">A kosarad jelenleg üres.</p>`;
    return;
  }

  cartItems.innerHTML = entries
    .map(([id, quantity]) => {
      const product = products[id];
      return `
        <div class="cart-item">
          <div>
            <strong>${product.name}</strong>
            <span>${quantity} db x ${formatPrice(product.price)}</span>
          </div>
          <strong>${formatPrice(product.price * quantity)}</strong>
        </div>
      `;
    })
    .join("");
};

renderCheckoutCart();
updateCartCount();
updateProductControls();

const checkoutForm = document.querySelector("#checkoutForm");
const formNote = document.querySelector("#formNote");

if (checkoutForm && formNote) {
  checkoutForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(checkoutForm);
    const buyerName = String(formData.get("name") || "Vásárló").trim() || "Vásárló";
    sessionStorage.setItem("aevumBuyerName", buyerName);
    localStorage.removeItem("aevumCart");
    window.location.href = `thankyou.html?nev=${encodeURIComponent(buyerName)}`;
  });
}

const thanksMessage = document.querySelector("#thanksMessage");

if (thanksMessage) {
  const params = new URLSearchParams(window.location.search);
  const buyerName = params.get("nev") || sessionStorage.getItem("aevumBuyerName") || "";
  const greeting = buyerName ? `Köszönjük, ${buyerName}!` : "Köszönjük!";
  thanksMessage.textContent = `${greeting} A rendelési adatokat rögzítettük, és hamarosan felvesszük veled a kapcsolatot.`;
  updateCartCount();
}
