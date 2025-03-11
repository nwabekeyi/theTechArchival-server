const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { ApolloServer } = require("apollo-server-express");
const { createServer } = require("http");
const { setupSocket } = require("./socket"); // Socket.IO setup
require("./config/mongo"); // MongoDB connection setup
const { connectClient } = require("./redis/redisClient"); // Import the connectClient function to connect to Redis
const { InMemoryLRUCache } = require("apollo-server-caching");

dotenv.config();

const app = express();

// CORS middleware
app.use(cors({
  origin: [
    "https://thetecharchival-clientside.onrender.com/",
    "https://the-tech-archival-client-side.vercel.app",
    "http://localhost:5174", // Local development
    "https://the-tech-archival-client-side-5wvq.vercel.app", // Production site
    "https://babtech-e-learning.onrender.com" // Another possible origin
  ],
  credentials: true, // Allow credentials (cookies, headers)
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Allow the required methods
  allowedHeaders: ["Content-Type", "Authorization", "Accept"], // Allow specific headers
  preflightContinue: false, // Ensure preflight response stops here
  optionsSuccessStatus: 204 // Some browsers (like Safari) don't accept 200 for OPTIONS
}));

// Handle OPTIONS preflight requests
app.options("*", (req, res) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin); // Dynamically allow origin
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept");
  res.header("Access-Control-Allow-Credentials", "true");
  res.sendStatus(204); // Use 204 No Content for preflight response
});

// Other middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Simple home route to confirm the server is running
app.get("/", (req, res) => {
  console.log("Root route accessed");
  res.send("Server is running on port 4000");
});

// Test route to confirm Express routing beyond root
app.get("/test", (req, res) => {
  console.log("Test route accessed");
  res.send("Test route working");
});

// Import the combined schema (typeDefs and resolvers)
const schema = require("./graphql/index"); // Import your schema with typeDefs and resolvers

// Initialize Apollo Server
const apolloServer = new ApolloServer({
  schema,
  introspection: process.env.NODE_ENV !== "production", // Disable in prod
  playground: process.env.NODE_ENV !== "production", // Disable in prod
  context: ({ req, res }) => ({ req, res }), // Pass req and res
  persistedQueries: {
    cache: new InMemoryLRUCache({ maxSize: 1000 * 1024 * 1024 }), // Limit cache to 1MB
  },
});

// Asynchronously start the Apollo Server and apply middleware
async function startApolloServer() {
  try {
    console.log("Starting Apollo Server setup...");

    // Connect to Redis
    await connectClient();
    console.log("Redis connection established");

    // Start Apollo Server
    await apolloServer.start();
    console.log("Apollo Server started successfully");

    // Apply GraphQL middleware
    apolloServer.applyMiddleware({
      app,
      path: "/graphql",
      cors: false, // Disable Apollo's built-in CORS so we handle it with Express
    });
    console.log(`GraphQL middleware applied at ${apolloServer.graphqlPath}`);

    // Initialize the HTTP server for Express
    const server = createServer(app);

    // Initialize onlineUsers map for tracking active users
    global.onlineUsers = new Map();

    // Initialize Socket.IO with an explicit path
    const io = setupSocket(server, onlineUsers, {
      path: "/socket.io", // Explicit path for Socket.IO
    });

    // Server setup (Single port for Express, GraphQL, and Socket.IO)
    const PORT = process.env.PORT || 4000;
    server.listen(PORT, () => {
      const baseUrl = process.env.NODE_ENV === "production" ? "https://messaging-server-bvci.onrender.com/" : "http://localhost";
      console.log(`Server listening on port ${PORT}`);
      console.log(`GraphQL endpoint: ${baseUrl}${apolloServer.graphqlPath}`);
      console.log(`Socket.IO running on path: ${baseUrl}/socket.io`);
    });
  } catch (error) {
    console.error("Error during server startup:", error);
    process.exit(1); // Exit to force Render to log the failure
  }
}

// Call the async function to start Apollo Server and Express
startApolloServer();