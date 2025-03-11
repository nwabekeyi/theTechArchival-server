const { Server } = require("socket.io");
const {
  fetchChatroomsAndCache,
  updateReadByList,
  updateDeliveredToList,
  getChatroomFromCache,
} = require("./redis/redisCaches");
const { toggleUserOnlineStatus } = require("./socketUtils/users");
const { handleChatroomMessage } = require("./socketUtils/chatroomMessage");
const {
  addToDeliveredTo,
  addToReadBy,
  getDeliveredTo,
  findUndeliveredMessages,
  updateDeliveredTo,
  updateReadBy,
} = require("./socketUtils/readBy-deliveredTo");
const { fetchReadByForMessage, fetchDeliveredToForMessage } = require("./redis/deliveredTo_readby");
const { startCache } = require("./socketUtils/chatroom");
const chatRoomMessagesResolvers = require("./graphql/resolvers/chatRoomMessages");

startCache();

const offlineRequests = [];

const processOfflineRequests = () => {
  setInterval(async () => {
    if (offlineRequests.length > 0) {
      for (const request of offlineRequests) {
        const { type, chatroomName, recipientDetails, messageId, senderId } = request;
        try {
          if (type === "deliveredTo") {
            updateDeliveredTo(chatroomName, senderId, messageId, recipientDetails);
          } else if (type === "readBy") {
            updateReadBy(chatroomName, senderId, messageId, recipientDetails);
          }
          offlineRequests = offlineRequests.filter((req) => req !== request);
        } catch (error) {
          console.error(`Error processing offline request: ${error}`);
        }
      }
    }
  }, 30000);
};

