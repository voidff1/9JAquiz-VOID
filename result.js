document.getElementById("scoreText").textContent =
  `Score: ${localStorage.getItem("lastScore")}/${localStorage.getItem("lastTotal")}`;

document.getElementById("timeText").textContent =
  `Time Taken: ${localStorage.getItem("lastTime")}s`;