const { Chatroom } = require('../models/ChatRoom');  // Import the Chatroom model
const { redisClient } = require('./redisClient');
const {checkAndUpdateDeliveredStatus, checkAndUpdateReadStatus} = require('./deliveredTo_readby')
// Promisify Redis functions if needed
const getAsync = redisClient.get.bind(redisClient);
const setexAsync = redisClient.setEx.bind(redisClient);
const keysAsync = redisClient.keys.bind(redisClient);

// Fetch chatrooms and cache each chatroom individually in Redis
const fetchChatroomsAndCache = async () => {
  try {
    // Step 1: Fetch chatrooms from MongoDB
    const chatrooms = await fetchChatroomsFromMongoDB();
      console.log('Cache miss: Chatrooms fetched from MongoDB');
      
      // Step 2: Cache the chatrooms (this will overwrite any existing cache)
    await cacheMultipleChatrooms(chatrooms);
    console.log('Chatrooms cached successfully');

    return chatrooms;
  } catch (error) {
    console.error('Error fetching chatrooms:', error);
    throw error;
  }
};



// Fetch all chatrooms from MongoDB
const fetchChatroomsFromMongoDB = async () => {
  try {
    // const chatmessages =  await ChatRoomMessages.find();
    const chatrooms = await Chatroom.find().maxTimeMS(60000).exec(); // 30 seconds
    return chatrooms
  } catch (error) {
    console.error('Error fetching from MongoDB:', error);
    throw error;
  }
};

// Get all chatroom keys from Redis
const getChatroomKeysFromCache = async () => {
  try {
    const keys = await keysAsync('chatroom:*');
    console.log(keys);
    return keys;  // Fetch keys with the pattern 'chatroom:*'
  } catch (err) {
    console.error('Error fetching chatroom keys from Redis:', err);
    throw err;
  }
};

// Get multiple chatrooms from Redis based on chatroom keys
const getMultipleChatroomsFromCache = async (keys) => {
  try {
    if (!keys || keys.length === 0) {
      throw new Error("No chatroom keys found");
    }
    const chatrooms = await Promise.all(
      keys.filter(key => key).map(key => getAsync(key))  // Filter invalid keys
    );
    return chatrooms.map((chatroom, index) => {
      if (!chatroom) {
        console.warn(`No data found in Redis for key: ${keys[index]}`);
        return null; // If no data found for this key, return null
      }
      try {
        return JSON.parse(chatroom);
      } catch (parseError) {
        console.error(`Error parsing chatroom data for key ${keys[index]}:`, parseError);
        return null;
      }
    }).filter(chatroom => chatroom !== null); // Filter out invalid chatrooms
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
    const chatroomKey = `chatroom:${chatroomName}`;
    const chatroomData = await redisClient.get(chatroomKey);

    if (!chatroomData) {
      throw new Error(`Chatroom "${chatroomName}" not found in cache`);
    }

    return JSON.parse(chatroomData);
  } catch (error) {
    console.error(`Error fetching chatroom from cache:`, error);
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

    if (isUserAlreadyInReadByList) {
      console.log(`User ${userDetails.userId} already read this message in chatroom "${chatroomName}", sender "${senderId}", and message "${messageId}"`);
      return "user already read this message"; // Return this if user exists
    } else {
      // Add the user to the `readBy` list
      const userData = JSON.stringify({
        userId: userDetails.userId,
        firstName: userDetails.firstName,
        lastName: userDetails.lastName,
        profilePictureUrl: userDetails.profilePictureUrl,
        timestamp: new Date(),
      });
      await redisClient.rPush(readByKey, userData);
      console.log(`User ${userDetails.userId} added to readBy list for chatroom "${chatroomName}", sender "${senderId}", and message "${messageId}"`);

      // Fetch the updated readBy list
      const updatedReadByList = await redisClient.lRange(readByKey, 0, -1);

      // Check if all participants have read the message
      // await checkAndUpdateReadStatus(chatroomName, messageId, updatedReadByList);
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
      // Add the user to the `deliveredTo` list
      const userData = JSON.stringify({
        userId: userDetails.userId,
        firstName: userDetails.firstName,
        lastName: userDetails.lastName,
        profilePictureUrl: userDetails.profilePictureUrl,
        timestamp: new Date(),
      });
      await redisClient.rPush(deliveredToKey, userData);
      console.log(`User ${userDetails.userId} added to deliveredTo list for chatroom "${chatroomName}", sender "${senderId}", and message "${messageId}"`);

      // Fetch the updated deliveredTo list
      const updatedDeliveredToList = await redisClient.lRange(deliveredToKey, 0, -1);

      // Check if all participants have received the message
      // await checkAndUpdateDeliveredStatus(chatroomName, messageId, updatedDeliveredToList);
    } else {
      return "message already delivered to this user";
    };
  } catch (error) {
    console.error(`Error updating deliveredTo list for chatroom "${chatroomName}", sender "${senderId}", and message "${messageId}":`, error);
    throw error;
  }
};

module.exports = {
  fetchChatroomsAndCache,
  fetchChatroomsFromMongoDB,
  getChatroomKeysFromCache,
  getMultipleChatroomsFromCache,
  cacheMultipleChatrooms,
  getChatroomFromCache, // Make sure this is exported
  setChatroomInCache,
  updateReadByList,
  updateDeliveredToList
};