const setupSocket = (server, onlineUsers) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5174",
      credentials: true,
    },
  });

  processOfflineRequests();

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("get undelivered chatroomMessages", ({ chatroomNames, recipientDetails }) => {
      findUndeliveredMessages(chatroomNames, recipientDetails)
        .then((undeliveredMessages) => {
          if (chatroomNames && recipientDetails) {
            undeliveredMessages.forEach((chatroomMessage) => {
              socket.emit("chatroom message", chatroomMessage);
            });
          }
        })
        .catch((error) => {
          console.error("Error fetching undelivered messages:", error);
        });
    });

    socket.on("oflline readBy", async (chatroomName, senderId, messageId) => {
      const readByArray = await fetchReadByForMessage(chatroomName, senderId, messageId);
      if (readByArray) {
        socket.emit("offline readBy", readByArray);
      }
    });

    socket.on("oflline deliveredTo", async (chatroomName, senderId, messageId) => {
      const deliveredToArray = await fetchDeliveredToForMessage(chatroomName, senderId, messageId);
      if (deliveredToArray) {
        socket.emit("offline deliveredTo", deliveredToArray);
      }
    });

    socket.emit("receiveSocketId", { socketId: socket.id });

    socket.on("updatedChatroomMessage data", async ({ chatroomName, messageId }) => {
      const deliveredToChatroom = getDeliveredTo(chatroomName, messageId);
      socket.emit("updatedChatroomMessage data", { deliveredToChatroom });
    });

    socket.on("userConnect", async ({ userId, userRole }) => {
      console.log("User connected with data:", { userId, userRole });
      await toggleUserOnlineStatus(userId, userRole, true, io, socket);
      onlineUsers.set(userId, { socketId: socket.id, role: userRole });
      io.emit("userStatusChange", { userId, status: true });
      socket.emit("getUsers", Array.from(onlineUsers));
    });

    socket.on("chatroom message", async (messageBody) => {
      try {
        // Set status to "sent" before saving to DB
        const messageToSave = {
          ...messageBody,
          status: "sent", // Explicitly set status to "sent"
        };

        // Save the message to the database
        const savedMessage = await chatRoomMessagesResolvers.Mutation.sendMessage(
          null,
          {
            chatroomName: messageToSave.chatroomName,
            sender: messageToSave.sender,
            message: messageToSave.message,
            messageType: messageToSave.messageType,
            status: messageToSave.status, // "sent"
            deliveredTo: messageToSave.deliveredTo,
            readBy: messageToSave.readBy,
            replyTo: messageToSave.replyTo,
            mention: messageToSave.mention,
          },
          {}
        );

        // Construct the saved message with all necessary fields
        const updatedMessageBody = {
          _id: savedMessage._id,
          chatroomName: messageToSave.chatroomName,
          sender: messageToSave.sender,
          message: messageToSave.message,
          messageType: messageToSave.messageType,
          status: "sent", // Reflect the DB status
          deliveredTo: savedMessage.deliveredTo || messageToSave.deliveredTo,
          readBy: savedMessage.readBy || messageToSave.readBy,
          replyTo: messageToSave.replyTo,
          mention: messageToSave.mention,
          timestamp: savedMessage.timestamp || messageToSave.timestamp,
        };

        // Broadcast the message to participants
        handleChatroomMessage(io, onlineUsers, socket, updatedMessageBody);

        // Emit confirmation to the sender with the full saved message
        const senderId = updatedMessageBody.sender.id;
        const senderSocketId = onlineUsers.get(senderId)?.socketId;
        if (senderSocketId) {
          io.to(senderSocketId).emit("chatroom message received", {
            messageId: updatedMessageBody._id,
            chatroomName: updatedMessageBody.chatroomName,
            message: updatedMessageBody.message,
            status: updatedMessageBody.status, // "sent"
            timestamp: updatedMessageBody.timestamp,
            deliveredTo: updatedMessageBody.deliveredTo,
            readBy: updatedMessageBody.readBy,
            sender: updatedMessageBody.sender,
            messageType: updatedMessageBody.messageType,
            replyTo: updatedMessageBody.replyTo,
            mention: updatedMessageBody.mention,
          });
        } else {
          console.log(`Sender ${senderId} not online, skipping confirmation`);
        }
      } catch (error) {
        console.error("Failed to save message to DB:", error);
        const senderId = messageBody.sender.id;
        const senderSocketId = onlineUsers.get(senderId)?.socketId;
        if (senderSocketId) {
          io.to(senderSocketId).emit("chatroom message received", {
            messageId: messageBody._id || "unknown",
            chatroomName: messageBody.chatroomName,
            status: "failure",
            error: error.message,
          });
        }
      }
    });

    socket.on("chatroomMessage deliveredTo", async ({ chatroomName, recipientDetails, messageId, senderId }) => {
      try {
        const chatroom = await getChatroomFromCache(chatroomName);
        const deliverTo = await addToDeliveredTo(chatroomName, recipientDetails, messageId, senderId);

        if (deliverTo !== "message already delivered to this user") {
          chatroom.participants.forEach((participant) => {
            if (onlineUsers.has(participant.userId)) {
              const participantSocketId = onlineUsers.get(participant.userId).socketId;
              io.to(participantSocketId).emit("chatroomMessage delivered", {
                chatroomName,
                messageId,
                recipientDetails,
              });
            } else {
              updateDeliveredToList(chatroomName, senderId, messageId, recipientDetails);
            }
          });
        }
      } catch (error) {
        console.error("Error updating deliveredTo:", error);
      }
    });

    socket.on("chatroomMessage readBy", async ({ chatroomName, recipientDetails, messageId, senderId }) => {
      try {
        const chatroom = await getChatroomFromCache(chatroomName);
        const readBy = addToReadBy(chatroomName, recipientDetails, messageId);

        if (readBy !== "user already read this message") {
          chatroom.participants.forEach((participant) => {
            if (onlineUsers.has(participant.userId)) {
              const participantSocketId = onlineUsers.get(participant.userId).socketId;
              io.to(participantSocketId).emit("messageRead", {
                chatroomName,
                messageId,
                recipientDetails,
              });
            } else {
              updateReadByList(chatroomName, senderId, messageId, recipientDetails);
            }
          });
        }
      } catch (error) {
        console.error("Error updating readBy:", error);
      }
    });

    socket.on("disconnect", async () => {
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

function getKey(map, value) {
  return [...map].find(([key, val]) => val.socketId === value)?.[0];
}

module.exports = { setupSocket };