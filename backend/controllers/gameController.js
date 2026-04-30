const db = require("../db");

const saveGameSession = (req, res) => {
  const userId = req.user.id;

  const {
    server_id,
    level_id,
    score,
    attempts,
    hints_used,
    completed,
    completion_time,
    server_stability,
    mode
  } = req.body;

  if (!server_id || !level_id) {
    return res.status(400).json({
      message: "Server ID and Level ID are required"
    });
  }

  db.run(
    `
    INSERT INTO game_sessions (
      user_id,
      server_id,
      level_id,
      score,
      attempts,
      hints_used,
      completed,
      completion_time,
      server_stability,
      mode
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      userId,
      server_id,
      level_id,
      score || 0,
      attempts || 0,
      hints_used || 0,
      completed ? 1 : 0,
      completion_time || 0,
      server_stability || 0,
      mode || "classic"
    ],
    function (err) {
      if (err) {
        console.error("Save session error:", err.message);

        return res.status(500).json({
          message: "Failed to save game session",
          error: err.message
        });
      }

      const sessionId = this.lastID;

      db.run(
        `
        INSERT INTO logs (user_id, action, details)
        VALUES (?, ?, ?)
        `,
        [
          userId,
          "GAME_SESSION_SAVED",
          JSON.stringify({
            server_id,
            level_id,
            score,
            attempts,
            hints_used,
            completed,
            completion_time,
            server_stability,
            mode
          })
        ]
      );

      updateServerProgress(userId, server_id, () => {
        return res.status(201).json({
          message: "Game session saved successfully",
          session_id: sessionId
        });
      });
    }
  );
};

const updateServerProgress = (userId, serverId, callback) => {
  db.get(
    `SELECT COUNT(*) as total FROM levels WHERE server_id = ?`,
    [serverId],
    (err, totalRow) => {
      if (err) {
        console.error("Total levels error:", err.message);
        return callback();
      }

      db.get(
        `
        SELECT
          COUNT(DISTINCT level_id) as completed_levels,
          SUM(score) as total_score,
          AVG(completion_time) as average_time,
          SUM(hints_used) as total_hints
        FROM game_sessions
        WHERE user_id = ? AND server_id = ? AND completed = 1
        `,
        [userId, serverId],
        (err2, progress) => {
          if (err2) {
            console.error("Progress error:", err2.message);
            return callback();
          }

          const totalLevels = totalRow.total || 0;
          const completedLevels = progress.completed_levels || 0;
          const totalScore = progress.total_score || 0;

          const stability =
            totalLevels > 0 ? Math.round((completedLevels / totalLevels) * 100) : 0;

          const completed = completedLevels >= totalLevels && totalLevels > 0 ? 1 : 0;

          let crown = "";

          if (completed) {
            const maxPossibleScore = totalLevels * 180;
            const percent = maxPossibleScore > 0 ? totalScore / maxPossibleScore : 0;

            if (percent >= 0.9) {
              crown = "👑 Gold";
            } else if (percent >= 0.7) {
              crown = "🥈 Silver";
            } else {
              crown = "🥉 Bronze";
            }
          }

          db.run(
            `
            INSERT INTO server_progress (
              user_id,
              server_id,
              completed_levels,
              total_levels,
              stability,
              total_score,
              crown,
              completed,
              updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id, server_id)
            DO UPDATE SET
              completed_levels = excluded.completed_levels,
              total_levels = excluded.total_levels,
              stability = excluded.stability,
              total_score = excluded.total_score,
              crown = excluded.crown,
              completed = excluded.completed,
              updated_at = CURRENT_TIMESTAMP
            `,
            [
              userId,
              serverId,
              completedLevels,
              totalLevels,
              stability,
              totalScore,
              crown,
              completed
            ],
            (err3) => {
              if (err3) {
                console.error("Server progress save error:", err3.message);
              }

              checkAchievements(userId, {
                completedLevels,
                completed,
                crown,
                totalHints: progress.total_hints || 0,
                averageTime: progress.average_time || 0
              });

              callback();
            }
          );
        }
      );
    }
  );
};

const checkAchievements = (userId, progress) => {
  db.all(`SELECT * FROM achievements`, [], (err, achievements) => {
    if (err || !achievements) return;

    achievements.forEach((achievement) => {
      let earned = false;

      if (
        achievement.condition_type === "completed_levels" &&
        progress.completedLevels >= achievement.condition_value
      ) {
        earned = true;
      }

      if (
        achievement.condition_type === "completed_servers" &&
        progress.completed === 1
      ) {
        earned = true;
      }

      if (
        achievement.condition_type === "gold_crown" &&
        progress.crown.includes("Gold")
      ) {
        earned = true;
      }

      if (earned) {
        db.run(
          `
          INSERT OR IGNORE INTO user_achievements (
            user_id,
            achievement_id
          ) VALUES (?, ?)
          `,
          [userId, achievement.id]
        );
      }
    });
  });
};

const getMyStats = (req, res) => {
  const userId = req.user.id;

  db.get(
    `
    SELECT
      COUNT(*) as total_sessions,
      SUM(completed) as completed_levels,
      SUM(score) as total_score,
      ROUND(AVG(score), 2) as average_score,
      ROUND(AVG(completion_time), 2) as average_time,
      SUM(attempts) as total_attempts,
      SUM(hints_used) as total_hints
    FROM game_sessions
    WHERE user_id = ?
    `,
    [userId],
    (err, stats) => {
      if (err) {
        return res.status(500).json({
          message: "Failed to fetch stats",
          error: err.message
        });
      }

      db.all(
        `
        SELECT
          servers.title,
          servers.reward_icon,
          server_progress.completed_levels,
          server_progress.total_levels,
          server_progress.stability,
          server_progress.total_score,
          server_progress.crown,
          server_progress.completed
        FROM server_progress
        JOIN servers ON servers.id = server_progress.server_id
        WHERE server_progress.user_id = ?
        ORDER BY servers.order_number ASC
        `,
        [userId],
        (progressErr, serverProgress) => {
          if (progressErr) {
            return res.status(500).json({
              message: "Failed to fetch server progress",
              error: progressErr.message
            });
          }

          db.all(
            `
            SELECT
              achievements.name,
              achievements.description,
              achievements.icon,
              user_achievements.earned_at
            FROM user_achievements
            JOIN achievements ON achievements.id = user_achievements.achievement_id
            WHERE user_achievements.user_id = ?
            ORDER BY user_achievements.earned_at DESC
            `,
            [userId],
            (achievementErr, achievements) => {
              if (achievementErr) {
                return res.status(500).json({
                  message: "Failed to fetch achievements",
                  error: achievementErr.message
                });
              }

              return res.json({
                stats,
                server_progress: serverProgress,
                achievements
              });
            }
          );
        }
      );
    }
  );
};

const getLeaderboard = (req, res) => {
  db.all(
    `
    SELECT 
      users.username,
      SUM(game_sessions.score) as total_score,
      COUNT(game_sessions.id) as total_sessions,
      SUM(game_sessions.completed) as completed_levels,
      COUNT(DISTINCT server_progress.server_id) as servers_started,
      SUM(server_progress.completed) as completed_servers,
      SUM(CASE WHEN server_progress.crown LIKE '%Gold%' THEN 1 ELSE 0 END) as gold_crowns
    FROM users
    LEFT JOIN game_sessions ON users.id = game_sessions.user_id
    LEFT JOIN server_progress ON users.id = server_progress.user_id
    GROUP BY users.id
    ORDER BY total_score DESC
    LIMIT 10
    `,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({
          message: "Failed to fetch leaderboard",
          error: err.message
        });
      }

      return res.json(rows);
    }
  );
};

module.exports = {
  saveGameSession,
  getMyStats,
  getLeaderboard
};