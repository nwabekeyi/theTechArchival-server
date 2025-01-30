const { getChatroomFromCache } = require('./redisCaches');  // Make sure the path is correct
const { ChatRoomMessages } = require('../models/chatRoomMessages');  // Import the Chatroom model
const { redisClient } = require('./redisClient');

// Fetch `readBy` array for a specific message
const fetchReadByForMessage = async (chatroomName, senderId, messageId) => {
  try {
    const readByKey = `chatroom:${chatroomName}:sender:${senderId}:message:${messageId}:readBy`;

    if(readByKey){
    const readByList = await redisClient.lRange(readByKey, 0, -1);  // Use `lRange`
    const readByArray = readByList.map((entry) => JSON.parse(entry));
    return { messageId, readBy: readByArray };

    }else{
      return
    };
  } catch (error) {
    console.error(`Error fetching readBy for messageId "${messageId}" in chatroom "${chatroomName}":`, error);
    throw error;
  }
};

// Fetch `deliveredTo` array for a specific message
const fetchDeliveredToForMessage = async (chatroomName, senderId, messageId) => {
  try {
    const deliveredToKey = `chatroom:${chatroomName}:sender:${senderId}:message:${messageId}:deliveredTo`;

    if(deliveredToKey){
      const deliveredToList = await redisClient.lRange(deliveredToKey, 0, -1);  // Use `lRange`
      const deliveredToArray = deliveredToList.map((entry) => JSON.parse(entry));
      return { messageId, deliveredTo: deliveredToArray };
    }else{
      return
    }
   
  } catch (error) {
    console.error(`Error fetching deliveredTo for messageId "${messageId}" in chatroom "${chatroomName}":`, error);
    throw error;
  }
};

// Function to check and update the readBy status
const checkAndUpdateReadStatus = async (chatroomName, messageId, readByArray) => {
  console.log(chatroomName)
  try {
    const chatroom = await getChatroomFromCache(chatroomName);
    const participantsCount = chatroom.participants.length;
    const isAllRead = readByArray.length === participantsCount;

    if (isAllRead) {
      await moveReadByToMongo(chatroomName, messageId, readByArray);
      await deleteReadByFromRedis(chatroomName, messageId);
      return true;
    }
  } catch (error) {
    console.error(`Error checking or updating read status for message "${messageId}" in chatroom "${chatroomName}":`, error);
    throw error;
  }
};

// Function to check and update the deliveredTo status
const checkAndUpdateDeliveredStatus = async (chatroomName, messageId, deliveredToArray) => {
  try {
    const chatroom = await getChatroomFromCache(chatroomName);
    const participantsCount = chatroom.participants.length;
    const isAllDelivered = deliveredToArray.length === participantsCount;

    if (isAllDelivered) {
      await moveDeliveredToToMongo(chatroomName, messageId, deliveredToArray);
      await deleteDeliveredToFromRedis(chatroomName, messageId);
      return true;
    }
  } catch (error) {
    console.error(`Error checking or updating delivered status for message "${messageId}" in chatroom "${chatroomName}":`, error);
    throw error;
  }
};

// Move `readBy` array to MongoDB
const moveReadByToMongo = async (chatroomName, messageId, readByArray) => {
  try {
    await ChatRoomMessages.updateOne(
      { chatroomName, "messages._id": messageId },
      { $set: { "messages.$.readBy": readByArray } }
    );
    console.log(`Moved readBy array for message "${messageId}" to MongoDB.`);
  } catch (error) {
    console.error(`Error moving readBy array to MongoDB for message "${messageId}":`, error);
    throw error;
  }
};

// Move `deliveredTo` array to MongoDB
const moveDeliveredToToMongo = async (chatroomName, messageId, deliveredToArray) => {
  try {
    await ChatRoomMessages.updateOne(
      { chatroomName, "messages._id": messageId },
      { $set: { "messages.$.deliveredTo": deliveredToArray } }
    );
    console.log(`Moved deliveredTo array for message "${messageId}" to MongoDB.`);
  } catch (error) {
    console.error(`Error moving deliveredTo array to MongoDB for message "${messageId}":`, error);
    throw error;
  }
};

// Delete `readBy` array from Redis
const deleteReadByFromRedis = async (chatroomName, messageId) => {
  try {
    const readByKey = `chatroom:${chatroomName}:message:${messageId}:readBy`;
    await redisClient.del(readByKey);
    console.log(`Deleted readBy array from Redis for message "${messageId}".`);
  } catch (error) {
    console.error(`Error deleting readBy array from Redis for message "${messageId}":`, error);
    throw error;
  }
};

// Delete `deliveredTo` array from Redis
const deleteDeliveredToFromRedis = async (chatroomName, messageId) => {
  try {
    const deliveredToKey = `chatroom:${chatroomName}:message:${messageId}:deliveredTo`;
    await redisClient.del(deliveredToKey);
    console.log(`Deleted deliveredTo array from Redis for message "${messageId}".`);
  } catch (error) {
    console.error(`Error deleting deliveredTo array from Redis for message "${messageId}":`, error);
    throw error;
  }
};

module.exports = {
  checkAndUpdateDeliveredStatus,
  checkAndUpdateReadStatus,
  fetchDeliveredToForMessage,
  fetchReadByForMessage,
};
