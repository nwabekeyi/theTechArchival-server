const { gql } = require('apollo-server-express');

const messageSchema = gql`
  type Sender {
    userId: String!
    firstName: String!
    lastName: String!
    profilePictureUrl: String
  }

  # MessageReply remains as an Output Type (type) for response
  type MessageReply {
    _id: String
    message: String!
  }

  # MessageReply is used as an output type here for replyingTo in Message
  type Message {
    message: String!
    timestamp: String!
    messageType: String!
    status: String!
    replyingTo: MessageReply
  }

  type SenderMessages {
    sender: Sender!
    messages: [Message]
  }

  type PersonalMessage {
    userId: String!
    senders: [SenderMessages]
  }

  type Query {
    getPersonalMessages(userId: String!, senderId: String!): PersonalMessage
  }

  type Mutation {
    initiateSenderDetails(
      userId: String!
      firstName: String!
      lastName: String!
      profilePictureUrl: String
    ): PersonalMessage

    sendMessageToSender(
      userId: String!
      senderId: String!
      message: String!
      messageType: String
      status: String
      replyingTo: MessageReplyInput # Update to use MessageReplyInput for mutation
    ): PersonalMessage
  }

  # Use MessageReplyInput as an input type in mutation arguments
  input MessageReplyInput {
    _id: String
    message: String!
  }
`;

module.exports = messageSchema;
