function getDeviceId() {
  let deviceId = localStorage.getItem("deviceId");

  if (!deviceId) {
    deviceId = Date.now().toString() + Math.random().toString();
    localStorage.setItem("deviceId", deviceId);
  }

  return deviceId;
}

document.getElementById("loginBtn").addEventListener("click", async () => {
  const loginId = document.getElementById("loginId").value;
  const password = document.getElementById("password").value;
  const deviceId = getDeviceId();

  const res = await fetch("/api/users/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      loginId,
      password,
      deviceId
    })
  });

  const data = await res.json();

  if (!data.success) {
    alert(data.message);
    return;
  }

  localStorage.setItem("token", data.token);
  localStorage.setItem("username", data.user.username);

  window.location.href = "dashboard.html";
});

document.getElementById("registerBtn").addEventListener("click", () => {
  window.location.href = "register.html";
});