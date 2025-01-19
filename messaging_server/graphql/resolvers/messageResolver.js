const messageResolver = {
  Query: {
    getPersonalMessages: async (_, { userId, senderId }) => {
      try {
        // Fetch the document for the logged-in user (userId)
        const userPersonalMessage = await PersonalMessage.findOne({ userId });

        // Fetch the document for the sender (senderId)
        const senderPersonalMessage = await PersonalMessage.findOne({ userId: senderId });

        if (!userPersonalMessage || !senderPersonalMessage) {
          throw new Error("Messages not found for either user or sender.");
        }

        // Get the sender's details
        const senderDetails = senderPersonalMessage.senders.find(sender => sender.sender.userId === senderId)?.sender;

        if (!senderDetails) {
          throw new Error("Sender details not found");
        }

        // Get the messages sent to the logged-in user by the sender
        const senderMessages = senderPersonalMessage.senders
          .find(sender => sender.sender.userId === userId)?.messages || [];

        // Get the messages sent by the logged-in user to the sender
        const userMessages = userPersonalMessage.senders
          .find(sender => sender.sender.userId === senderId)?.messages || [];

        // Combine the messages from both the sender and the user
        const allMessages = [...senderMessages, ...userMessages];

        // Sort the combined messages by timestamp in ascending order
        allMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        // Return the sender's details along with the combined messages
        return {
          senderId: senderDetails.userId,
          lastName: senderDetails.lastName,
          profilePictureUrl: senderDetails.profilePictureUrl,
          messages: allMessages,
        };
      } catch (error) {
        throw new Error(error.message);
      }
    },
  },
  Mutation: {
    initiateSenderDetails: async (_, { userId, firstName, lastName, profilePictureUrl }) => {
      try {
        let personalMessage = await PersonalMessage.findOne({ userId });

        // If personal messages document doesn't exist, create a new one
        if (!personalMessage) {
          personalMessage = new PersonalMessage({ userId, senders: [] });
        }

        // Add the sender to the senders array if not already added
        if (!personalMessage.senders.some(sender => sender.sender.userId === userId)) {
          personalMessage.senders.push({
            sender: {
              userId,
              firstName,
              lastName,
              profilePictureUrl,
            },
            messages: [],
          });

          // Save the updated document
          await personalMessage.save();
        }

        return personalMessage;
      } catch (error) {
        throw new Error(error.message);
      }
    },
    sendMessageToSender: async (_, { userId, senderId, message, messageType = "text", status = "sent", replyingTo }) => {
      try {
        const personalMessage = await PersonalMessage.findOne({ userId });

        if (!personalMessage || !personalMessage.senders.some(sender => sender.sender.userId === senderId)) {
          throw new Error("Sender not found");
        }

        const newMessage = {
          message,
          timestamp: new Date().toISOString(),
          messageType,
          status,
        };

        // If replyingTo is provided, include it in the new message
        if (replyingTo) {
          newMessage.replyingTo = {
            _id: replyingTo._id, // Ensure it's passed correctly from the input
            message: replyingTo.message,
          };
        }

        // Find the sender and push the new message to the sender's messages array
        const sender = personalMessage.senders.find(sender => sender.sender.userId === senderId);
        sender.messages.push(newMessage);

        // Save the updated document
        await personalMessage.save();

        return personalMessage;
      } catch (error) {
        throw new Error(error.message);
      }
    },
  },
};

module.exports = messageResolver;
