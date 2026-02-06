const form = document.getElementById("order-form");
const formNote = document.getElementById("form-note");
const chatWindow = document.getElementById("chat-window");
const chatInput = document.getElementById("chat-input");

const btnPedidos = document.getElementById("btn-pedidos");
const btnChat = document.getElementById("btn-chat");
const btnInstagram = document.getElementById("cta-instagram");
const btnCatalogo = document.getElementById("btn-catalogo");
const btnContacto = document.getElementById("btn-contacto");

const responses = [
  {
    match: ["precio", "costo", "vale"],
    reply:
      "Los precios dependen de la variedad y cantidad. ¿Qué gamba te interesa?",
  },
  {
    match: ["disponible", "stock"],
    reply:
      "Hoy tenemos Sakura, Blue Dream y Crystal Red. ¿Quieres reservar?",
  },
  {
    match: ["envio", "entrega"],
    reply:
      "Hacemos entregas locales y pickup. Confírmame tu ciudad.",
  },
  {
    match: ["parametros", "ph", "gh", "kh"],
    reply:
      "Neocaridinas: pH 6.8-7.4 · GH 6-8. Caridinas: pH 6.0-6.6 · GH 4-6.",
  },
];

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
  window.open("https://instagram.com", "_blank");
});

btnCatalogo.addEventListener("click", () => {
  addMessage("¿Qué variedad deseas ver primero?", "chat-bot");
  document.getElementById("chatbot").scrollIntoView({ behavior: "smooth" });
});

btnContacto.addEventListener("click", () => {
  window.location.href = "mailto:hola@guategambas.com";
});

addMessage("Hola 👋 Soy el bot de GuateGambas. ¿En qué te ayudo?", "chat-bot");
