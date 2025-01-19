const { gql } = require('apollo-server-express');
const { ChatRoomMessages } = require('../../models/chatRoomMessages');  // Adjust path if needed

const chatRoomMessagesSchema = gql`
  # Message type includes sender as an object with multiple fields
  type Message {
    _id: ID
    chatroomName: String  # Now using chatroomName instead of chatroomId
    sender: Sender!        # Sender is an object with id, name, etc.
    message: String!
    timestamp: String!
    messageType: String!
    status: String!
    deliveredTo: [DeliveredReadUser]
    readBy: [DeliveredReadUser]
    replyTo: ReplyToMessage  # Updated replyTo to store both id and message content
  }

  # Sender type includes the sender's details like id, name, profile picture, and role
  type Sender {
    id: String!
    name: String!
    profilePictureUrl: String
    role: String!
  }

  # DeliveredReadUser type for the user who received or read the message
  type DeliveredReadUser {
    _id: ID!
    firstName: String!
    lastName: String!
    profilePictureUrl: String!
    timestamp: String!
  }

  # ReplyToMessage type to hold the original message's id and content
  type ReplyToMessage {
    id: ID
    message: String
  }

  # ChatroomMessages type includes chatroomName and messages
  type ChatroomMessages {
    _id: ID
    chatroomName: String!  # Using chatroomName instead of chatroomId
    messages: [Message]
  }

  # Subscription to listen for new messages in a chatroom
  type Subscription {
    messageAdded(chatroomName: String!): Message
  }

  # Queries for fetching messages based on chatroomName
  type Query {
    getMessageById(id: ID!): Message
    getMessagesByChatroom(chatroomName: String!): ChatroomMessages
  }

  # Mutations for sending, marking as read, and marking as delivered
  type Mutation {
    sendMessage(
      chatroomName: String!        # chatroomName is used as input (no chatroomId)
      sender: SenderInput!         # Sender details are passed as input
      message: String!
      messageType: String!
      status: String!
      deliveredTo: [DeliveredReadUserInput!]  # List of users to mark as delivered
      readBy: [DeliveredReadUserInput!]      # List of users to mark as read
      replyTo: ReplyToMessageInput  # The ID and message of the message being replied to (optional)
    ): Message  # Returns the Message object after mutation

    markAsRead(messageId: ID!, userId: ID!): Message
    markAsDelivered(messageId: ID!, userId: ID!): Message
  }

  # Input type for Sender (used in mutations)
  input SenderInput {
    id: String!
    name: String!
    profilePictureUrl: String
    role: String!
  }

  # Input type for DeliveredReadUser (used in mutations)
  input DeliveredReadUserInput {
    _id: ID!
    firstName: String!
    lastName: String!
    profilePictureUrl: String!
    timestamp: String!
  }

  # Input type for ReplyToMessage (used in mutations)
  input ReplyToMessageInput {
    id: ID!          # ID of the message being replied to
    message: String! # Content of the message being replied to
  }
`;

module.exports = chatRoomMessagesSchema;
