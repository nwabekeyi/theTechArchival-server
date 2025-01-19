const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

// ChatroomMessage Schema
const chatroomMessageSchema = new Schema({
    OfflineDeliveredTo: {
        chatroomName: { type: String, required: true }, // Chatroom name
        messageDetail: {
            senderId: { type: String, required: true }, // ID of the sender
            messageId: { type: ObjectId, required: true }, // Unique ID for each message
            deliveredTo: [{ type: String }] // Array of user IDs representing recipients    
        }
    }
}, { timestamps: true }); // Adding timestamps for createdAt and updatedAt
const OfflineDeliveredTo= mongoose.model("ChatroomMessage", chatroomMessageSchema);
module.exports = OfflineDeliveredTo;
