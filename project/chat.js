import { supabase } from "./supabase.js";

let currentChatId = null;
let user = null;
let subscription = null;

async function getUser() {
  const stored = localStorage.getItem("user");
  if (!stored) {
    window.location.href = "index.html";
    return;
  }
  user = JSON.parse(stored);
}

async function loadChats() {
  const { data: chats } = await supabase
    .from("chats")
    .select("*")
    .order("created_at", { ascending: false });

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

async function openChat(chatId) {
  currentChatId = chatId;

  if (subscription) supabase.removeChannel(subscription);

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });

  const messageList = document.getElementById("messageList");
  messageList.innerHTML = "";

  messages.forEach(msg => {
    const div = document.createElement("div");
    div.className = "msg";
    div.innerText = msg.text;
    messageList.appendChild(div);
  });

  messageList.scrollTop = messageList.scrollHeight;

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

async function sendMessage() {
  if (!currentChatId) return alert("Выберите чат!");

  const text = document.getElementById("msgInput").value.trim();
  if (!text) return;

  await supabase.from("messages").insert([
    {
      chat_id: currentChatId,
      user_id: user.id,
      text
    }
  ]);

  document.getElementById("msgInput").value = "";
}

window.sendMessage = sendMessage;

(async () => {
  await getUser();
  await loadChats();
})();
