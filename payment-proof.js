const username = localStorage.getItem("username");

if (!username) {
  window.location.href = "login.html";
}

document.getElementById("submitProofBtn").addEventListener("click", async () => {
  const senderName = document.getElementById("senderName").value;
  const senderAccountNo = document.getElementById("senderAccountNo").value;
  const reference = document.getElementById("reference").value;

  if (!senderName || !senderAccountNo || !reference) {
    alert("Please fill all payment proof details");
    return;
  }

  const res = await fetch("/api/users/payment-proof", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      username,
      senderName,
      senderAccountNo,
      reference
    })
  });

  const data = await res.json();

  if (!data.success) {
    alert(data.message);
    return;
  }

  alert("Payment proof submitted successfully");
  window.location.href = "dashboard.html";
});