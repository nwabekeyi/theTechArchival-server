const mongoose = require('mongoose');
const { Schema } = mongoose;
const { ObjectId } = Schema.Types;
const { db1Connection } = require('../config/mongo');

// Assuming db1Connection is already created
// const db1Connection = mongoose.createConnection('your-db1-uri-here', { useNewUrlParser: true, useUnifiedTopology: true });

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

// Create Chatroom model on db1
const Chatroom = db1Connection.model('Chatroom', chatroomSchema);

// Function to watch changes in chatrooms (watching for added/deleted messages and participants)
const watchChatroomChanges = (io) => {
  const changeStream = Chatroom.watch([
    {
      $match: {
        $or: [
          { 'updateDescription.updatedFields.messages': { $exists: true } },
          { 'updateDescription.updatedFields.participants': { $exists: true } }
        ]
      }
    }
  ]);

  changeStream.on('change', (change) => {
    console.log('Change detected:', change);

    // Check for operation type: update (modified fields)
    if (change.operationType === 'update') {
      const updatedFields = change.updateDescription.updatedFields;

      // Handle new messages being added
      if (updatedFields.messages) {
        const newMessage = updatedFields.messages;
        io.emit('newMessage', newMessage);  // Send only the newly added message
      }

      // Handle added participants
      if (updatedFields.participants) {
        const newParticipants = updatedFields.participants;
        io.emit('newParticipants', newParticipants);  // Send details of newly added participants
      }

      // Handle updated avatarUrl
      if (updatedFields.avatarUrl) {
        const updatedAvatarUrl = updatedFields.avatarUrl;
        io.emit('updatedAvatarUrl', updatedAvatarUrl);  // Send updated avatar URL
      }
    }

    // Handle deleted messages
    if (change.operationType === 'update' && change.updateDescription.removedFields.includes('messages')) {
      const removedMessageId = change.updateDescription.removedFields.find(field => field.includes('messages.'));
      io.emit('deletedMessage', removedMessageId);  // Send ID of deleted message
    }

    // Handle removed participants
    if (change.operationType === 'update' && change.updateDescription.removedFields.includes('participants')) {
      const removedParticipantId = change.updateDescription.removedFields.find(field => field.includes('participants.'));
      io.emit('removedParticipant', removedParticipantId);  // Send ID of removed participant
    }
  });
};

module.exports = { Chatroom, watchChatroomChanges };
