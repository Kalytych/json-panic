const db = require("../db");

function isAdmin(req) {
  return req.user && req.user.role === "admin";
}

const getAdminOverview = (req, res) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ message: "Access denied. Admin only." });
  }

  const result = {};

  db.get(`SELECT COUNT(*) as count FROM users`, [], (err, usersRow) => {
    if (err) return res.status(500).json({ message: "Failed to load users count" });

    result.users = usersRow.count;

    db.get(`SELECT COUNT(*) as count FROM servers`, [], (err2, serversRow) => {
      if (err2) return res.status(500).json({ message: "Failed to load servers count" });

      result.servers = serversRow.count;

      db.get(`SELECT COUNT(*) as count FROM levels`, [], (err3, levelsRow) => {
        if (err3) return res.status(500).json({ message: "Failed to load levels count" });

        result.levels = levelsRow.count;

        db.get(`SELECT COUNT(*) as count FROM game_sessions`, [], (err4, sessionsRow) => {
          if (err4) return res.status(500).json({ message: "Failed to load sessions count" });

          result.sessions = sessionsRow.count;

          db.get(`SELECT COUNT(*) as count FROM logs`, [], (err5, logsRow) => {
            if (err5) return res.status(500).json({ message: "Failed to load logs count" });

            result.logs = logsRow.count;

            return res.json(result);
          });
        });
      });
    });
  });
};

const getAdminUsers = (req, res) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ message: "Access denied. Admin only." });
  }

  db.all(
    `
    SELECT id, username, email, role, created_at
    FROM users
    ORDER BY id ASC
    `,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ message: "Failed to load users" });
      }

      return res.json(rows);
    }
  );
};

const getAdminServers = (req, res) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ message: "Access denied. Admin only." });
  }

  db.all(
    `
    SELECT
      servers.*,
      COUNT(levels.id) as total_levels
    FROM servers
    LEFT JOIN levels ON levels.server_id = servers.id
    GROUP BY servers.id
    ORDER BY servers.order_number ASC
    `,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ message: "Failed to load servers" });
      }

      return res.json(rows);
    }
  );
};

const getAdminLevels = (req, res) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ message: "Access denied. Admin only." });
  }

  db.all(
    `
    SELECT
      levels.id,
      levels.title,
      levels.file_name,
      levels.difficulty,
      levels.mode,
      levels.order_number,
      levels.max_score,
      levels.time_limit,
      servers.title as server_title
    FROM levels
    JOIN servers ON servers.id = levels.server_id
    ORDER BY servers.order_number ASC, levels.order_number ASC
    `,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ message: "Failed to load levels" });
      }

      return res.json(rows);
    }
  );
};

const getAdminLogs = (req, res) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ message: "Access denied. Admin only." });
  }

  db.all(
    `
    SELECT
      logs.id,
      logs.action,
      logs.details,
      logs.created_at,
      users.username
    FROM logs
    LEFT JOIN users ON users.id = logs.user_id
    ORDER BY logs.created_at DESC
    LIMIT 100
    `,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ message: "Failed to load logs" });
      }

      return res.json(rows);
    }
  );
};

const deleteAdminUser = (req, res) => {
    if (!isAdmin(req)) {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }
  
    const { id } = req.params;
    const currentAdminId = req.user.id;
  
    if (Number(id) === Number(currentAdminId)) {
      return res.status(400).json({
        message: "Admin cannot delete own account"
      });
    }
  
    db.run(`DELETE FROM user_achievements WHERE user_id = ?`, [id]);
    db.run(`DELETE FROM server_progress WHERE user_id = ?`, [id]);
    db.run(`DELETE FROM game_sessions WHERE user_id = ?`, [id]);
    db.run(`DELETE FROM logs WHERE user_id = ?`, [id]);
  
    db.run(`DELETE FROM users WHERE id = ?`, [id], function (err) {
      if (err) {
        return res.status(500).json({
          message: "Failed to delete user"
        });
      }
  
      if (this.changes === 0) {
        return res.status(404).json({
          message: "User not found"
        });
      }
  
      return res.json({
        message: "User deleted successfully"
      });
    });
  };

  module.exports = {
    getAdminOverview,
    getAdminUsers,
    getAdminServers,
    getAdminLevels,
    getAdminLogs,
    deleteAdminUser
  };