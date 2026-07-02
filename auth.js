const playerPages = [
  "dashboard.html",
  "profile.html",
  "payment-proof.html",
  "leaderboard.html",
  "winners.html",
  "index.html"
];

const adminPages = [
  "admin-dashboard.html"
];

const page = location.pathname.split("/").pop();

if (playerPages.includes(page)) {
  if (!localStorage.getItem("username")) {
    window.location.href = "login.html";
  }
}

if (adminPages.includes(page)) {
  if (localStorage.getItem("adminLoggedIn") !== "true") {
    window.location.href = "admin-login.html";
  }
}
window.history.pushState(null, "", window.location.href);

window.onpopstate = function () {
  window.history.pushState(null, "", window.location.href);
};