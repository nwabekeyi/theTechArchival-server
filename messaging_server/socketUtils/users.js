const { Admin, SuperAdmin, Student, Instructor } = require('../models/users');  // Import user models

// Function to update user's online/offline status dynamically based on role
const toggleUserOnlineStatus = async (userId, userRole, isOnline, io, socket) => {
  try {
    let UserModel;

    // Dynamically assign the model based on the role
    switch (userRole.toLowerCase()) {
      case 'admin':
        UserModel = Admin;
        break;
      case 'superadmin':
        UserModel = SuperAdmin;
        break;
      case 'student':
        UserModel = Student;
        break;
      case 'instructor':
        UserModel = Instructor;
        break;
      default:
        throw new Error('Invalid user role');
    }

    const user = await UserModel.findOne({ userId });  // Find the user by userId in the respective collection

    if (user) {
      user.status.onlineStatus = isOnline;  // Set the user's online status (true for online, false for offline)
      
      let lastSeen = null;  // Initialize lastSeen variable

      if (!isOnline) {
        lastSeen = new Date();  // Set the last seen timestamp only when going offline
        user.status.lastSeen = lastSeen;
      }

      await user.save();  // Save the updated user data
      console.log(`User ${userId} status updated to ${isOnline ? 'online' : 'offline'}.`);

      // Emit the updated status (including lastSeen if offline) to all connected clients
      io.emit('userStatusUpdated', {
        userId,
        onlineStatus: isOnline,
        lastSeen: lastSeen || user.status.lastSeen // Send lastSeen if user is offline
      });
    }
  } catch (error) {
    console.error(`Error updating ${userRole} user's online status:`, error);
  }
};

module.exports = { toggleUserOnlineStatus };
