const express = require('express');
const router = express.Router();
const {
  createChatroom,
  getChatrooms,
  getChatroomByName,
  updateChatroom,
  deleteChatroom,
  addMessage,
  addParticipant,
  removeParticipant,
  removeMessage,
} = require('../controllers/chatRoom');

// Create a new chatroom
router.post('/api/v1/chatrooms', createChatroom);

// Get all chatrooms
router.get('/api/v1/chatrooms', getChatrooms);

// Get a specific chatroom by name
router.get('/api/v1/chatrooms/:name', getChatroomByName);

// Update an existing chatroom
router.put('/api/v1/chatrooms/:name', updateChatroom);

// Delete a chatroom
router.delete('/api/v1/chatrooms/:name', deleteChatroom);


// Add a message to a chatroom
router.post('/api/v1/chatrooms/messages/:name', addMessage);

// Add a participant to a chatroom
router.post('/api/v1chatrooms//participants/:name', addParticipant);

// Remove a participant from a chatroom
router.delete('/api/v1/chatrooms/participants/:name', removeParticipant);

// Remove a message from a chatroom
router.delete('/api/v1/chatrooms/messages/:messageId/:name', removeMessage);

module.exports = router;
