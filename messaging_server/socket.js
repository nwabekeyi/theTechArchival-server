const { Server } = require("socket.io");
const { 
  fetchChatroomsAndCache,
  updateReadByList,
  updateDeliveredToList,
  getChatroomFromCache
} = require('./redis/redisCaches');
const { toggleUserOnlineStatus } = require('./socketUtils/users');
const { handleChatroomMessage } = require('./socketUtils/chatroomMessage');
const {
  addToDeliveredTo,
  addToReadBy,
  getDeliveredTo,
  findUndeliveredMessages,
  updateDeliveredTo,
  updateReadBy
} = require('./socketUtils/readBy-deliveredTo');
const {
  fetchReadByForMessage, 
  fetchDeliveredToForMessage
}= require('./redis/deliveredTo_readby');
const { startCache} = require('./socketUtils/chatroom');


//start caching chatroom
startCache();

const offlineRequests = [];

// Function to process offline requests every 30 seconds
const processOfflineRequests = () => {
  setInterval(async () => {
    if (offlineRequests.length > 0) {
      for (const request of offlineRequests) {
        const { type, chatroomName, recipientDetails, messageId, senderId } = request;

        try {
          if (type === 'deliveredTo') {
            // Handle deliveredTo
            updateDeliveredTo(chatroomName, senderId, messageId, recipientDetails);
          } else if (type === 'readBy') {
            // Handle readBy
            updateReadBy(chatroomName, senderId, messageId, recipientDetails);
          }

          // Remove processed request
          offlineRequests = offlineRequests.filter(req => req !== request);
        } catch (error) {
          console.error(`Error processing offline request: ${error}`);
        }
      }
    }
  }, 30000); // Every 30 seconds
};

const setupSocket = (server, onlineUsers) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5174", // Your React frontend URL
      credentials: true,
    },
  });



  // Start processing offline requests every 30 seconds
  processOfflineRequests();

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

//send undelivered chatroom messages
    socket.on('get undelivered chatroomMessages', ({ chatroomNames, recipientDetails }) => {
      findUndeliveredMessages(chatroomNames, recipientDetails)
        .then(undeliveredMessages => {
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

    //update chatroom readBy array
    socket.on('oflline readBy' , async(chatroomName, senderId, messageId) => {
      const readByArray = await fetchReadByForMessage(chatroomName, senderId, messageId);
      if(readByArray){
        socket.emit('offline readBy', readByArray);
      }
    });

    //update chatroom readBy array
    socket.on('oflline deliveredTo' , async(chatroomName, senderId, messageId) => {
      const deliveredToArray = await fetchDeliveredToForMessage(chatroomName, senderId, messageId);
      if(deliveredToArray){
        socket.emit('offline readBy', deliveredToArray);
      }
    });

    socket.emit('receiveSocketId', { socketId: socket.id });

    socket.on('updatedChatroomMessage data', async ({ chatroomName, messageId }) => {
      const deliveredToChatroom = getDeliveredTo(chatroomName, messageId);
      socket.emit('updatedChatroomMessage data', { deliveredToChatroom });
    });

    socket.on('userConnect', async ({ userId, userRole }) => {
      console.log('User connected with data:', { userId, userRole });

      await toggleUserOnlineStatus(userId, userRole, true, io, socket);
      onlineUsers.set(userId, { socketId: socket.id, role: userRole });

      io.emit('userStatusChange', { userId, status: true });
      socket.emit('getUsers', Array.from(onlineUsers));
    });

    socket.on('chatroom message', (messageBody) => {
      handleChatroomMessage(io, onlineUsers, socket, messageBody);
    });

    socket.on('chatroomMessage deliveredTo', async ({ chatroomName, recipientDetails, messageId, senderId }) => {
      try {
        // Fetch chatroom data from cache
        const chatroom = await getChatroomFromCache(chatroomName);

        // Add recipient to deliveredTo list
        const deliverTo = await addToDeliveredTo(chatroomName, recipientDetails, messageId, senderId);


        //confirm if this has been delivered to this user

        if(deliverTo !== "message already delivered to this user"){
           // Send to all participants that are online
            chatroom.participants.forEach(participant => {
              if (onlineUsers.has(participant.userId)) {
                const participantSocketId = onlineUsers.get(participant.userId).socketId;
                io.to(participantSocketId).emit('chatroomMessage delivered', { chatroomName, messageId, recipientDetails });
              } else {
                // Store the request for offline user
                updateDeliveredToList(chatroomName, senderId, messageId, recipientDetails);
              }
            });
        }
        // Send to all participants that are online
        chatroom.participants.forEach(participant => {
          if (onlineUsers.has(participant.userId)) {
            const participantSocketId = onlineUsers.get(participant.userId).socketId;
            io.to(participantSocketId).emit('chatroomMessage delivered', { chatroomName, messageId, recipientDetails });
          } else {
            // Store the request for offline user
            updateDeliveredToList(chatroomName, senderId, messageId, recipientDetails);
          }
        });
      } catch (error) {
        console.error('Error updating deliveredTo:', error);
      }
    });

    socket.on('chatroomMessage readBy', async ({ chatroomName, recipientDetails, messageId, senderId }) => {
      console.log(recipientDetails);
      try {
        // Fetch chatroom data from cache
        const chatroom = await getChatroomFromCache(chatroomName);

        // Add recipient to readBy list
        const readBy = addToReadBy(chatroomName, recipientDetails, messageId);
        
        if(readBy !== "user already read this message"){
          // Send to all participants that are online
        chatroom.participants.forEach(participant => {
          if (onlineUsers.has(participant.userId)) {
            const participantSocketId = onlineUsers.get(participant.userId).socketId;
            io.to(participantSocketId).emit('messageRead', { chatroomName, messageId, recipientDetails });
          } else {
            // Store the request for offline user
            updateReadByList(chatroomName, senderId, messageId, recipientDetails);
          }
        });
        }
      } catch (error) {
        console.error('Error updating readBy:', error);
      }
    });

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
