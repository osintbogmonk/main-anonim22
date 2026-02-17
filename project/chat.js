import { supabase } from "./supabase.js";

let currentChatId = null;
let user = null;
let subscription = null;
let allChats = [];

// Получаем пользователя
async function getUser() {
  const stored = localStorage.getItem("user");
  if (!stored) {
    window.location.href = "index.html";
    return;
  }
  user = JSON.parse(stored);
}

// Загружаем чаты
async function loadChats() {
  const { data: chats, error } = await supabase
    .from("chats")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  allChats = chats;
  renderChats(chats);
}

// Рендер списка чатов
function renderChats(chats) {
  const chatList = document.getElementById("chatList");
  chatList.innerHTML = "";

  chats.forEach(chat => {
    const div = document.createElement("div");
    div.className = "chat-item";
    div.innerText = chat.name;
    div.onclick = () => openChat(chat.id);
    chatList.appendChild(div);
  });
}

// Поиск чатов
window.filterChats = function () {
  const q = document.getElementById("searchChat").value.toLowerCase();
  const filtered = allChats.filter(c => c.name.toLowerCase().includes(q));
  renderChats(filtered);
};

// Открыть чат
async function openChat(chatId) {
  currentChatId = chatId;

  // Удаляем старую подписку
  if (subscription) {
    supabase.removeChannel(subscription);
  }

  // Загружаем сообщения
  const { data: messages, error } = await supabase
    .from("messages")
    .select("*")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error(error);
    return;
  }

  const messageList = document.getElementById("messageList");
  messageList.innerHTML = "";

  messages.forEach(msg => {
    const div = document.createElement("div");
    div.className = "msg";
    div.innerText = msg.text;
    messageList.appendChild(div);
  });

  messageList.scrollTop = messageList.scrollHeight;

  // Real-time подписка
  subscription = supabase
    .channel("messages")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `chat_id=eq.${chatId}`
      },
      (payload) => {
        const msg = payload.new;
        const div = document.createElement("div");
        div.className = "msg";
        div.innerText = msg.text;
        messageList.appendChild(div);
        messageList.scrollTop = messageList.scrollHeight;
      }
    )
    .subscribe();
}

// Отправить сообщение
window.sendMessage = async function () {
  if (!currentChatId) return alert("Выберите чат!");

  const input = document.getElementById("msgInput");
  const text = input.value.trim();
  if (!text) return;

  const { error } = await supabase.from("messages").insert([
    {
      chat_id: currentChatId,
      user_id: user.id,
      text
    }
  ]);

  if (error) {
    console.error(error);
    alert("Ошибка отправки");
    return;
  }

  input.value = "";
};

// Инициализация
(async () => {
  await getUser();
  await loadChats();
})();
