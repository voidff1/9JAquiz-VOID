const username = localStorage.getItem("username") || "Player";
document.getElementById("username").textContent = username;

const startBtn = document.getElementById("startBtn");
const paymentStatus = document.getElementById("paymentStatus");
async function loadDashboardSettings() {
  const res = await fetch("/api/users/settings");
  const settings = await res.json();

  document.getElementById("entryFeeText").textContent = `₦${settings.entry_fee}`;
  document.getElementById("weeklyPrizeText").textContent = `₦${settings.weekly_prize}`;
}

loadDashboardSettings();

async function checkQuizAccess() {
  const res = await fetch(`/api/users/quiz-access/${username}`);
  const data = await res.json();

  if (data.access) {
    paymentStatus.textContent = "Payment Approved ✅";
    startBtn.disabled = false;
    startBtn.textContent = "Start Quiz";
    startBtn.onclick = () => {
      window.location.href = "index.html";
    };
  } else {
    paymentStatus.textContent = "Payment Status: False 🚫";
    startBtn.disabled = false;
    startBtn.textContent = "Pay Entry Fee - ₦50";
    startBtn.onclick = () => {
      window.location.href = "payment.html";
    };
  }
}
async function saveContactDetails() {
  const whatsapp = document.getElementById("whatsappInput").value;
  const email = document.getElementById("emailInput").value;
  const bank_name = document.getElementById("bankNameInput").value;
  const account_no = document.getElementById("accountNoInput").value;
  const account_name = document.getElementById("accountNameInput").value;

  const res = await fetch(`/api/users/update-contact/${username}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      whatsapp,
      email,
      bank_name,
      account_no,
      account_name
    })
  });

  const data = await res.json();

  if (!data.success) {
    alert(data.message);
    return;
  }

  alert("Contact details saved successfully");
}
function logout() {
  localStorage.removeItem("username");
  window.location.href = "login.html";
}
async function checkNotification() {
  const res = await fetch(`/api/users/notification/${username}`);
  const data = await res.json();

  if (data.notification) {
    alert(data.notification);

    await fetch(`/api/users/clear-notification/${username}`, {
      method: "POST"
    });
  }
}

checkNotification();


checkQuizAccess();
setInterval(checkQuizAccess, 5000);