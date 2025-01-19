const {ChatRoomMessages} = require('../models/chatRoomMessages'); // Importing the Chatroom model


/**
 * Adds a userId to the deliveredTo array for a specific message in the chatroom
 * and returns the updated deliveredTo array.
 * 
 * @param {string} chatroomName - The name of the chatroom.
 * @param {string} userId - The ID of the user.
 * @param {string} messageId - The ID of the message to update.
 * @returns {Array} - The updated deliveredTo array.
 */
async function addToDeliveredTo(chatroomName, recipientDetails, messageId) {
  try {
    console.log(recipientDetails);

    const recipientWithTimestamp = {
      ...recipientDetails,
      timestamp: Date.now(),
    };

    // Perform the update using $addToSet to avoid duplicate entries
    const result = await ChatRoomMessages.updateOne(
      { chatroomName, "messages._id": messageId },
      {
        $addToSet: { "messages.$.deliveredTo": recipientWithTimestamp },
      }
    );

    if (result.nModified === 0) {
      throw new Error(`Message with ID "${messageId}" not found or user already exists in deliveredTo.`);
    }

    return recipientWithTimestamp; // Return the updated recipient object with timestamp

  } catch (error) {
    console.error(`Error adding user to deliveredTo: ${error.message}`);
    throw error;
  }
}



/**
 * Adds a userId to the readBy array for a specific message in the chatroom
 * and returns the updated readBy array.
 * 
 * @param {string} chatroomName - The name of the chatroom.
 * @param {string} userId - The ID of the user.
 * @param {string} messageId - The ID of the message to update.
 * @returns {Array} - The updated readBy array.
 */
async function addToReadBy(chatroomName, userId, messageId) {
  try {
    // Find the chatroom by name
    const chatroom = await ChatRoomMessages.findOne({ chatroomName });

    if (!chatroom) {
      throw new Error(`Chatroom "${chatroomName}" not found.`);
    }

    // Find the specific message by messageId in the messages array
    const message = chatroom.messages.id(messageId);

    if (!message) {
      throw new Error(`Message with ID "${messageId}" not found in chatroom "${chatroomName}".`);
    }

    // Add userId to readBy array if it's not already present
    if (!message.readBy.includes(userId)) {
      message.readBy.push(userId);
      await chatroom.save(); // Save the updated chatroom document
    }

    // Return the updated readBy array
    return userId;
  } catch (error) {
    console.error(`Error adding user to readBy: ${error.message}`);
    throw error;
  }
}

/**
 * Retrieves the deliveredTo field for a specific message in the chatroom
 * 
 * @param {string} chatroomName - The name of the chatroom.
 * @param {string} messageId - The ID of the message.
 * @returns {Array} - The deliveredTo array of the message.
 */
async function getDeliveredTo(chatroomName, messageId) {
  try {
    // Find the chatroom by name
    const chatroom = await ChatRoomMessages.findOne({ chatroomName });
    
    if (!chatroom) {
      throw new Error(`Chatroom "${chatroomName}" not found.`);
    }

    // Find the specific message by messageId in the messages array
    const message = chatroom.messages.id(messageId);

    if (!message) {
      throw new Error(`Message with ID "${messageId}" not found in chatroom "${chatroomName}".`);
    }

    // Return the deliveredTo array
    return message.deliveredTo;
  } catch (error) {
    console.error(`Error retrieving deliveredTo field: ${error.message}`);
    throw error;
  }
}

/**
 * Retrieves the readBy field for a specific message in the chatroom
 * 
 * @param {string} chatroomName - The name of the chatroom.
 * @param {string} messageId - The ID of the message.
 * @returns {Array} - The readBy array of the message.
 */
async function getReadBy(chatroomName, messageId) {
  try {
    // Find the chatroom by name
    const chatroom = await ChatRoomMessages.findOne({ chatroomName });
    
    if (!chatroom) {
      throw new Error(`Chatroom "${chatroomName}" not found.`);
    }

    // Find the specific message by messageId in the messages array
    const message = chatroom.messages.id(messageId);

    if (!message) {
      throw new Error(`Message with ID "${messageId}" not found in chatroom "${chatroomName}".`);
    }

    // Return the readBy array
    return message.readBy;
  } catch (error) {
    console.error(`Error retrieving readBy field: ${error.message}`);
    throw error;
  }
};


/**
 * Finds undelivered messages for a specific user in multiple chatrooms.
 *
 * @param {Array} chatroomNames - An array of chatroom names.
 * @param {string} userId - The ID of the user whose undelivered messages need to be found.
 * @returns {Array} - An array of objects containing chatroomName and message details for undelivered messages.
 */
async function findUndeliveredMessages(chatroomNames, recipientDetails) {
  try {
    const undeliveredMessages = [];

    // Loop through each chatroom name in the array
    for (const chatroomName of chatroomNames) {
      // Find the chatroom by name
      const chatroom = await ChatRoomMessages.findOne({ chatroomName });

      if (!chatroom) {
        console.log(`Chatroom "${chatroomName}" not found.`);
        continue;
      }

      // Loop through each message in the chatroom's messages array
      for (const message of chatroom.messages) {
        // Check if the userId is present in the deliveredTo array for the current message
        const isDelivered = message.deliveredTo.some(
          (recipient) => recipient.userId === recipientDetails.userId
        );
        if (!isDelivered) {
          // If the userId is not found, push the message details to undeliveredMessages
          undeliveredMessages.push({
            chatroomName,
            message,
          });
        }
      }
    }

    // Return the undeliveredMessages array
    return undeliveredMessages;

  } catch (error) {
    console.error(`Error finding undelivered messages: ${error.message}`);
    throw error;
  }
};

module.exports = {
  findUndeliveredMessages,
  addToDeliveredTo,
  addToReadBy,
  getDeliveredTo,
  getReadBy,
  findUndeliveredMessages
};


