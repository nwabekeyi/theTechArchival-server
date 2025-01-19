const mongoose = require("mongoose");
const dotenv = require('../configs/dotenv');


const localUri = dotenv.MONGO_URI;
const dbConnection = async () => {
  try {
    await mongoose.connect(localUri);
    console.log("db successfully connected");
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

module.exports =  dbConnection ;
