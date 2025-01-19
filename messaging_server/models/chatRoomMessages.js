const mongoose = require("mongoose");
const { Schema } = mongoose;
const { db2Connection } = require("../config/mongo");

// Schema for each message
const messageSchema = new Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  // Sender object with sender details and senderId as string
  sender: {
    id: { type: String, required: true },  // senderId is now a string
    name: { type: String, required: true },
    profilePictureUrl: { type: String },
    role: { type: String, required: true }
  },

  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  
  messageType: { 
    type: String, 
    enum: ['text', 'image', 'video', 'audio'], 
    default: 'text' 
  },

  status: { 
    type: String, 
    enum: ['sent', 'delivered', 'read'], 
    default: 'sent' 
  },

  // Array of recipients who have delivered the message
  deliveredTo: [{
    userId: { type: String },  // recipient ID as string
    firstName: { type: String },
    lastName: { type: String },
    profilePictureUrl: { type: String },
    timestamp: { type: Date, default: Date.now }
  }],

  // Array of users who have read the message
  readBy: [{
    userId: { type: String },  // reader ID as string
    firstName: { type: String },
    lastName: { type: String },
    profilePictureUrl: { type: String },
    timestamp: { type: Date, default: Date.now }
  }],

  // Optional: replyTo field, includes both the message ID and the message content
  replyTo: { 
    id: { type: mongoose.Schema.Types.ObjectId, required: false },  // ID of the original message being replied to
    message: { type: String, required: false }  // Content of the original message being replied to
  }
}, { _id: false });  // Disable _id for each message object

// Chatroom Messages Schema
const chatRoomMessagesSchema = new Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  chatroomName: { type: String, required: true },  // Add chatroomName field
  messages: [messageSchema]  // Array of message objects
}, { timestamps: true });

// Create ChatRoomMessages model on db2
const ChatRoomMessages = db2Connection.model('ChatroomMessages', chatRoomMessagesSchema);

module.exports = { ChatRoomMessages };
