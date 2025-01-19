// schemas/chatroomSchema.js

const { gql } = require('apollo-server-express');

const chatroomSchema = gql`
  type Participant {
    userId: ID!
    firstName: String!
    lastName: String!
    profilePictureUrl: String!
  }

  type Chatroom {
    id: ID!
    name: String!
    avatarUrl: String
    participants: [Participant]
    createdAt: String!
    updatedAt: String!
  }

  type Query {
    getChatroom(name: String!): Chatroom
    getChatrooms: [Chatroom!]!
  }

  type Mutation {
    createChatroom(name: String!, avatarUrl: String, participants: [ParticipantInput!]!): Chatroom!
    updateAvatar(chatroomName: String!, avatarUrl: String!): Chatroom!
    addParticipant(chatroomName: String!, userId: ID!, firstName: String!, lastName: String!, profilePictureUrl: String!): Chatroom!
  }

  input ParticipantInput {
    userId: ID!
    firstName: String!
    lastName: String!
    profilePictureUrl: String!
  }
`;

module.exports = chatroomSchema;
