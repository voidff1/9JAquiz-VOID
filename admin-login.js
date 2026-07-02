document.getElementById("adminLoginBtn").addEventListener("click", async () => {
  const username = document.getElementById("adminUsername").value;
  const password = document.getElementById("adminPassword").value;

  const res = await fetch("/api/users/admin-login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();

  if (!data.success) {
    alert(data.message);
    return;
  }

  localStorage.setItem("adminLoggedIn", "true");
  localStorage.setItem("adminUsername", data.admin.username);
  localStorage.setItem("adminRole", data.admin.role);

  window.location.href = "admin-dashboard.html";
});