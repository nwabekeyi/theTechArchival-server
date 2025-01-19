const { getChatroomFromCache } = require('../redis/redisClient');

const handleChatroomMessage = async (io, onlineUsers, socket, messageBody) => {
  const { chatroomName, readBy, status, _id, sender, message, messageType, deliveredTo, replyTo, mention } = messageBody;
  console.log(messageBody)
  try {
    const chatroom = await getChatroomFromCache(chatroomName);
    
    if (!chatroom) {
      console.error(`Chatroom with name ${chatroomName} not found in cache.`);
      return;
    }

    const messageData = {
      chatroomName,
      message: {
        sender,
        message,
        messageType,
        deliveredTo,
        replyTo,
        mention,
        timestamp: new Date(),
        status,
        _id,
        readBy
      }
    };

    chatroom.participants.forEach((participant) => {
      const participantSocket = onlineUsers.get(participant.userId);
      
      if (participantSocket && participant.userId !== sender.id) { // Check if participant is not the sender
        const participantSocketId = participantSocket.socketId;
        console.log(`Emitting message to participant ${participant.userId} with socket ID: ${participantSocketId}`);
        io.to(participantSocketId).emit('chatroom message', messageData);
      } else {
        console.log(`Participant ${participant.userId} is not online or is the sender.`);
      }
    });

    // Notify sender that message was sent
    socket.emit('message sent', messageData);
  } catch (err) {
    console.error('Error sending chatroom message:', err);
  }
};

module.exports = { handleChatroomMessage };