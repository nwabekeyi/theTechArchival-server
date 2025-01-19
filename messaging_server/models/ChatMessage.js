const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const personalMessageSchema = new Schema({
  userId: { type: String, required: true },
  senders: {
    type: Map,
    of: {
      sender: {
        userId: {
          type: String,
          required: true,
        },
        firstName: {
          type: String,
          required: true,
        },
        lastName: {
          type: String,
          required: true,
        },
        profilePictureUrl: {
          type: String, 
        },
      },
      messages: [
        {
          message: {
            type: String,
            required: true,
          },
          timestamp: {
            type: Date,
            default: Date.now,
          },
          messageType: {
            type: String,
            enum: ['text', 'image', 'video', 'file'],
            default: 'text',
          },
          status: {
            type: String,
            enum: ['sent', 'delivered', 'read'],
            default: 'sent',
          },
          replyingTo: {
            type: {
              _id: {
                type: Schema.Types.ObjectId,
              },
              message: {
                type: String,
                required: true,
              },
            },
            default: null,
          },
        },
      ],
    },
  },
});

module.exports = mongoose.model('PersonalMessage', personalMessageSchema);
