let questions = [];
let currentQuestion = 0;
let answers = {};
let timeLeft = 180;
let startTime = Date.now();
let timer;

const timerEl = document.getElementById("timer");
const questionNumber = document.getElementById("questionNumber");
const questionText = document.getElementById("questionText");
const optionsDiv = document.getElementById("options");
const progressBar = document.getElementById("progressBar");
const result = document.getElementById("result");

async function checkAccess() {
  const username = localStorage.getItem("username");

  if (!username) {
    window.location.href = "login.html";
    return;
  }

  const res = await fetch(`/api/users/quiz-access/${username}`);
  const data = await res.json();

  if (!data.access) {
    alert("Payment not approved yet");
    window.location.href = "dashboard.html";
    return;
  }

  loadQuiz();
}

async function loadQuiz() {
  try {
    const settingsRes = await fetch("/api/users/settings");
const settings = await settingsRes.json();
timeLeft = settings.quiz_timer || 180;
    const res = await fetch("/api/quiz");
    questions = await res.json();

    console.log("Loaded questions:", questions);

    if (!Array.isArray(questions) || questions.length === 0) {
      questionText.textContent = "No questions available";
      return;
    }

    showQuestion();
    startTimer();

  } catch (error) {
    console.log(error);
    questionText.textContent = "Failed to load questions";
  }
}

function showQuestion() {
  const q = questions[currentQuestion];

  questionNumber.textContent = `Question ${currentQuestion + 1} of ${questions.length}`;
  questionText.textContent = q.question;

  progressBar.style.width = `${((currentQuestion + 1) / questions.length) * 100}%`;

  optionsDiv.innerHTML = "";

  q.options.forEach((option, index) => {
    const btn = document.createElement("button");
    btn.className = "option";
    btn.textContent = `${String.fromCharCode(65 + index)}. ${option}`;

    if (answers[q.id] === option) {
      btn.classList.add("selected");
    }

    btn.addEventListener("click", () => {
      answers[q.id] = option;
      showQuestion();
    });

    optionsDiv.appendChild(btn);
  });
}

document.getElementById("prevBtn").addEventListener("click", () => {
  if (currentQuestion > 0) {
    currentQuestion--;
    showQuestion();
  }
});

document.getElementById("nextBtn").addEventListener("click", () => {
  if (currentQuestion < questions.length - 1) {
    currentQuestion++;
    showQuestion();
  }
});

document.getElementById("submitBtn").addEventListener("click", submitQuiz);

async function submitQuiz() {
  clearInterval(timer);

  const timeTaken = Math.floor((Date.now() - startTime) / 1000);

  const res = await fetch("/api/quiz/submit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      username: localStorage.getItem("username") || "Guest",
      answers,
      timeTaken
    })
  });

  const data = await res.json();

  if (!data.success) {
    alert(data.message);
    return;
  }

  localStorage.setItem("lastScore", data.score);
  localStorage.setItem("lastTotal", data.total);
  localStorage.setItem("lastTime", timeTaken);

  result.textContent = `You scored ${data.score}/${data.total}`;

  setTimeout(() => {
    window.location.href = "result.html";
  }, 1500);
}

function startTimer() {
  timer = setInterval(() => {
    timerEl.textContent = `${timeLeft}s`;
    timeLeft--;

    if (timeLeft < 0) {
      clearInterval(timer);
      submitQuiz();
    }
  }, 1000);
}

checkAccess();
