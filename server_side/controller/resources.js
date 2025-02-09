// controllers/resourceController.js

const Resource = require('../models/schema/resources');

// CREATE a new resource
const createResource = async (req, res) => {
  const { topic, resourceUrl } = req.body;

  if (!topic || !resourceUrl) {
    return res.status(400).json({ message: 'Topic and resourceUrl are required.' });
  }

  try {
    const newResource = new Resource({ topic, resourceUrl });
    const savedResource = await newResource.save();
    res.status(201).json(savedResource);
  } catch (error) {
    res.status(500).json({ message: 'Error saving resource', error });
  }
};

// GET all resources
const getAllResources = async (req, res) => {
  try {
    const resources = await Resource.find();
    res.json(resources);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching resources', error });
  }
};

// GET a resource by ID
const getResourceById = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found.' });
    }
    res.json(resource);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching resource', error });
  }
};

// UPDATE a resource
const updateResource = async (req, res) => {
  const { topic, resourceUrl } = req.body;

  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found.' });
    }

    if (topic) resource.topic = topic;
    if (resourceUrl) resource.resourceUrl = resourceUrl;

    const updatedResource = await resource.save();
    res.json(updatedResource);
  } catch (error) {
    res.status(500).json({ message: 'Error updating resource', error });
  }
};

// DELETE a resource
const deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found.' });
    }

    await resource.remove();
    res.status(204).send();  // No Content
  } catch (error) {
    res.status(500).json({ message: 'Error deleting resource', error });
  }
};

module.exports ={
    createResource,
    getAllResources,
    getResourceById,
    deleteResource,
    updateResource
}