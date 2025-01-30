const { watchChatrooms } = require('../models/ChatRoom');
const {fetchChatroomsAndCache} = require('../redis/redisCaches')
const { waitForBothDbs} = require('../config/mongo')


// Fetch chatrooms once when the server starts and cache them in Redis
const initializeChatroomsCache = async () => {
    try {
      await fetchChatroomsAndCache();  // Fetch and cache chatrooms
      console.log("Chatrooms cached successfully.");
    } catch (error) {
      console.error('Error fetching and caching chatrooms on server start:', error);
    }
  };


// Periodically re-fetch chatrooms every 15 minutes
const scheduleCacheRefresh = () => {
    setInterval(async () => {
      console.log('Refreshing chatrooms cache...');
      await fetchChatroomsAndCache();
    }, 900000); // Every 15 minutes
  };
  
  // Watch for changes in chatrooms and reinitialize cache on updates
  const monitorChatroomChanges = () => {
    watchChatrooms()
      .then(() => {
        console.log("Watching chatroom changes...");
        // Reinitialize cache if watchChatrooms returns true (i.e., on a change)
        fetchChatroomsAndCache();
    })
      .catch((error) => {
        console.error('Error watching chatroom changes:', error);
      });
  };
  

   // Function to wait for DB connections and then call the other functions
async function startCache() {
  const dbReady = await waitForBothDbs();
  if (dbReady) {
    console.log("Both databases are connected.");
    // Now that both DBs are connected, call the other functions
    initializeChatroomsCache();
    monitorChatroomChanges();
    scheduleCacheRefresh();
  }
};



  module.exports ={ 
    startCache
}