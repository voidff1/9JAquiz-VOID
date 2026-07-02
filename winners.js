async function loadWinners(){
  const res = await fetch("/api/users/winners");
  const winners = await res.json();

  const latest = document.getElementById("latestWinner");
  const previous = document.getElementById("previousWinners");

  latest.innerHTML = "";
  previous.innerHTML = "";

  if (!winners.length) {
    latest.innerHTML = "<p>No winners yet.</p>";
    return;
  }

  const winner = winners[0];

  latest.innerHTML = `
    <h2>Winner Profile</h2>

    <div class="profile-card">
      <h2>${winner.username}</h2>
      <p>Amount won</p>
      <h1>₦${winner.prize_amount}</h1>
      <p>Score: ${winner.score}</p>
      <p>Time: ${winner.time_taken}s</p>
    </div>

    <div class="receipt-card">
      <h2>Payment Receipt</h2>
      <p>${winner.proof_text || "Payment proof coming soon"}</p>

      ${
        winner.receipt_image
          ? `<img class="receipt-img" src="${winner.receipt_image}" alt="Payment Receipt">`
          : `<p>No receipt image uploaded yet.</p>`
      }
    </div>
  `;

  winners.slice(1).forEach(w => {
    previous.innerHTML += `
      <div class="previous-card">
        <h3>${w.username}</h3>
        <p>₦${w.prize_amount} • Score ${w.score} • ${w.time_taken}s</p>
        <p>${w.proof_text || "Payment proof coming soon"}</p>

        ${
          w.receipt_image
            ? `<img class="small-receipt-img" src="${w.receipt_image}" alt="Payment Receipt">`
            : ""
        }
      </div>
    `;
  });
}

loadWinners();