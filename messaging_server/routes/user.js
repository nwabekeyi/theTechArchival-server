const express = require("express");
const { getAllUsers, getUser } = require("../controllers/user");

const router = express.Router();

router.get("/", getAllUsers);
router.get("/:userId", getUser);

module.exports = router;
