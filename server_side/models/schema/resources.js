const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
    topic: {
      type: String,
      required: true
    },
    resourceUrl: {
      type: String,
      required: true
    }
  });
  
  // Create a Resource model
  const Resource = mongoose.model('Resource', resourceSchema);


module.exports = Resource;
