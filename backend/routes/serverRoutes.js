const express = require("express");
const router = express.Router();

const {
  getAllServers,
  getServerById,
  getLevelsByServer
} = require("../controllers/serverController");

router.get("/", getAllServers);
router.get("/:id", getServerById);
router.get("/:id/levels", getLevelsByServer);

module.exports = router;