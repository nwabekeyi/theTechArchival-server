const mongoose = require('mongoose');
const { Schema } = mongoose;
const { ObjectId } = Schema.Types;
const { db1Connection } = require('../config/mongo');

// Chatroom Schema
const chatroomSchema = new Schema({
  name: { type: String, required: true, unique: true },
  avatarUrl: { type: String, required: false },  // Added avatarUrl field
  participants: [{
    userId: { type: ObjectId, required: true, ref: 'User' },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    role: { type: String, required: true },
    profilePictureUrl: { type: String, required: true },
  }],
}, { timestamps: true });

const watchChatrooms = async () => {
  try {
    const changeStream = Chatroom.watch();

    changeStream.on('change', (change) => {
      switch (change.operationType) {
        case 'insert':
          console.log('New chatroom inserted:', change.fullDocument);
          return true;
        
        case 'update':
          console.log('Chatroom updated:', change.updateDescription.updatedFields);
          return true;

        case 'replace':
          console.log('Chatroom replaced:', change.fullDocument);
          return true;

        case 'delete':
          console.log('Chatroom deleted:', change.documentKey._id);
          return true;

        default:
          return false;
      }
    });
  } catch (err) {
    console.error('Error watching chatrooms:', err);
    return false;
  }
};


// Index on participants.userId
chatroomSchema.index({ 'participants.userId': 1 });  // Index on 'participants.userId'

// Create Chatroom model on db1
const Chatroom = db1Connection.model('Chatroom', chatroomSchema);

module.exports = { Chatroom, watchChatrooms };
