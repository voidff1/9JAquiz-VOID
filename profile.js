const username = localStorage.getItem("username");

if (!username) {
  window.location.href = "login.html";
}

async function loadProfile() {
  const res = await fetch(`/api/users/profile/${username}`);
  const data = await res.json();

  if (!data.success) {
    alert(data.message);
    window.location.href = "dashboard.html";
    return;
  }

  const { user, payments, scores } = data;

  const highestScore = scores.length
    ? Math.max(...scores.map(s => s.score))
    : 0;

  const bestTime = scores.length
    ? Math.min(...scores.map(s => s.time_taken))
    : 0;

  document.getElementById("profileInfo").innerHTML = `
    <h2>${user.username}</h2>
    <p><b>Email:</b> ${user.email}</p>
    <p><b>Phone:</b> ${user.phone}</p>
    <p><b>Quiz Access:</b> ${user.quiz_access ? "Approved ✅" : "Not Approved ⏳"}</p>
    <p><b>Games Played:</b> ${scores.length}</p>
    <p><b>Highest Score:</b> ${highestScore}</p>
    <p><b>Best Time:</b> ${bestTime}s</p>
  `;

  document.getElementById("paymentHistory").innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Reference</th>
          <th>Status</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        ${payments.map(p => `
          <tr>
            <td>${p.reference}</td>
            <td>${p.status}</td>
            <td>${new Date(p.created_at).toLocaleString()}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;

  document.getElementById("quizHistory").innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Score</th>
          <th>Total</th>
          <th>Time</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        ${scores.map(s => `
          <tr>
            <td>${s.score}</td>
            <td>${s.total}</td>
            <td>${s.time_taken}s</td>
            <td>${new Date(s.created_at).toLocaleString()}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

loadProfile();