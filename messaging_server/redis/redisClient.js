const { createClient } = require('redis');
const EventEmitter = require('events');
const {Chatroom} = require('../models/ChatRoom');  // Import the Chatroom model

const emitter = new EventEmitter();

// Create and configure the Redis client
const redisClient = createClient({
  url: 'redis://localhost:6379', // Adjust the URL as necessary
});

// Listen for errors and readiness
redisClient.on('error', (err) => {
  console.error('Redis client error:', err);
});

// Emit 'ready' event when the client is successfully connected
redisClient.on('ready', () => {
  console.log('Redis client connected and ready');
  emitter.emit('connected'); // Emit the connected event
});

// Ensure Redis client is properly connected before usage
const connectClient = async () => {
  try {
    // Connect Redis client
    await redisClient.connect();

    // Listen for the custom 'connected' event
    emitter.on('connected', () => {
      console.log('Emitter received: Redis client is connected');
    });
  } catch (error) {
    console.error('Error connecting to Redis:', error);
    process.exit(1); // Exit the process if Redis connection fails
  }
};

// Promisify Redis functions if needed
const getAsync = redisClient.get.bind(redisClient);
const setexAsync = redisClient.setEx.bind(redisClient);

// Function to fetch chatrooms from MongoDB and cache them in Redis
const fetchChatroomsAndCache = async () => {
  try {
    // Check Redis cache first
    const cachedChatrooms = await getCachedChatrooms();
    if (cachedChatrooms) {
      console.log('Cache hit: Chatrooms fetched from Redis');
      return JSON.parse(cachedChatrooms); // Return parsed chatrooms from cache
    }

    // If no cache, fetch from MongoDB directly
    const chatrooms = await fetchChatroomsFromMongoDB();

    // Cache the chatrooms in Redis (set with an expiry time of 3600 seconds = 1 hour)
    await setChatroomsInCache(chatrooms);

    console.log('Cache miss: Chatrooms fetched from MongoDB');
    return chatrooms;
  } catch (error) {
    console.error('Error fetching chatrooms:', error);
    throw error;
  }
};

// Fetch chatrooms directly from MongoDB using Mongoose
const fetchChatroomsFromMongoDB = async () => {
  try {
    const chatrooms = await Chatroom.find().exec(); // Fetch all chatrooms
    return chatrooms;
  } catch (error) {
    console.error('Error fetching from MongoDB:', error);
    throw error;
  }
};

// Get chatrooms from Redis cache
const getCachedChatrooms = async () => {
  try {
    const data = await getAsync('chatrooms');
    console.log(data);
    return data;  // Return the raw data (stringified) if it exists
  } catch (err) {
    console.error('Error fetching from Redis:', err);
    throw err;
  }
};

// Set chatrooms in Redis cache
const setChatroomsInCache = async (chatrooms) => {
  try {
    await setexAsync('chatrooms', 3600, JSON.stringify(chatrooms));
  } catch (err) {
    console.error('Error setting in Redis:', err);
    throw err;
  }
};

// New function to fetch a specific chatroom by name
const getChatroomFromCache = async (chatroomName) => {
  try {
    // Check Redis cache for specific chatroom
    const cachedChatroom = await getAsync(`chatroom:${chatroomName}`);
    if (cachedChatroom) {
      console.log(`Cache hit: Chatroom "${chatroomName}" fetched from Redis`);
      return JSON.parse(cachedChatroom); // Return parsed chatroom from cache
    }

    // If not in cache, fetch from MongoDB
    const chatroom = await fetchChatroomFromMongoDB(chatroomName);

    // Cache the chatroom in Redis (set with an expiry time of 3600 seconds = 1 hour)
    await setChatroomInCache(chatroomName, chatroom);

    console.log(`Cache miss: Chatroom "${chatroomName}" fetched from MongoDB`);
    return chatroom;
  } catch (error) {
    console.error(`Error fetching chatroom "${chatroomName}":`, error);
    throw error;
  }
};

// Fetch specific chatroom from MongoDB using Mongoose
const fetchChatroomFromMongoDB = async (chatroomName) => {
  try {
    const chatroom = await Chatroom.findOne({ name: chatroomName }).exec(); // Fetch chatroom by name
    return chatroom;
  } catch (error) {
    console.error('Error fetching from MongoDB:', error);
    throw error;
  }
};

// Set a specific chatroom in Redis cache
const setChatroomInCache = async (chatroomName, chatroom) => {
  try {
    await setexAsync(`chatroom:${chatroomName}`, 3600, JSON.stringify(chatroom));
  } catch (err) {
    console.error(`Error setting chatroom "${chatroomName}" in Redis:`, err);
    throw err;
  }
};

module.exports = { redisClient, connectClient, fetchChatroomsAndCache, getChatroomFromCache };
