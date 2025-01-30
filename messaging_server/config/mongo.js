const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

// Load the two MongoDB URIs from the environment variables
const MONGO_URI_DB1 = process.env.MONGO_URI_DB1;
const MONGO_URI_DB2 = process.env.MONGO_URI_DB2;

// Function to connect to the first MongoDB database
function connectToDb1() {
  const connection1 = mongoose.createConnection(MONGO_URI_DB1, {
    serverSelectionTimeoutMS: 60000, // 1 minute timeout
  });

  connection1.on("connected", () => {
    console.log("MongoDB1 has connected successfully");
  });

  connection1.on("reconnected", () => {
    console.log("MongoDB1 has reconnected");
  });

  connection1.on("error", (error) => {
    console.log("MongoDB1 connection has an error", error);
    connection1.disconnect();
  });

  connection1.on("disconnected", () => {
    console.log("MongoDB1 connection is disconnected");
  });

  return connection1;
}

// Function to connect to the second MongoDB database
function connectToDb2() {
  const connection2 = mongoose.createConnection(MONGO_URI_DB2, {
    serverSelectionTimeoutMS: 60000, // 1 minute timeout
  });

  connection2.on("connected", () => {
    console.log("MongoDB2 has connected successfully");
  });

  connection2.on("reconnected", () => {
    console.log("MongoDB2 has reconnected");
  });

  connection2.on("error", (error) => {
    console.log("MongoDB2 connection has an error", error);
    connection2.disconnect();
  });

  connection2.on("disconnected", () => {
    console.log("MongoDB2 connection is disconnected");
  });

  return connection2;
}

// Initialize both connections
const db1Connection = connectToDb1();
const db2Connection = connectToDb2();

// Function to wait for both databases to connect
async function waitForBothDbs() {
  const db1Connected = new Promise((resolve) => {
    if (db1Connection.readyState === 1) {
      resolve();
    } else {
      db1Connection.on("connected", () => {
        resolve();
      });
    }
  });

  const db2Connected = new Promise((resolve) => {
    if (db2Connection.readyState === 1) {
      resolve();
    } else {
      db2Connection.on("connected", () => {
        resolve();
      });
    }
  });

  // Wait until both promises are resolved (both databases are connected)
  await Promise.all([db1Connected, db2Connected]);
  return true;
}

// Export the connections and the wait function
module.exports = {
  db1Connection,
  db2Connection,
  waitForBothDbs,
};