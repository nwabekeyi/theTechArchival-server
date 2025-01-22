const { Chatroom } = require('../models/ChatRoom');  // Import the Chatroom model
const { redisClient } = require('./redisClient');

// Promisify Redis functions if needed
const getAsync = redisClient.get.bind(redisClient);
const setexAsync = redisClient.setEx.bind(redisClient);
const keysAsync = redisClient.keys.bind(redisClient);

// Fetch chatrooms and cache each chatroom individually in Redis
const fetchChatroomsAndCache = async () => {
  try {
    const chatroomKeys = await getChatroomKeysFromCache();
    if (chatroomKeys && chatroomKeys.length > 0) {
      console.log('Cache hit: Chatrooms fetched from Redis');
      return await getMultipleChatroomsFromCache(chatroomKeys);
    }

    const chatrooms = await fetchChatroomsFromMongoDB();
    await cacheMultipleChatrooms(chatrooms);
    console.log('Cache miss: Chatrooms fetched from MongoDB');
    return chatrooms;
  } catch (error) {
    console.error('Error fetching chatrooms:', error);
    throw error;
  }
};

// Fetch all chatrooms from MongoDB
const fetchChatroomsFromMongoDB = async () => {
  try {
    return await Chatroom.find().exec();
  } catch (error) {
    console.error('Error fetching from MongoDB:', error);
    throw error;
  }
};

// Get all chatroom keys from Redis
const getChatroomKeysFromCache = async () => {
  try {
    return await keysAsync('chatroom:*');  // Fetch keys with the pattern 'chatroom:*'
  } catch (err) {
    console.error('Error fetching chatroom keys from Redis:', err);
    throw err;
  }
};

// Get multiple chatrooms from Redis based on chatroom keys
const getMultipleChatroomsFromCache = async (keys) => {
  try {
    const chatrooms = await Promise.all(keys.map(key => getAsync(key)));
    return chatrooms.map(chatroom => JSON.parse(chatroom));
  } catch (err) {
    console.error('Error fetching multiple chatrooms from Redis:', err);
    throw err;
  }
};

// Cache multiple chatrooms individually in Redis
const cacheMultipleChatrooms = async (chatrooms) => {
  try {
    await Promise.all(chatrooms.map(chatroom => {
      const chatroomName = chatroom.name; // Assuming `name` is the identifier for the chatroom
      return setexAsync(`chatroom:${chatroomName}`, 3600, JSON.stringify(chatroom));
    }));
  } catch (err) {
    console.error('Error caching chatrooms in Redis:', err);
    throw err;
  }
};

// Get a specific chatroom by name from Redis or MongoDB
const getChatroomFromCache = async (chatroomName) => {
  try {
    const cachedChatroom = await getAsync(`chatroom:${chatroomName}`);
    if (cachedChatroom) {
      console.log(`Cache hit: Chatroom "${chatroomName}" fetched from Redis`);
      return JSON.parse(cachedChatroom);
    }

    const chatroom = await fetchChatroomFromMongoDB(chatroomName);
    await setChatroomInCache(chatroomName, chatroom);
    console.log(`Cache miss: Chatroom "${chatroomName}" fetched from MongoDB`);
    return chatroom;
  } catch (error) {
    console.error(`Error fetching chatroom "${chatroomName}":`, error);
    throw error;
  }
};

// Fetch a specific chatroom from MongoDB by name
const fetchChatroomFromMongoDB = async (chatroomName) => {
  try {
    return await Chatroom.findOne({ name: chatroomName }).exec();
  } catch (error) {
    console.error('Error fetching chatroom from MongoDB:', error);
    throw error;
  }
};

// Cache a specific chatroom in Redis
const setChatroomInCache = async (chatroomName, chatroom) => {
  try {
    await setexAsync(`chatroom:${chatroomName}`, 3600, JSON.stringify(chatroom));
  } catch (err) {
    console.error(`Error setting chatroom "${chatroomName}" in Redis:`, err);
    throw err;
  }
};

