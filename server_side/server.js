// Importing required modules
const express = require("express");
const morgan = require("morgan"); // For logging
const helmet = require("helmet"); // For setting HTTP headers for security
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const http = require("http"); // Import the HTTP server
const dbConnection = require("./models/dbconns");
const userRouter = require("./Routes/user");
const envConfig = require('./configs/dotenv')
const onlineUsers = require("./Routes/onlineUsers");
const auth = require('./Routes/auth');
const cookieParser = require('cookie-parser');
const {websocketSignal} = require("./websocketSignal");
const code = require("./Routes/codeRoutes");
const courseRouter = require("./Routes/courseRoutes");
const timeTableRouter = require("./Routes/timeTableRoutes");
const assignmentRouter = require("./Routes/assignmentRoutes");
const feedback = require("./Routes/feedbackRoute");
const contact = require("./Routes/contactRoute");
const instructorReviews = require("./Routes/insructorReviews");
const payment = require("./Routes/paymentRoute");
const enquiries = require("./Routes/enquiries")


// Import rate limiting middleware
const rateLimit = require('express-rate-limit');



// Import the WebSocket logic

// Database connection
dbConnection();


// Initialize the Express app
const app = express();
const PORT = envConfig.PORT || 3000;
const logFile = fs.createWriteStream(path.join(__dirname, "logFile.log"), {
  flags: "a",
});


// Rate limiting setup (global for all routes)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

// Apply rate limiting middleware globally
app.use(limiter);

// Middleware functions
// Set up CSP using Helmet
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://*.googleapis.com"],
    connectSrc: ["'self'", "https://firestore.googleapis.com", "wss://babatech-e-learning.onrender.com", 'https://the-tech-archival-client-side-5wvq.vercel.app'], // Allow WSS connection
    imgSrc: ["'self'", "data:", "https://*"],
    mediaSrc: ["'self'", "https://*"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://*.googleapis.com"],
  },
}));




app.use(morgan("dev", { stream: logFile }));
app.use(cors({
  origin: [
    "http://localhost:5174", // Local development
    "https://the-tech-archival-client-side-5wvq.vercel.app", // Production site
    "https://babtech-e-learning.onrender.com" // Another possible origin
  ],
  credentials: true, // Allow credentials (cookies, headers)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allow the required methods
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'], // Allow specific headers
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files from the Vite `dist` folder
const distPath = path.join(__dirname, '../client_side','dist');
app.use(express.static(distPath));

// Routes
app.use(userRouter);
app.use(onlineUsers);
app.use(auth);
app.use(code);
app.use(courseRouter)
app.use(timeTableRouter)
app.use(assignmentRouter)
app.use(feedback)
app.use(contact)
app.use(instructorReviews)
app.use(payment)
app.use(enquiries)


// Wildcard route to serve the index.html file for all other routes
app.get('/', (req, res) => {
  res.send('welcome to The Archival');
});

// Create the HTTP server from the Express app
const server = http.createServer(app);

// Initialize WebSocket signaling logic
websocketSignal(server);


// Start the HTTP and WebSocket server
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
