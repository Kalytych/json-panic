const express = require("express");
const router = express.Router();
const { getAllLevels, getLevelById } = require("../controllers/levelController");

router.get("/", getAllLevels);
router.get("/:id", getLevelById);

module.exports = router;