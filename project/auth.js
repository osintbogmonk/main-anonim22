// auth.js
import { supabase } from "./supabase.js";

async function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) return alert(error.message);

  localStorage.setItem("user", JSON.stringify(data.user));
  window.location.href = "chat.html";
}

async function register() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  const { error } = await supabase.auth.signUp({ email, password });
  if (error) return alert(error.message);

  alert("Проверь почту для подтверждения");
}

window.login = login;
window.register = register;
