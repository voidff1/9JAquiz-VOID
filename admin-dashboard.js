if (localStorage.getItem("adminLoggedIn") !== "true") {
  window.location.href = "admin-login.html";
}

function showSection(sectionId) {
  document.querySelectorAll(".page-section").forEach((section) => {
    section.classList.remove("active");
  });

  document.getElementById(sectionId).classList.add("active");
}

let users = [];

async function loadUsers() {

  const res = await fetch("/api/users/all-users");
  users = await res.json();

  displayUsers(users);

}

function displayUsers(data){

  const body = document.getElementById("usersBody");

  body.innerHTML = "";

  data.forEach(user=>{

    body.innerHTML += `
  <tr>
    <td>${user.username}</td>
    <td>${user.email || "N/A"}</td>
    <td>${user.phone || "N/A"}</td>
    <td>${user.whatsapp || "N/A"}</td>
    <td>
      <b>${user.bank_name || "N/A"}</b><br>
      ${user.account_no || "N/A"}<br>
      ${user.account_name || "N/A"}
    </td>
    <td>${user.quiz_access ? "✅ Approved" : "⏳ Pending"}</td>
    <td>${new Date(user.created_at).toLocaleDateString()}</td>
    <td>
      <button class="reject-btn" onclick="deleteUser(${user.id}, '${user.username}')">
        Delete
      </button>
    </td>
  </tr>
`;

  });

}

function searchUsers(){

  const value = document
  .getElementById("userSearch")
  .value
  .toLowerCase();

  const filtered = users.filter(u=>
    u.username.toLowerCase().includes(value)
  );

  displayUsers(filtered);

}
async function endWeek() {
  const confirmEnd = confirm(
    "End this week? This will select winner, reset quiz access, and clear leaderboard."
  );

  if (!confirmEnd) return;

  const res = await fetch("/api/users/end-week", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ prizeAmount: 50000 })
  });

  const data = await res.json();

  if (!data.success) {
    alert(data.message);
    return;
  }

  alert(`Week ended. Winner: ${data.winner.username}`);
}
async function addLog(action, details){

    await fetch("/api/users/add-log",{

        method:"POST",

        headers:{
            "Content-Type":"application/json"
        },

        body:JSON.stringify({

            admin_username:localStorage.getItem("adminUsername"),

            action,

            details

        })

    });

}
async function loadLogs(){

    const res=await fetch("/api/users/logs");

    const logs=await res.json();

    const body=document.getElementById("logsBody");

    body.innerHTML="";

    logs.forEach(log=>{

        body.innerHTML+=`

        <tr>

            <td>${log.admin_username}</td>

            <td>${log.action}</td>

            <td>${log.details}</td>

            <td>

            ${new Date(log.created_at).toLocaleString()}

            </td>

        </tr>

        `;

    });

}

async function loadPayments() {
  const res = await fetch("/api/users/payments");
  const payments = await res.json();

  const body = document.getElementById("paymentsBody");
  body.innerHTML = "";

  payments.forEach((payment) => {
    body.innerHTML += `
      <tr>
        <td>${payment.username}</td>
        <td>${payment.sender_name}</td>
        <td>
  <b>Acct:</b> ${payment.sender_account_no || "N/A"}<br>
  <b>Ref:</b> ${payment.reference}
</td>
        <td>${payment.status}</td>
        <td>
          <button class="approve-btn" onclick="approvePayment(${payment.id})">Approve</button>
          <button class="reject-btn" onclick="rejectPayment(${payment.id})">Reject</button>
        </td>
      </tr>
    `;
  });
}

async function approvePayment(id) {
  await fetch(`/api/users/approve-payment/${id}`, { method: "POST" });
  loadPayments();
}

async function rejectPayment(id) {
  await fetch(`/api/users/reject-payment/${id}`, { method: "POST" });
  loadPayments();
}

async function selectWinner() {
  const res = await fetch("/api/users/select-winner", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prizeAmount: 50000 })
  });

  const data = await res.json();

  if (!data.success) {
    alert(data.message);
    return;
  }

  alert(`Winner selected: ${data.winner.username}`);
  showSection("winners");
}


