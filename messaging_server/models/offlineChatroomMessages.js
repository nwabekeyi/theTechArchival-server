const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

// ChatroomMessage Schema with deliveredTo and timestamp
const deliveredToSchema = new Schema({
  chatroomName: { type: String, required: true, index: true }, // Chatroom name, indexed
  OfflineDeliveredTo: {
    messageDetail: {
      senderId: { type: String, required: true, index: true }, // ID of the sender, indexed
      messageId: { type: ObjectId, required: true, index: true }, // Unique ID for each message, indexed
      deliveredTo: [
        {
          userId: { type: String, required: true, index: true }, // User ID of the recipient, indexed
          firstName: { type: String, required: true },
          lastName: { type: String, required: true },
          profilePictureUrl: { type: String, required: true },
          timestamp: { type: Date, default: Date.now } // Timestamp of delivery
        }
      ]
    }
  }
}, { timestamps: true }); // Adding timestamps for createdAt and updatedAt

// ChatroomMessage Schema with readBy and timestamp
const readBySchema = new Schema({
  chatroomName: { type: String, required: true, index: true }, // Chatroom name, indexed
  messageDetail: {
    senderId: { type: String, required: true, index: true }, // ID of the sender, indexed
    messageId: { type: ObjectId, required: true, index: true }, // Unique ID for each message, indexed
    readBy: [
      {
        userId: { type: String, required: true, index: true }, // User ID of the recipient, indexed
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        profilePictureUrl: { type: String, required: true },
        timestamp: { type: Date, default: Date.now } // Timestamp of delivery
      }
    ]
  }
}, { timestamps: true }); // Adding timestamps for createdAt and updatedAt

// Create models for the schemas
const OfflineReadByTo = mongoose.model("ChatroomMessageReadBy", readBySchema);
const OfflineDeliveredTo = mongoose.model("ChatroomMessageDeliveredTo", deliveredToSchema);

module.exports = { OfflineDeliveredTo, OfflineReadByTo };
