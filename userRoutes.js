const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const supabase = require("../supabase");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { username, email, phone, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          username,
          email,
          phone,
          password: hashedPassword
        }
      ])
      .select();

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.json({
      success: true,
      message: "Account created successfully",
      user: data[0]
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { loginId, password, deviceId } = req.body;

    const { data: users, error } = await supabase
      .from("users")
      .select("*")
      .or(`email.eq.${loginId},phone.eq.${loginId}`);

    if (error || users.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid login details"
      });
    }

    const user = users[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid password"
      });
    }

    if (user.device_id && user.device_id !== deviceId) {
      return res.status(403).json({
        success: false,
        message: "This account is already logged in on another device"
      });
    }

    await supabase
      .from("users")
      .update({ device_id: deviceId })
      .eq("id", user.id);

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});
router.post("/update-contact/:username", async (req, res) => {
  const { username } = req.params;
  const { whatsapp, email, bank_name, account_no, account_name } = req.body;

  const { error } = await supabase
    .from("users")
    .update({
      whatsapp,
      email,
      bank_name,
      account_no,
      account_name
    })
    .eq("username", username);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  res.json({ success: true });
});

router.post("/payment-proof", async (req, res) => {
  const { username, senderName, senderAccountNo, reference } = req.body;

  const { error } = await supabase
    .from("payments")
    .insert([
      {
        username,
        sender_name: senderName,
        sender_account_no: senderAccountNo,
        reference,
        status: "pending"
      }
    ]);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  res.json({
    success: true,
    message: "Payment proof submitted"
  });
});

router.get("/payments", async (req, res) => {

  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(400).json({
      success:false,
      message:error.message
    });
  }

  res.json(data);
});

router.post("/approve-payment/:id", async (req, res) => {
  const { id } = req.params;

  const { data: payment } = await supabase
    .from("payments")
    .select("*")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("payments")
    .update({ status: "approved" })
    .eq("id", id);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  await supabase
    .from("users")
    .update({
      quiz_access: true,
      notification: "🎉 Your payment has been approved. You can now start the quiz!"
    })
    .eq("username", payment.username);

  res.json({ success: true });
});

router.post("/reject-payment/:id", async (req, res) => {
  const { id } = req.params;

  const { data: payment } = await supabase
    .from("payments")
    .select("*")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("payments")
    .update({ status: "rejected" })
    .eq("id", id);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  await supabase
    .from("users")
    .update({
      quiz_access: false,
      notification: "❌ Your payment was rejected. Please upload valid payment proof."
    })
    .eq("username", payment.username);

  res.json({ success: true });
});

router.get("/payment-status/:username", async (req, res) => {
  const { username } = req.params;

  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("username", username)
    .eq("status", "approved")
    .limit(1);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  res.json({
    success: true,
    approved: data.length > 0
  });
});

router.get("/quiz-access/:username", async (req, res) => {
  const { username } = req.params;

  const { data, error } = await supabase
    .from("users")
    .select("quiz_access")
    .eq("username", username)
    .single();

  if (error) {
    return res.status(400).json({
      access: false,
      message: error.message
    });
  }

  res.json({
    access: data.quiz_access
  });
});

router.post("/select-winner", async (req, res) => {
  const { prizeAmount } = req.body;

  const { data: topScores, error } = await supabase
    .from("scores")
    .select("*")
    .order("score", { ascending: false })
    .order("time_taken", { ascending: true })
    .limit(1);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  if (!topScores || topScores.length === 0) {
    return res.status(404).json({
      success: false,
      message: "No scores found"
    });
  }

  const winner = topScores[0];

  const { error: winnerError } = await supabase
    .from("winners")
    .insert([
      {
        username: winner.username,
        score: winner.score,
        time_taken: winner.time_taken,
        prize_amount: prizeAmount || 50000,
        proof_text: "Payment proof coming soon"
      }
    ]);

  if (winnerError) {
    return res.status(400).json({
      success: false,
      message: winnerError.message
    });
  }

  res.json({
    success: true,
    winner
  });
});

router.get("/winners", async (req, res) => {
  const { data, error } = await supabase
    .from("winners")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  res.json(data);
});

router.post("/update-winner-proof/:id", async (req, res) => {
  const { id } = req.params;
  const { proofText, receiptImage } = req.body;

  const updateData = {};

  if (proofText !== undefined) {
    updateData.proof_text = proofText;
  }

  if (receiptImage) {
    updateData.receipt_image = receiptImage;
  }

  const { error } = await supabase
    .from("winners")
    .update(updateData)
    .eq("id", id);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  res.json({ success: true });
});

router.post("/admin-login", async (req, res) => {
  const { username, password } = req.body;

  const { data: admin, error } = await supabase
    .from("admins")
    .select("*")
    .eq("username", username)
    .eq("password", password)
    .single();

  if (error || !admin) {
    return res.status(401).json({
      success: false,
      message: "Invalid admin credentials"
    });
  }

  res.json({
    success: true,
    admin
  });
});

router.get("/questions", async (req, res) => {
  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .order("id", { ascending: false });

  if (error) return res.status(400).json({ success: false, message: error.message });

  res.json(data);
});

router.post("/add-question", async (req, res) => {
  const { question, option_a, option_b, option_c, option_d, answer, category, difficulty } = req.body;

  const { error } = await supabase.from("questions").insert([
    { question, option_a, option_b, option_c, option_d, answer, category, difficulty }
  ]);

  if (error) return res.status(400).json({ success: false, message: error.message });

  res.json({ success: true });
});

