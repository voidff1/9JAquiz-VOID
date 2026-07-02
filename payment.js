document.getElementById("payBtn").addEventListener("click", () => {
  window.location.href = "payment-proof.html";
});
async function loadPaymentSettings() {
  const res = await fetch("/api/users/settings");
  const settings = await res.json();

  document.getElementById("entryFeeAmount").textContent = `₦${settings.entry_fee}`;
}

loadPaymentSettings();