async function updateWinnerProof() {
  const winnerId = document.getElementById("winnerId").value;
  const proofText = document.getElementById("proofText").value;
  const fileInput = document.getElementById("receiptImage");
  const file = fileInput.files[0];

  if (!winnerId) {
    alert("Please enter Winner ID");
    return;
  }

  let receiptImage = null;

  if (file) {
    receiptImage = await convertImageToBase64(file);
  }

  const res = await fetch(`/api/users/update-winner-proof/${winnerId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      proofText,
      receiptImage
    })
  });

  const data = await res.json();

  if (!data.success) {
    alert(data.message);
    return;
  }

  alert("Winner proof updated successfully");
}

function convertImageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;

    reader.readAsDataURL(file);
  });
}

async function loadQuestions() {
  const res = await fetch("/api/users/questions");
  const questions = await res.json();

  const list = document.getElementById("questionsList");
  list.innerHTML = "";

  questions.forEach((q) => {
    list.innerHTML += `
      <div class="question-item">
        <h3>${q.question}</h3>
        <p>A: ${q.option_a}</p>
        <p>B: ${q.option_b}</p>
        <p>C: ${q.option_c}</p>
        <p>D: ${q.option_d}</p>
        <p><b>Answer:</b> ${q.answer}</p>

        <button class="edit-btn" onclick='editQuestion(${JSON.stringify(q)})'>
          Edit
        </button>

        <button class="reject-btn" onclick="deleteQuestion(${q.id})">
          Delete
        </button>
      </div>
    `;
  });
}

async function addQuestion() {
  const question = document.getElementById("questionInput").value;
  const option_a = document.getElementById("optionA").value;
  const option_b = document.getElementById("optionB").value;
  const option_c = document.getElementById("optionC").value;
  const option_d = document.getElementById("optionD").value;
  const answer = document.getElementById("answerInput").value;
  const category = document.getElementById("categoryInput").value;
  const difficulty = document.getElementById("difficultyInput").value;

  if (!question || !option_a || !option_b || !option_c || !option_d || !answer) {
    alert("Please fill question, all options, and correct answer");
    return;
  }

  function editQuestion(q) {
  document.getElementById("questionInput").value = q.question;
  document.getElementById("optionA").value = q.option_a;
  document.getElementById("optionB").value = q.option_b;
  document.getElementById("optionC").value = q.option_c;
  document.getElementById("optionD").value = q.option_d;
  document.getElementById("answerInput").value = q.answer;
  document.getElementById("categoryInput").value = q.category || "";
  document.getElementById("difficultyInput").value = q.difficulty || "";

  const addBtn = document.getElementById("questionSubmitBtn");
  addBtn.textContent = "Update Question";
  addBtn.onclick = () => updateQuestion(q.id);
}
async function updateQuestion(id) {
  const question = document.getElementById("questionInput").value;
  const option_a = document.getElementById("optionA").value;
  const option_b = document.getElementById("optionB").value;
  const option_c = document.getElementById("optionC").value;
  const option_d = document.getElementById("optionD").value;
  const answer = document.getElementById("answerInput").value;
  const category = document.getElementById("categoryInput").value;
  const difficulty = document.getElementById("difficultyInput").value;

  const res = await fetch(`/api/users/edit-question/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      option_a,
      option_b,
      option_c,
      option_d,
      answer,
      category,
      difficulty
    })
  });

  const data = await res.json();

  if (!data.success) {
    alert(data.message);
    return;
  }

  alert("Question updated successfully");
  location.reload();
}

  const res = await fetch("/api/users/add-question", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      option_a,
      option_b,
      option_c,
      option_d,
      answer,
      category,
      difficulty
    })
  });

  const data = await res.json();

  if (!data.success) {
    alert(data.message);
    return;
  }

  alert("Question added successfully");

  document.getElementById("questionInput").value = "";
  document.getElementById("optionA").value = "";
  document.getElementById("optionB").value = "";
  document.getElementById("optionC").value = "";
  document.getElementById("optionD").value = "";
  document.getElementById("answerInput").value = "";
  document.getElementById("categoryInput").value = "";
  document.getElementById("difficultyInput").value = "";

  loadQuestions();
}

async function deleteQuestion(id) {
  const confirmDelete = confirm("Are you sure you want to delete this question?");

  if (!confirmDelete) return;

  await fetch(`/api/users/delete-question/${id}`, {
    method: "DELETE"
  });

  loadQuestions();
}
async function loadSettings() {
  const res = await fetch("/api/users/settings");
  const settings = await res.json();

  document.getElementById("entryFee").value = settings.entry_fee;
  document.getElementById("weeklyPrize").value = settings.weekly_prize;
  document.getElementById("quizTimer").value = settings.quiz_timer;
  document.getElementById("questionsPerQuiz").value = settings.questions_per_quiz;
}
async function deleteUser(id, username) {
  const confirmDelete = confirm(
    `Are you sure you want to delete user "${username}"? This cannot be undone.`
  );

  if (!confirmDelete) return;

  const res = await fetch(`/api/users/delete-user/${id}`, {
    method: "DELETE"
  });

  const data = await res.json();

  if (!data.success) {
    alert(data.message);
    return;
  }

  alert("User deleted successfully");
  loadUsers();
}
async function saveSettings() {
  const entry_fee = document.getElementById("entryFee").value;
  const weekly_prize = document.getElementById("weeklyPrize").value;
  const quiz_timer = document.getElementById("quizTimer").value;
  const questions_per_quiz = document.getElementById("questionsPerQuiz").value;

  const res = await fetch("/api/users/settings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      entry_fee,
      weekly_prize,
      quiz_timer,
      questions_per_quiz
    })
  });

  const data = await res.json();

  if (!data.success) {
    alert(data.message);
    return;
  }

  alert("Settings saved successfully");
}

function logoutAdmin() {
  localStorage.removeItem("adminLoggedIn");
  localStorage.removeItem("adminUsername");
  localStorage.removeItem("adminRole");

  window.location.href = "admin-login.html";
}

loadUsers();
loadPayments();
loadQuestions();
loadSettings();
loadLogs();