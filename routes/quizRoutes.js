const express = require("express");
const supabase = require("../supabase");

const router = express.Router();

function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

router.get("/", async (req, res) => {
  const { data, error } = await supabase
    .from("questions")
    .select("*");

  if (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }

 const { data: settings } = await supabase
  .from("settings")
  .select("*")
  .limit(1)
  .single();

const questionCount = settings?.questions_per_quiz || 10;

const randomQuestions = shuffle([...data]).slice(0, questionCount);

  const publicQuestions = randomQuestions.map((q) => ({
    id: q.id,
    question: q.question,
    options: shuffle([
      q.option_a,
      q.option_b,
      q.option_c,
      q.option_d
    ])
  }));

  res.json(publicQuestions);
});

router.post("/submit", async (req, res) => {
  const { username, answers, timeTaken } = req.body;

  const questionIds = Object.keys(answers || {});

  const { data: questions, error } = await supabase
    .from("questions")
    .select("*")
    .in("id", questionIds);

  if (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }

  let score = 0;

  questions.forEach((q) => {
    if (answers[q.id] === q.answer) {
      score++;
    }
  });

  const { error: scoreError } = await supabase
    .from("scores")
    .insert([
      {
        username: username || "Guest",
        score,
        total: questions.length,
        time_taken: timeTaken || 0
      }
    ]);

  if (scoreError) {
    return res.status(400).json({
      success: false,
      message: scoreError.message
    });
  }

  await supabase
    .from("users")
    .update({ quiz_access: false })
    .eq("username", username);

  res.json({
    success: true,
    score,
    total: questions.length,
    timeTaken: timeTaken || 0
  });
});

router.get("/leaderboard", async (req, res) => {
  const { data, error } = await supabase
    .from("scores")
    .select("*")
    .order("score", { ascending: false })
    .order("time_taken", { ascending: true })
    .limit(20);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  res.json(data);
});

module.exports = router;
