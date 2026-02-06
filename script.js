const form = document.getElementById("order-form");
const formNote = document.getElementById("form-note");
const chatWindow = document.getElementById("chat-window");
const chatInput = document.getElementById("chat-input");

const btnPedidos = document.getElementById("btn-pedidos");
const btnChat = document.getElementById("btn-chat");
const btnInstagram = document.getElementById("cta-instagram");
const btnInstagramFeed = document.getElementById("btn-instagram-feed");
const btnCatalogo = document.getElementById("btn-catalogo");
const btnContacto = document.getElementById("btn-contacto");

// Cart elements
const cartBtn = document.getElementById("cart-btn");
const cartSidebar = document.getElementById("cart-sidebar");
const cartClose = document.getElementById("cart-close");
const cartItemsContainer = document.getElementById("cart-items");
const cartCountEl = document.getElementById("cart-count");
const cartTotalEl = document.getElementById("cart-total");
const checkoutBtn = document.getElementById("checkout-btn");

// Lightbox elements
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");
const lightboxClose = document.getElementById("lightbox-close");

// Cart state
let cart = JSON.parse(localStorage.getItem("guategambasCart") || "[]");

const responses = [
  {
    match: ["precio", "costo", "vale"],
    reply:
      "Los precios dependen de la variedad y cantidad. ¿Buscas Bloody Mary, Golden Bee o Sulawesi?",
  },
  {
    match: ["disponible", "stock"],
    reply:
      "Actualmente disponibles: descardes de Bloody Mary. Pregunta por próximas líneas.",
  },
  {
    match: ["envio", "entrega"],
    reply:
      "Hacemos entregas locales y pickup. Confírmame tu ciudad.",
  },
  {
    match: ["parametros", "ph", "gh", "kh"],
    reply:
      "Bloody Mary: pH 6.8-7.4 · GH 6-8. Golden Bee y Sulawesi: pH 6.0-6.6 · GH 4-6.",
  },
];

const instagramUrl = "https://instagram.com/guategambas";

// Cart functions
function updateCart() {
  cartCountEl.textContent = cart.length;
  cartItemsContainer.innerHTML = "";
  
  if (cart.length === 0) {
    cartItemsContainer.innerHTML = '<p style="text-align: center; color: var(--muted);">Tu carrito está vacío</p>';
    checkoutBtn.disabled = true;
  } else {
    checkoutBtn.disabled = false;
    cart.forEach((item, index) => {
      const itemEl = document.createElement("div");
      itemEl.className = "cart-item";
      itemEl.innerHTML = `
        <div class="cart-item-header">
          <strong>${item.name}</strong>
          <button class="cart-item-remove" data-index="${index}">&times;</button>
        </div>
        <p style="color: var(--muted); font-size: 0.9rem;">${item.desc}</p>
        <p style="color: var(--accent); font-weight: 700;">Q ${item.price.toFixed(2)}</p>
      `;
      cartItemsContainer.appendChild(itemEl);
    });
  }
  
  const total = cart.reduce((sum, item) => sum + item.price, 0);
  cartTotalEl.textContent = `Q ${total.toFixed(2)}`;
  localStorage.setItem("guategambasCart", JSON.stringify(cart));
}

function addToCart(species, pack, price, name, desc) {
  cart.push({ species, pack, price, name, desc });
  updateCart();
  cartSidebar.classList.add("active");
}

function removeFromCart(index) {
  cart.splice(index, 1);
  updateCart();
}

// Lightbox functions
function openLightbox(src) {
  lightboxImg.src = src;
  lightbox.classList.add("active");
}

function closeLightbox() {
  lightbox.classList.remove("active");
}

function addMessage(text, type) {
  const bubble = document.createElement("div");
  bubble.className = `chat-bubble ${type}`;
  bubble.textContent = text;
  chatWindow.appendChild(bubble);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function getBotReply(message) {
  const lowered = message.toLowerCase();
  const found = responses.find((item) =>
    item.match.some((word) => lowered.includes(word))
  );
  return (
    found?.reply ||
    "Gracias por escribir. Un asesor te responderá pronto."
  );
}

function handleSend() {
  const message = chatInput.value.trim();
  if (!message) return;
  addMessage(message, "chat-user");
  chatInput.value = "";
  setTimeout(() => {
    addMessage(getBotReply(message), "chat-bot");
  }, 500);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  const stored = JSON.parse(localStorage.getItem("guategambasPedidos") || "[]");
  stored.push({ ...data, fecha: new Date().toISOString() });
  localStorage.setItem("guategambasPedidos", JSON.stringify(stored));
  form.reset();
  formNote.textContent = "Pedido enviado. Te contactaremos por WhatsApp.";
  setTimeout(() => {
    formNote.textContent = "";
  }, 4000);
});

document.getElementById("chat-send").addEventListener("click", handleSend);
chatInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    handleSend();
  }
});

btnPedidos.addEventListener("click", () => {
  document.getElementById("pedidos").scrollIntoView({ behavior: "smooth" });
});

btnChat.addEventListener("click", () => {
  document.getElementById("chatbot").scrollIntoView({ behavior: "smooth" });
});

btnInstagram.addEventListener("click", () => {
  window.open(instagramUrl, "_blank");
});

btnInstagramFeed.addEventListener("click", () => {
  window.open(instagramUrl, "_blank");
});

btnCatalogo.addEventListener("click", () => {
  addMessage("¿Qué variedad deseas ver primero?", "chat-bot");
  document.getElementById("chatbot").scrollIntoView({ behavior: "smooth" });
});

btnContacto.addEventListener("click", () => {
  window.location.href = "mailto:hola@guategambas.com";
});

addMessage("Hola 👋 Soy el bot de GuateGambas. Pregunta por Bloody Mary, Golden Bee o Sulawesi.", "chat-bot");

// Cart event listeners
cartBtn.addEventListener("click", () => {
  cartSidebar.classList.add("active");
});

cartClose.addEventListener("click", () => {
  cartSidebar.classList.remove("active");
});

cartItemsContainer.addEventListener("click", (e) => {
  if (e.target.classList.contains("cart-item-remove")) {
    const index = parseInt(e.target.dataset.index);
    removeFromCart(index);
  }
});

checkoutBtn.addEventListener("click", () => {
  if (cart.length > 0) {
    alert(`Pedido de ${cart.length} pack(s) por Q ${cart.reduce((sum, item) => sum + item.price, 0).toFixed(2)}. Te contactaremos por WhatsApp.`);
    cart = [];
    updateCart();
    cartSidebar.classList.remove("active");
  }
});

// Add to cart buttons
document.querySelectorAll(".add-to-cart").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    const card = e.target.closest(".pack-card");
    const species = card.dataset.species;
    const pack = card.dataset.pack;
    const price = parseFloat(card.dataset.price);
    const name = card.querySelector("h3").textContent;
    const desc = card.querySelector(".pack-desc").textContent;
    addToCart(species, pack, price, name, desc);
  });
});

// Gallery lightbox
document.querySelectorAll(".gallery-img").forEach((img) => {
  img.addEventListener("click", () => {
    openLightbox(img.src);
  });
});

lightboxClose.addEventListener("click", closeLightbox);
lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) closeLightbox();
});

// Initialize cart
updateCart();
