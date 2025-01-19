const express = require('express');
const router = express.Router();
const {
  postAssignment,
  updateAssignment,
  deleteAssignment,
  getAssignment,
  addSubmission,
  getAllAssignments
} = require('../controller/assignmentController');
const {uploadFiles} = require('../middleware/multer')

// Assignment routes
router.get('/api/v1/assignments/:cohortName', getAllAssignments);
router.post('/api/v1/assignments/:cohortName', postAssignment);
router.put('/api/v1/assignments/:cohortName/:assignmentId', updateAssignment);
router.delete('/api/v1/assignments/:cohortName/:assignmentId', deleteAssignment);
router.get('/api/v1/assignments/:cohortName/:assignmentId', getAssignment);
router.patch('/api/v1/assignments/submissions/:cohortName/:assignmentId', uploadFiles, addSubmission);

module.exports = router;