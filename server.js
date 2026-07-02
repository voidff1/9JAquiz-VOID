const express = require("express");
const path = require("path");
require("dotenv").config();

const quizRoutes = require("./routes/quizRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();
const PORT = 5000;

app.use(express.json());

app.use(express.static(path.join(__dirname, "frontend"), {
  index: false
}));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "login.html"));
});

app.use("/api/quiz", quizRoutes);
app.use("/api/users", userRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});