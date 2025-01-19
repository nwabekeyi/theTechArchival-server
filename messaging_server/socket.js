const { Server } = require("socket.io");
const { fetchChatroomsAndCache } = require('./redis/redisClient');
const { toggleUserOnlineStatus } = require('./socketUtils/users');
const { handleChatroomMessage } = require('./socketUtils/chatroomMessage'); // Import the new logic file
const { 
        addToDeliveredTo,
        addToReadBy,
        getDeliveredTo,
        findUndeliveredMessages,
        getReadBy } = require('./socketUtils/readBy-deliveredTo');

// Fetch chatrooms once when the server starts and cache them in Redis
const initializeChatroomsCache = async () => {
  try {
    await fetchChatroomsAndCache();  // Fetch and cache chatrooms
    console.log("Chatrooms cached successfully.");
  } catch (error) {
    console.error('Error fetching and caching chatrooms on server start:', error);
  }
};

const setupSocket = (server, onlineUsers) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5174", // Your React frontend URL
      credentials: true,
    },
  });

  // Initialize chatrooms cache on server startup
  initializeChatroomsCache();

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('get undelivered chatroomMessages', ({ chatroomNames, recipientDetails }) => {
      findUndeliveredMessages(chatroomNames, recipientDetails)
        .then(undeliveredMessages => {
          // console.log('Undelivered messages:', undeliveredMessages); // Log the messages here
    
          if (chatroomNames && recipientDetails) {
            undeliveredMessages.forEach((chatroomMessage) => {
              socket.emit('chatroom message', chatroomMessage);
            })
          }
        })
        .catch(error => {
          console.error("Error fetching undelivered messages:", error);
        });
    });

    // Send socket.id to the client
    socket.emit('receiveSocketId', { socketId: socket.id });


    socket.on('updatedChatroomMessage data', async ({chatroomName, messageId}) => {
      const deliveredToChatroom = getDeliveredTo(chatroomName, messageId);
      socket.emit('updatedChatroomMessage data', {deliveredToChatroom})

    });

    // Handle user connection and update online status
    socket.on('userConnect', async ({ userId, userRole }) => {
      console.log('User connected with data:', { userId, userRole });

      // Update the user's online status in the database
      await toggleUserOnlineStatus(userId, userRole, true, io, socket);
      onlineUsers.set(userId, { socketId: socket.id, role: userRole });

      // Notify all clients that this user is online
      io.emit('userStatusChange', { userId, status: true });

      socket.emit('getUsers', Array.from(onlineUsers));  // Emit the updated list of online users
    });

    // Handle incoming chatroom messages
    socket.on('chatroom message', (messageBody) => {
      handleChatroomMessage(io, onlineUsers, socket, messageBody);
    });

    // Handle deliveredTo
    socket.on('chatroomMessage deliveredTo', async ({ chatroomName, recipientDetails, messageId, senderId }) => {
      try {
        // Add user to deliveredTo array and get updated array
        const updatedDeliveredTo = addToDeliveredTo(chatroomName, recipientDetails, messageId);
        
        // Check if the sender is online
        if (onlineUsers.has(senderId) && recipientDetails) {
          const senderSocketId = await onlineUsers.get(senderId).socketId;
          io.to(senderSocketId).emit('chatroomMessage delivered', { chatroomName, messageId, recipientDetails});
        } else {
          console.log('Sender is offline. Will wait until sender reconnects.');
        }
      } catch (error) {
        console.error('Error updating deliveredTo:', error);
      }
    });

    // Handle readBy
    socket.on('chatroomMessage readBy', async ({ chatroomName, recipientDetails, messageId, senderId }) => {
      console.log('called')
      try {
        // Add user to readBy array and get updated array
        const readBy = addToReadBy(chatroomName, recipientDetails, messageId);

        // Check if the sender is online
        if (onlineUsers.has(senderId)) {
          const senderSocketId = onlineUsers.get(senderId).socketId;
          io.to(senderSocketId).emit('messageRead', { chatroomName, messageId, recipientDetails });
        } else {
          // Store this message update in Redis or another structure to send later
          console.log('Sender is offline. Will wait until sender reconnects.');
        }
      } catch (error) {
        console.error('Error updating readBy:', error);
      }
    });

    // Handle user disconnect
    socket.on('disconnect', async () => {
      const userId = getKey(onlineUsers, socket.id);
      if (userId) {
        const userRole = onlineUsers.get(userId)?.role;
        await toggleUserOnlineStatus(userId, userRole, false, io, socket);
        onlineUsers.delete(userId);

        console.log(`User ${userId} with role ${userRole} has disconnected.`);
      }
    });
  });

  return io;
};

// Helper function to get user by socket ID
function getKey(map, value) {
  return [...map].find(([key, val]) => val.socketId === value)?.[0];
}

module.exports = { setupSocket };