router.delete("/delete-question/:id", async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from("questions")
    .delete()
    .eq("id", id);

  if (error) return res.status(400).json({ success: false, message: error.message });

  res.json({ success: true });
});

router.put("/edit-question/:id", async (req, res) => {
  const { id } = req.params;
  const { question, option_a, option_b, option_c, option_d, answer, category, difficulty } = req.body;

  const { error } = await supabase
    .from("questions")
    .update({
      question,
      option_a,
      option_b,
      option_c,
      option_d,
      answer,
      category,
      difficulty
    })
    .eq("id", id);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  res.json({ success: true });
});

router.get("/all-users", async (req, res) => {
  const { data, error } = await supabase
    .from("users")
    .select("id, username, email, phone, whatsapp, bank_name, account_no, account_name, quiz_access, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  res.json(data);
});

router.get("/profile/:username", async (req, res) => {
  const { username } = req.params;

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("username, email, phone, quiz_access, created_at")
    .eq("username", username)
    .single();

  if (userError) {
    return res.status(400).json({
      success: false,
      message: userError.message
    });
  }

  const { data: payments } = await supabase
    .from("payments")
    .select("*")
    .eq("username", username)
    .order("created_at", { ascending: false });

  const { data: scores } = await supabase
    .from("scores")
    .select("*")
    .eq("username", username)
    .order("created_at", { ascending: false });

  res.json({
    success: true,
    user,
    payments: payments || [],
    scores: scores || []
  });
});
router.get("/settings", async (req, res) => {
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .limit(1)
    .single();

  if (error) {
    return res.status(400).json({ success: false, message: error.message });
  }

  res.json(data);
});

router.post("/settings", async (req, res) => {
  const { entry_fee, weekly_prize, quiz_timer, questions_per_quiz } = req.body;

  const { error } = await supabase
    .from("settings")
    .update({
      entry_fee,
      weekly_prize,
      quiz_timer,
      questions_per_quiz
    })
    .eq("id", 1);

  if (error) {
    return res.status(400).json({ success: false, message: error.message });
  }

  res.json({ success: true });
});

router.get("/notification/:username", async (req, res) => {
  const { username } = req.params;

  const { data, error } = await supabase
    .from("users")
    .select("notification")
    .eq("username", username)
    .single();

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  res.json({
    success: true,
    notification: data.notification
  });
});

router.post("/clear-notification/:username", async (req, res) => {
  const { username } = req.params;

  const { error } = await supabase
    .from("users")
    .update({ notification: "" })
    .eq("username", username);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  res.json({ success: true });
});

router.delete("/delete-user/:id", async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from("users")
    .delete()
    .eq("id", id);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  res.json({
    success: true,
    message: "User deleted successfully"
  });
});
router.post("/end-week", async (req, res) => {
  const { prizeAmount } = req.body;

  const { data: topScores, error } = await supabase
    .from("scores")
    .select("*")
    .order("score", { ascending: false })
    .order("time_taken", { ascending: true })
    .limit(1);

  if (error) return res.status(400).json({ success:false, message:error.message });

  if (!topScores || topScores.length === 0) {
    return res.status(404).json({ success:false, message:"No scores found" });
  }

  const winner = topScores[0];

  await supabase.from("winners").insert([{
    username: winner.username,
    score: winner.score,
    time_taken: winner.time_taken,
    prize_amount: prizeAmount || 50000,
    proof_text: "Payment proof coming soon"
  }]);

  await supabase.from("users").update({ quiz_access:false }).neq("id", 0);

  await supabase.from("scores").delete().neq("id", 0);

  res.json({
    success:true,
    message:"Weekly competition ended successfully",
    winner
  });
});
router.post("/add-log", async (req, res) => {

    const { admin_username, action, details } = req.body;

    const { error } = await supabase
        .from("admin_logs")
        .insert([
            {
                admin_username,
                action,
                details
            }
        ]);

    if (error) {

        return res.status(400).json({
            success:false,
            message:error.message
        });

    }

    res.json({
        success:true
    });

});
router.get("/logs", async(req,res)=>{

    const {data,error}=await supabase

    .from("admin_logs")

    .select("*")

    .order("created_at",{ascending:false});

    if(error){

        return res.status(400).json({
            success:false,
            message:error.message
        });

    }

    res.json(data);

});
router.get("/admin-stats", async (req, res) => {
  try {
    const { data: users } = await supabase.from("users").select("id");
    const { data: payments } = await supabase.from("payments").select("*");
    const { data: scores } = await supabase.from("scores").select("*");
    const { data: questions } = await supabase.from("questions").select("id");
    const { data: winners } = await supabase.from("winners").select("id");
    const { data: settings } = await supabase
      .from("settings")
      .select("*")
      .limit(1)
      .single();

    const approvedPayments = payments.filter(p => p.status === "approved");
    const pendingPayments = payments.filter(p => p.status === "pending");
    const rejectedPayments = payments.filter(p => p.status === "rejected");

    const entryFee = settings?.entry_fee || 50;
    const revenue = approvedPayments.length * entryFee;

    res.json({
      success: true,
      totalUsers: users.length,
      totalPayments: payments.length,
      approvedPayments: approvedPayments.length,
      pendingPayments: pendingPayments.length,
      rejectedPayments: rejectedPayments.length,
      revenue,
      totalAttempts: scores.length,
      totalQuestions: questions.length,
      totalWinners: winners.length
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

module.exports = router;