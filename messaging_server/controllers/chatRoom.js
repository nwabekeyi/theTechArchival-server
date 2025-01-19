const { Chatroom } = require('../models/ChatRoom');

// Add a message to a chatroom
const addMessage = async (req, res) => {
  const { name } = req.params;
  const { sender, content } = req.body;

  try {
    const chatroom = await Chatroom.findOneAndUpdate(
      { name },
      {
        $push: {
          messages: { sender, content, timestamp: new Date() },
        },
      },
      { new: true }
    );

    if (!chatroom) {
      return res.status(404).json({ error: 'Chatroom not found' });
    }

    res.status(201).json(chatroom);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error adding message' });
  }
};

// Add a participant to a chatroom
const addParticipant = async (req, res) => {
  const { name } = req.params;
  const { userId, firstName, lastName, profilePictureUrl } = req.body;

  try {
    const chatroom = await Chatroom.findOneAndUpdate(
      { name },
      {
        $push: {
          participants: { userId, firstName, lastName, profilePictureUrl },
        },
      },
      { new: true }
    );

    if (!chatroom) {
      return res.status(404).json({ error: 'Chatroom not found' });
    }

    res.status(201).json(chatroom);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error adding participant' });
  }
};

// Remove a participant from a chatroom
const removeParticipant = async (req, res) => {
  const { name, userId } = req.params;

  try {
    const chatroom = await Chatroom.findOneAndUpdate(
      { name },
      {
        $pull: { participants: { userId } },
      },
      { new: true }
    );

    if (!chatroom) {
      return res.status(404).json({ error: 'Chatroom not found' });
    }

    res.status(200).json(chatroom);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error removing participant' });
  }
};

// Remove a message from a chatroom
const removeMessage = async (req, res) => {
  const { name, messageId } = req.params;

  try {
    const chatroom = await Chatroom.findOneAndUpdate(
      { name },
      {
        $pull: { messages: { _id: messageId } },
      },
      { new: true }
    );

    if (!chatroom) {
      return res.status(404).json({ error: 'Chatroom not found' });
    }

    res.status(200).json(chatroom);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error removing message' });
  }
};


// POST: Create a new Chatroom
const createChatroom = async (req, res) => {
  const { name, participants } = req.body;

  try {
    // Check if a chatroom with the same name already exists
    const existingChatroom = await Chatroom.findOne({ name });
    if (existingChatroom) {
      return res.status(400).json({ message: 'Chatroom already exists' });
    }

    // Create a new Chatroom instance
    const newChatroom = new Chatroom({
      name,
      participants,
    });

    // Save the new chatroom to the database
    await newChatroom.save();
    return res.status(201).json({ message: 'Chatroom created successfully', chatroom: newChatroom });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET: Get all Chatrooms
const getChatrooms = async (req, res) => {
  try {
    const chatrooms = await Chatroom.find();
    return res.status(200).json({ chatrooms });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET: Get a specific Chatroom by name
const getChatroomByName = async (req, res) => {
  const { name } = req.params;

  try {
    const chatroom = await Chatroom.findOne({ name });
    if (!chatroom) {
      return res.status(404).json({ message: 'Chatroom not found' });
    }

    return res.status(200).json({ chatroom });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PUT: Update an existing Chatroom
const updateChatroom = async (req, res) => {
  const { name } = req.params;
  const { participants, messages } = req.body;

  try {
    const chatroom = await Chatroom.findOneAndUpdate(
      { name }, 
      { $set: { participants, messages, updatedAt: new Date() } }, 
      { new: true }
    );

    if (!chatroom) {
      return res.status(404).json({ message: 'Chatroom not found' });
    }

    return res.status(200).json({ message: 'Chatroom updated successfully', chatroom });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// DELETE: Delete a Chatroom by name
const deleteChatroom = async (req, res) => {
  const { name } = req.params;

  try {
    const chatroom = await Chatroom.findOneAndDelete({ name });

    if (!chatroom) {
      return res.status(404).json({ message: 'Chatroom not found' });
    }

    return res.status(200).json({ message: 'Chatroom deleted successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createChatroom,
  getChatrooms,
  getChatroomByName,
  updateChatroom,
  deleteChatroom,
  addMessage,
  addParticipant,
  removeParticipant,
  removeMessage
};
