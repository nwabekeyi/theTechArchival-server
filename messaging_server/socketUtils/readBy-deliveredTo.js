const { ChatRoomMessages } = require('../models/chatRoomMessages');
const { OfflineDeliveredTo, OfflineReadByTo } = require('../models/offlineChatroomMessages');

/**
 * Adds a userId to the deliveredTo array for a specific message in the chatroom.
 * 
 * @param {string} chatroomName - The name of the chatroom.
 * @param {Object} recipientDetails - Details of the recipient, including userId.
 * @param {string} messageId - The ID of the message to update.
 * @returns {Object} - The updated recipient object with timestamp.
 */
async function addToDeliveredTo(chatroomName, recipientDetails, messageId) {
  try {
    const recipientWithTimestamp = {
      ...recipientDetails,
      timestamp: Date.now(),
    };

    const result = await ChatRoomMessages.updateOne(
      { chatroomName, "messages._id": messageId },
      { $addToSet: { "messages.$.deliveredTo": recipientWithTimestamp } }
    );

    if (result.nModified === 0) {
      throw new Error(`Message with ID "${messageId}" not found or recipient already exists in deliveredTo.`);
    }

    return recipientWithTimestamp;
  } catch (error) {
    console.error(`Error adding to deliveredTo: ${error.message}`);
    throw error;
  }
}

/**
 * Adds a userId to the readBy array for a specific message in the chatroom.
 * 
 * @param {string} chatroomName - The name of the chatroom.
 * @param {Object} recipientDetails - Details of the recipient, including userId.
 * @param {string} messageId - The ID of the message to update.
 * @returns {Object} - The updated recipient object with timestamp.
 */
async function addToReadBy(chatroomName, recipientDetails, messageId) {
  try {
    const recipientWithTimestamp = {
      ...recipientDetails,
      timestamp: Date.now(),
    };

    const result = await ChatRoomMessages.updateOne(
      { chatroomName, "messages._id": messageId },
      { $addToSet: { "messages.$.readBy": recipientWithTimestamp } }
    );

    if (result.nModified === 0) {
      throw new Error(`Message with ID "${messageId}" not found or recipient already exists in readBy.`);
    }

    return recipientWithTimestamp;
  } catch (error) {
    console.error(`Error adding to readBy: ${error.message}`);
    throw error;
  }
}

/**
 * Retrieves the deliveredTo field for a specific message in the chatroom.
 * 
 * @param {string} chatroomName - The name of the chatroom.
 * @param {string} messageId - The ID of the message.
 * @returns {Array} - The deliveredTo array of the message.
 */
async function getDeliveredTo(chatroomName, messageId) {
  try {
    const chatroom = await ChatRoomMessages.findOne({ chatroomName });
    if (!chatroom) {
      throw new Error(`Chatroom "${chatroomName}" not found.`);
    }

    const message = chatroom.messages.id(messageId);
    if (!message) {
      throw new Error(`Message with ID "${messageId}" not found.`);
    }

    return message.deliveredTo;
  } catch (error) {
    console.error(`Error retrieving deliveredTo: ${error.message}`);
    throw error;
  }
}

/**
 * Retrieves the readBy field for a specific message in the chatroom.
 * 
 * @param {string} chatroomName - The name of the chatroom.
 * @param {string} messageId - The ID of the message.
 * @returns {Array} - The readBy array of the message.
 */
async function getReadBy(chatroomName, messageId) {
  try {
    const chatroom = await ChatRoomMessages.findOne({ chatroomName });
    if (!chatroom) {
      throw new Error(`Chatroom "${chatroomName}" not found.`);
    }

    const message = chatroom.messages.id(messageId);
    if (!message) {
      throw new Error(`Message with ID "${messageId}" not found.`);
    }

    return message.readBy;
  } catch (error) {
    console.error(`Error retrieving readBy: ${error.message}`);
    throw error;
  }
}

/**
 * Finds undelivered messages for a specific user in multiple chatrooms.
 * 
 * @param {Array} chatroomNames - Array of chatroom names.
 * @param {Object} recipientDetails - Details of the recipient, including userId.
 * @returns {Array} - Array of undelivered messages.
 */
async function findUndeliveredMessages(chatroomNames, recipientDetails) {
  try {
    const undeliveredMessages = [];

    for (const chatroomName of chatroomNames) {
      const chatroom = await ChatRoomMessages.findOne({ chatroomName });
      if (!chatroom) {
        console.log(`Chatroom "${chatroomName}" not found.`);
        continue;
      }

      for (const message of chatroom.messages) {
        const isDelivered = message.deliveredTo.some(
          (recipient) => recipient.userId === recipientDetails.userId
        );
        if (!isDelivered) {
          undeliveredMessages.push({ chatroomName, message });
        }
      }
    }

    return undeliveredMessages;
  } catch (error) {
    console.error(`Error finding undelivered messages: ${error.message}`);
    throw error;
  }
}

/**
 * Updates the deliveredTo field for an offline message.
 * 
 * @param {Object} details - Object containing chatroomName, senderId, messageId, and deliveredTo.
 */
async function updateDeliveredTo(chatroomName, senderId, messageId, deliveredTo) {
  try {
    let deliveredDoc = await OfflineDeliveredTo.findOne({ chatroomName });
    if (!deliveredDoc) {
      deliveredDoc = new OfflineDeliveredTo({
        chatroomName,
        messageDetail: {
          senderId,
          messageId,
          deliveredTo: [],
        },
      });
    }

    const messageDetail = deliveredDoc.messageDetail;
    if (messageDetail.senderId === senderId && messageDetail.messageId === messageId) {
      messageDetail.deliveredTo.push(deliveredTo);
    }

    await deliveredDoc.save();
    console.log('DeliveredTo updated successfully');
  } catch (error) {
    console.error(`Error updating deliveredTo: ${error.message}`);
  }
}

/**
 * Updates the readBy field for an offline message.
 * 
 * @param {Object} details - Object containing chatroomName, senderId, messageId, and readBy.
 */
async function updateReadBy(chatroomName, senderId, messageId, readBy) {
  try {
    let readByDoc = await OfflineReadByTo.findOne({ chatroomName });
    if (!readByDoc) {
      readByDoc = new OfflineReadByTo({
        chatroomName,
        messageDetail: {
          senderId,
          messageId,
          readBy: [],
        },
      });
    }

    const messageDetail = readByDoc.messageDetail;
    if (messageDetail.senderId === senderId && messageDetail.messageId === messageId) {
      messageDetail.readBy.push(readBy);
    }

    await readByDoc.save();
    console.log('ReadBy updated successfully');
  } catch (error) {
    console.error(`Error updating readBy: ${error.message}`);
  }
}

module.exports = {
  findUndeliveredMessages,
  addToDeliveredTo,
  addToReadBy,
  getDeliveredTo,
  getReadBy,
  updateDeliveredTo,
  updateReadBy,
};
