const db = require("../db");

const getAllLevels = (req, res) => {
  db.all(`SELECT * FROM levels ORDER BY id ASC`, [], (err, rows) => {
    if (err) {
      return res.status(500).json({
        message: "Failed to fetch levels"
      });
    }

    return res.json(rows);
  });
};

const getLevelById = (req, res) => {
  const { id } = req.params;

  db.get(`SELECT * FROM levels WHERE id = ?`, [id], (err, row) => {
    if (err) {
      return res.status(500).json({
        message: "Failed to fetch level"
      });
    }

    if (!row) {
      return res.status(404).json({
        message: "Level not found"
      });
    }

    return res.json(row);
  });
};

module.exports = {
  getAllLevels,
  getLevelById
};