const db = require("../db");

const getAllServers = (req, res) => {
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
        return res.status(500).json({ message: "Failed to fetch servers" });
      }

      return res.json(rows);
    }
  );
};

const getServerById = (req, res) => {
  const { id } = req.params;

  db.get(
    `
    SELECT
      servers.*,
      COUNT(levels.id) as total_levels
    FROM servers
    LEFT JOIN levels ON levels.server_id = servers.id
    WHERE servers.id = ?
    GROUP BY servers.id
    `,
    [id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ message: "Failed to fetch server" });
      }

      if (!row) {
        return res.status(404).json({ message: "Server not found" });
      }

      return res.json(row);
    }
  );
};

const getLevelsByServer = (req, res) => {
  const { id } = req.params;

  db.all(
    `
    SELECT *
    FROM levels
    WHERE server_id = ?
    ORDER BY order_number ASC
    `,
    [id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ message: "Failed to fetch server levels" });
      }

      return res.json(rows);
    }
  );
};

module.exports = {
  getAllServers,
  getServerById,
  getLevelsByServer
};