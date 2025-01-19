const express = require("express");
const { createMessage, getMessages } = require("../controllers/chatMessage");

const router = express.Router();

router.post("/", createMessage);
router.get("/:chatRoomId", getMessages);

module.exports = router;
