// resolvers/chatroomResolver.js

const { Chatroom } = require('../../models/ChatRoom');

const chatroomResolver = {
  Query: {
    getChatroom: async (_, { name }) => {
      try {
        const chatroom = await Chatroom.findOne({ name });
        if (!chatroom) {
          throw new Error('Chatroom not found');
        }
        return chatroom;
      } catch (err) {
        throw new Error('Error fetching chatroom');
      }
    },
    getChatrooms: async () => {
      return await Chatroom.find();
    }
  },

  Mutation: {
    createChatroom: async (_, { nam , avatarUrl, participants }) => {
      try {
        const newChatroom = new Chatroom({
          name,
          avatarUrl,
          participants,
        });
        return await newChatroom.save();
      } catch (err) {
        throw new Error('Error creating chatroom');
      }
    },

    updateAvatar: async (_, { chatroomName, avatarUrl }) => {
      try {
        const chatroom = await Chatroom.findOneAndUpdate(
          { name: chatroomName },
          { avatarUrl },
          { new: true }
        );
        if (!chatroom) {
          throw new Error('Chatroom not found');
        }
        return chatroom;
      } catch (err) {
        throw new Error('Error updating avatar');
      }
    },

    addParticipant: async (_, { chatroomName, userId, firstName, lastName, profilePictureUrl }) => {
      try {
        const chatroom = await Chatroom.findOne({ name: chatroomName });
        if (!chatroom) {
          throw new Error('Chatroom not found');
        }

        const newParticipant = {
          userId,
          firstName,
          lastName,
          profilePictureUrl,
        };
        chatroom.participants.push(newParticipant);
        await chatroom.save();
        return chatroom;
      } catch (err) {
        throw new Error('Error adding participant');
      }
    }
  }
};

module.exports = chatroomResolver;
