const { ChatRoomMessages } = require('../../models/chatRoomMessages'); // Adjust path if needed

const chatRoomMessagesResolvers = {
  Query: {
    // Retrieve a single message by its ID
    getMessageById: async (_, { id }) => {
      try {
        const message = await ChatRoomMessages.findById(id)
          .populate('messages.deliveredTo')
          .populate('messages.readBy');
        return message;
      } catch (err) {
        throw new Error('Error retrieving message');
      }
    },

    // Get all messages by chatroomName
    getMessagesByChatroom: async (_, { chatroomName }) => {
      try {
        const chatroomMessages = await ChatRoomMessages.findOne({ chatroomName });
        if (!chatroomMessages) {
          throw new Error('Chatroom not found');
        }
        return chatroomMessages; // Return the entire ChatroomMessages object
      } catch (err) {
        throw new Error('Error retrieving messages for chatroom');
      }
    },
  },

  Mutation: {
    // Send a new message to a specific chatroom
    sendMessage: async (
      _, { chatroomName, sender, message, messageType, status, deliveredTo, readBy, replyTo }
    ) => {
      try {
        // Ensure chatroomName is present for chatroom messages only
        if (!chatroomName) {
          throw new Error('chatroomName is required for chatroom messages');
        }
    
        // Check if chatroom messages exist, if not, create a new one
        let chatroomMessages = await ChatRoomMessages.findOne({ chatroomName });
    
        // Extract the replyTo details (if provided)
        const replyToMessage = replyTo && replyTo.id ? {
          id: replyTo.id,  // Original message's ID
          message: replyTo.message  // Original message content
        } : null;
    
        const newMessage = {
          sender: {
            id: sender.id,
            name: sender.name,
            profilePictureUrl: sender.profilePictureUrl,
            role: sender.role,
          },
          message,
          messageType,
          status,
          deliveredTo,
          readBy,
          replyTo: replyToMessage,  // Attach the replyTo object here
          timestamp: new Date().toISOString(),
        };
    
        // If chatroom does not exist, create it
        if (!chatroomMessages) {
          chatroomMessages = new ChatRoomMessages({
            chatroomName,
            messages: [newMessage],
          });
          await chatroomMessages.save();
        } else {
          // If chatroom exists, push the new message to the existing messages array
          chatroomMessages.messages.push(newMessage);
          await chatroomMessages.save();
        }
    
        // Get the newly added message (last one in the messages array)
        const addedMessage = chatroomMessages.messages[chatroomMessages.messages.length - 1];
    
        // If replyTo exists, find the original message in the same array and attach it
        let originalMessage = null;
        if (replyTo && replyTo.id) {
          originalMessage = chatroomMessages.messages.find(msg => msg._id.toString() === replyTo.id);
        }
    
        // Attach the replyTo message details (if found) to the new message
        const populatedMessage = {
          ...addedMessage.toObject(),
          replyTo: originalMessage ? originalMessage.toObject() : null,  // Include full replyTo message details if found
        };
    
        return populatedMessage; // Return the newly added message, including replyTo details
      } catch (err) {
        console.error(err);
        throw new Error('Error sending message');
      }
    },
    

    // Mark a message as read by a user
    markAsRead: async (_, { messageId, userId }) => {
      try {
        const updatedMessage = await ChatRoomMessages.findOneAndUpdate(
          { 'messages._id': messageId },
          {
            $addToSet: {
              'messages.$.readBy': { _id: userId, timestamp: new Date().toISOString() },
            },
            $set: { 'messages.$.status': 'read' },
          },
          { new: true }
        ).populate('messages.deliveredTo messages.readBy');

        return updatedMessage;
      } catch (err) {
        console.error(err);
        throw new Error('Error marking message as read');
      }
    },

    // Mark a message as delivered to a user
    markAsDelivered: async (_, { messageId, userId }) => {
      try {
        const updatedMessage = await ChatRoomMessages.findOneAndUpdate(
          { 'messages._id': messageId },
          {
            $addToSet: {
              'messages.$.deliveredTo': { _id: userId, timestamp: new Date().toISOString() },
            },
            $set: { 'messages.$.status': 'delivered' },
          },
          { new: true }
        ).populate('messages.deliveredTo messages.readBy');

        return updatedMessage;
      } catch (err) {
        console.error(err);
        throw new Error('Error marking message as delivered');
      }
    },
  },
};

module.exports = chatRoomMessagesResolvers;
