const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { ApolloServer } = require("apollo-server-express");
const { createServer } = require("http");
const { setupSocket } = require("./socket"); // Socket.IO setup
require("./config/mongo"); // MongoDB connection setup
const { connectClient } = require("./redis/redisClient"); // Import the connectClient function to connect to Redis
const { InMemoryLRUCache } = require('apollo-server-caching');


dotenv.config();

const app = express();

// Middleware setup
app.use(
  cors({
    origin: [
      "http://localhost:3000", // Your React frontend
      "http://localhost:5174", // Your Vite frontend (or other dev tools)
      "https://studio.apollographql.com", // Apollo Studio
      "https://the-tech-archival-client-side-5wvq.vercel.app"
    ],
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Simple home route to confirm the server is running on port 4000
app.get('/', (req, res) => {
  res.send('Server is running on port 4000');
});

// Import the combined schema (typeDefs and resolvers)
const schema = require("./graphql/index"); // Import your schema with typeDefs and resolvers

// Initialize Apollo Server
const apolloServer = new ApolloServer({
  schema,
  introspection: true, // Enable introspection (useful in dev)
  playground: true, // Enable GraphQL Playground
  context: ({ req, res }) => ({ req, res }), // Remove pubsub, just pass req and res,
  persistedQueries: {
    cache: new InMemoryLRUCache({ maxSize: 1000 * 1024 * 1024 }), // Limit cache to 1MB
  },
});

// Asynchronously start the Apollo Server and apply middleware
async function startApolloServer() {
  // Connect to Redis
  await connectClient(); // Ensure Redis client is connected before starting the server

  await apolloServer.start(); // Wait for the server to start
  apolloServer.applyMiddleware({
    app,
    cors: false, // Disable Apollo's built-in CORS so we can handle it with Express
  });

  // Initialize the HTTP server for Express
  const server = createServer(app);

  // Initialize onlineUsers map for tracking active users
  global.onlineUsers = new Map();

  // Initialize Socket.IO with an explicit path
  const io = setupSocket(server, onlineUsers, {
    path: "/socket.io",  // Explicit path for Socket.IO
  });

  // Server setup (Single port for Express, GraphQL, and Socket.IO)
  const PORT = process.env.PORT || 4000; // Ensure it listens on the correct port
  server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    console.log(`GraphQL endpoint: http://localhost:${PORT}${apolloServer.graphqlPath}`);
    console.log(`Socket.IO running on path: http://localhost:${PORT}/socket.io`);
  });
}

// Call the async function to start Apollo Server and Express
startApolloServer();
