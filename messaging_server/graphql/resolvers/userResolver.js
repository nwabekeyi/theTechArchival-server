const userResolver = {
    Query: {
      getUser: async (_, { id }, { dataSources }) => {
        return dataSources.userAPI.getUserById(id);
      },
      getUsers: async (_, __, { dataSources }) => {
        return dataSources.userAPI.getAllUsers();
      },
    },
    Mutation: {
      createUser: async (_, { name, email, age }, { dataSources }) => {
        return dataSources.userAPI.createUser({ name, email, age });
      },
      updateUser: async (_, { id, name, email, age }, { dataSources }) => {
        return dataSources.userAPI.updateUser({ id, name, email, age });
      },
    },
  };
  
  module.exports = userResolver;
  