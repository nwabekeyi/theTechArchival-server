// routes/resourceRoutes.js

const express = require('express');
const router = express.Router();
const resourceController = require('../controller/resources');

// Route for creating a new resource
router.post('/api/v1/resources', resourceController.createResource);

// Route for getting all resources
router.get('/api/v1/resources', resourceController.getAllResources);

// Route for getting a specific resource by ID
router.get('/api/v1/resources/:id', resourceController.getResourceById);

// Route for updating a resource by ID
router.put('/api/v1/resources/:id', resourceController.updateResource);

// Route for deleting a resource by ID
router.delete('/api/v1/resources/:id', resourceController.deleteResource);

module.exports = router;
