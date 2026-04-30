const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  saveGameSession,
  getMyStats,
  getLeaderboard
} = require("../controllers/gameController");

router.post("/sessions", authMiddleware, saveGameSession);
router.get("/stats/me", authMiddleware, getMyStats);
router.get("/leaderboard", getLeaderboard);

module.exports = router;