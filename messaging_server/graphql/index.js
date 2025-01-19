const { makeExecutableSchema } = require('@graphql-tools/schema');
const { merge } = require('lodash');

// Import all type definitions (schemas)
const userSchema = require('./schemas/userSchema');
const messageSchema = require('./schemas/messageSchema');
const chatRoomMessagesSchema = require('./schemas/chatRoomMessages')
const chatroomSchema = require('./schemas/chatRoom')
// Import all resolvers
const userResolver = require('./resolvers/userResolver');
const chatroomResolver = require('./resolvers/chatroomResolver');
const messageResolver = require('./resolvers/messageResolver');
const chatRoomMessagesResolvers = require('./resolvers/chatRoomMessages')

// Combine all type definitions
const typeDefs = [userSchema, messageSchema, chatRoomMessagesSchema, chatroomSchema];

// Combine all resolvers using lodash.merge to avoid conflicts
const resolvers = merge(userResolver,  messageResolver, chatRoomMessagesResolvers, chatroomResolver);

// Create executable schema
const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

module.exports = schema;
