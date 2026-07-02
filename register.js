document.getElementById("registerBtn").addEventListener("click", async () => {
  const username = document.getElementById("username").value;
  const email = document.getElementById("email").value;
  const phone = document.getElementById("phone").value;
  const password = document.getElementById("password").value;

  const res = await fetch("/api/users/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      username,
      email,
      phone,
      password
    })
  });

  const data = await res.json();

  if (!data.success) {
    alert(data.message);
    return;
  }

  alert("Account created successfully");
  window.location.href = "login.html";
});