// Fetch `readBy` and `deliveredTo` arrays for a specific message
const fetchChatroomMessageDetails = async (chatroomName, senderId, messageId) => {
  try {
    const readByKey = `chatroom:${chatroomName}:sender:${senderId}:message:${messageId}:readBy`;
    const deliveredToKey = `chatroom:${chatroomName}:sender:${senderId}:message:${messageId}:deliveredTo`;

    const readByList = await redisClient.lrange(readByKey, 0, -1);
    const deliveredToList = await redisClient.lrange(deliveredToKey, 0, -1);

    return { readByList, deliveredToList };
  } catch (error) {
    console.error(`Error fetching message details for chatroom "${chatroomName}" and messageId "${messageId}":`, error);
    throw error;
  }
};

// Update the `readBy` list for a specific message
const updateReadByList = async (chatroomName, senderId, messageId, userDetails) => {
  try {
    const readByKey = `chatroom:${chatroomName}:sender:${senderId}:message:${messageId}:readBy`;

    // Check if the user already exists in the `readBy` list
    const existingReadByList = await redisClient.lRange(readByKey, 0, -1); // Get all items in the list
    const isUserAlreadyInReadByList = existingReadByList.some((entry) => {
      const parsedEntry = JSON.parse(entry);
      return parsedEntry.userId === userDetails.userId;  // Check by userId
    });

    if (!isUserAlreadyInReadByList) {
      const userData = JSON.stringify({
        userId: userDetails.userId,
        firstName: userDetails.firstName,
        lastName: userDetails.lastName,
        profilePictureUrl: userDetails.profilePictureUrl,
        timestamp: new Date(),
      });
      await redisClient.rPush(readByKey, userData);
      console.log(`User ${userDetails.userId} added to readBy list for chatroom "${chatroomName}", sender "${senderId}", and message "${messageId}"`);
    } else {
      console.log(`User ${userDetails.userId} is already in the readBy list for chatroom "${chatroomName}", sender "${senderId}", and message "${messageId}"`);
    }
  } catch (error) {
    console.error(`Error updating readBy list for chatroom "${chatroomName}", sender "${senderId}", and message "${messageId}":`, error);
    throw error;
  }
};

// Update the `deliveredTo` list for a specific message
const updateDeliveredToList = async (chatroomName, senderId, messageId, userDetails) => {
  try {
    const deliveredToKey = `chatroom:${chatroomName}:sender:${senderId}:message:${messageId}:deliveredTo`;

    // Check if the user already exists in the `deliveredTo` list
    const existingDeliveredToList = await redisClient.lRange(deliveredToKey, 0, -1); // Get all items in the list
    const isUserAlreadyInDeliveredToList = existingDeliveredToList.some((entry) => {
      const parsedEntry = JSON.parse(entry);
      return parsedEntry.userId === userDetails.userId;  // Check by userId
    });

    if (!isUserAlreadyInDeliveredToList) {
      const userData = JSON.stringify({
        userId: userDetails.userId,
        firstName: userDetails.firstName,
        lastName: userDetails.lastName,
        profilePictureUrl: userDetails.profilePictureUrl,
        timestamp: new Date(),
      });
      await redisClient.rPush(deliveredToKey, userData);
      console.log(`User ${userDetails.userId} added to deliveredTo list for chatroom "${chatroomName}", sender "${senderId}", and message "${messageId}"`);
    } else {
      console.log(`User ${userDetails.userId} is already in the deliveredTo list for chatroom "${chatroomName}", sender "${senderId}", and message "${messageId}"`);
    }
  } catch (error) {
    console.error(`Error updating deliveredTo list for chatroom "${chatroomName}", sender "${senderId}", and message "${messageId}":`, error);
    throw error;
  }
};

module.exports = {
  fetchChatroomsAndCache,
  getChatroomFromCache,
  fetchChatroomMessageDetails,
  updateReadByList,
  updateDeliveredToList,
};
