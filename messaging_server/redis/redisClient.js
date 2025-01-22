const { createClient } = require('redis');
const EventEmitter = require('events');

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

module.exports = { redisClient, connectClient };
