const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
    getAdminOverview,
    getAdminUsers,
    getAdminServers,
    getAdminLevels,
    getAdminLogs,
    deleteAdminUser
  } = require("../controllers/adminController");

router.get("/overview", authMiddleware, getAdminOverview);
router.get("/users", authMiddleware, getAdminUsers);
router.get("/servers", authMiddleware, getAdminServers);
router.get("/levels", authMiddleware, getAdminLevels);
router.get("/logs", authMiddleware, getAdminLogs);
router.delete("/users/:id", authMiddleware, deleteAdminUser);

module.exports = router;