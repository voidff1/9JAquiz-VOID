if (localStorage.getItem("adminLoggedIn") !== "true") {
  window.location.href = "admin-login.html";
}



async function loadPayments() {

  const res = await fetch("/api/users/payments");
  const payments = await res.json();

  const body = document.getElementById("paymentsBody");

  body.innerHTML = "";

  payments.forEach(payment => {

    body.innerHTML += `
      <tr>
        <td>${payment.username}</td>
        <td>${payment.sender_name}</td>
        <td>${payment.reference}</td>
        <td>${payment.status}</td>
        <td>
  <button class="approve-btn" onclick="approvePayment(${payment.id})">
    Approve
  </button>

  <button class="reject-btn" onclick="rejectPayment(${payment.id})">
    Reject
  </button>
</td>
      </tr>
    `;

  });

}

loadPayments();
async function approvePayment(id){

  await fetch(`/api/users/approve-payment/${id}`,{
    method:"POST"
  });

  loadPayments();
}

async function rejectPayment(id){

  await fetch(`/api/users/reject-payment/${id}`,{
    method:"POST"
  });

  loadPayments();
}
async function selectWinner(){
  const res = await fetch("/api/users/select-winner", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      prizeAmount: 50000
    })
  });

  const data = await res.json();

  if (!data.success) {
    alert(data.message);
    return;
  }

  alert(`Winner selected: ${data.winner.username}`);
  window.location.href = "winners.html";
}
async function updateWinnerProof() {

  const winnerId = document.getElementById("winnerId").value;
  const proofText = document.getElementById("proofText").value;

  const res = await fetch(
    `/api/users/update-winner-proof/${winnerId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        proofText
      })
    }
  );

  const data = await res.json();

  if (!data.success) {
    alert(data.message);
    return;
  }

  alert("Winner proof updated successfully");
}
function logoutAdmin(){
  localStorage.removeItem("adminLoggedIn");
  localStorage.removeItem("adminUsername");
  localStorage.removeItem("adminRole");

  window.location.href = "admin-login.html";
}