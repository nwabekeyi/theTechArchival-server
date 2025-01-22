const mongoose = require('mongoose');
const { db1Connection } = require("../config/mongo");

// Admin Schema
const adminSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  role: { type: String, default: 'admin' },
  createdAt: { type: String, default: new Date().toISOString() },
  updatedAt: { type: String, default: new Date().toISOString() },
  idCardUrl: { type: String, default: '' },
  notifications: [
    {
      message: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      type: { type: String, enum: ['info', 'warning', 'error', 'success'], default: 'info' },
      recipient: { type: mongoose.Schema.Types.ObjectId, required: true },
      readStatus: { type: Boolean, default: false },
      priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
      actionLink: { type: String, default: '' },
      source: { type: String, ref: 'User' },
      isDeleted: { type: Boolean, default: false }
    }
  ],
  messages: [
    {
      delivered: { type: Boolean, default: false },
      isSentByUser: { type: Boolean, default: false },
      message: { type: String, required: true },
      read: { type: Boolean, default: false },
      receiver: { type: Map, of: String },
      sender: { type: Map, of: String },
      timestamp: { type: String, required: true }
    }
  ],
  userId: { type: String, unique: true },
  profilePictureUrl: { type: String, required: true },
  status: {
    onlineStatus: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now }
  }
});

// // Indexes for Admin Schema
// adminSchema.index({ email: 1 }, { unique: true });
// adminSchema.index({ userId: 1 });
// adminSchema.index({ 'notifications.recipient': 1, 'notifications.readStatus': 1 });
// adminSchema.index({ 'messages.receiver': 1, 'messages.read': 1 });

// SuperAdmin Schema (similar to Admin)
const superAdminSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  role: { type: String, default: 'superadmin' },
  createdAt: { type: String, default: new Date().toISOString() },
  updatedAt: { type: String, default: new Date().toISOString() },
  idCardUrl: { type: String, default: '' },
  notifications: [
    {
      message: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      type: { type: String, enum: ['info', 'warning', 'error', 'success'], default: 'info' },
      recipient: { type: mongoose.Schema.Types.ObjectId, required: true },
      readStatus: { type: Boolean, default: false },
      priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
      actionLink: { type: String, default: '' },
      source: { type: String, ref: 'User' },
      isDeleted: { type: Boolean, default: false }
    }
  ],
  messages: [
    {
      delivered: { type: Boolean, default: false },
      isSentByUser: { type: Boolean, default: false },
      message: { type: String, required: true },
      read: { type: Boolean, default: false },
      receiver: { type: Map, of: String },
      sender: { type: Map, of: String },
      timestamp: { type: String, required: true }
    }
  ],
  userId: { type: String, unique: true },
  profilePictureUrl: { type: String, required: true },
  status: {
    onlineStatus: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now }
  }
});

// // Indexes for SuperAdmin Schema
// superAdminSchema.index({ email: 1 }, { unique: true });
// superAdminSchema.index({ userId: 1 });
// superAdminSchema.index({ 'notifications.recipient': 1, 'notifications.readStatus': 1 });
// superAdminSchema.index({ 'messages.receiver': 1, 'messages.read': 1 });

// Instructor Schema
const instructorSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  profilePictureUrl: { type: String, required: true },
  idCardUrl: { type: String, default: '' },
  instructorId: { type: String, required: true, unique: true },
  averageRating: { type: Number, default: 0 },
  program: { type: String, required: true },
  studentsAssigned: { type: [String], default: [] },
  timeTable: { type: [String], default: [] },
  role: { type: String, default: 'instructor' },
  notifications: [
    {
      message: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      type: { type: String, enum: ['info', 'warning', 'error', 'success'], default: 'info' },
      recipient: { type: mongoose.Schema.Types.ObjectId, required: true },
      readStatus: { type: Boolean, default: false },
      priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
      actionLink: { type: String, default: '' },
      source: { type: String, ref: 'User' },
      isDeleted: { type: Boolean, default: false }
    }
  ],
  messages: [
    {
      delivered: { type: Boolean, default: false },
      isSentByUser: { type: Boolean, default: false },
      message: { type: String, required: true },
      read: { type: Boolean, default: false },
      receiver: { type: Map, of: String },
      sender: { type: Map, of: String },
      timestamp: { type: String, required: true }
    }
  ],
  userId: { type: String, unique: true },
  createdAt: { type: String, default: new Date().toISOString() },
  updatedAt: { type: String, default: new Date().toISOString() },
  cohort: { type: String, default: '' },
  reviews: [
    {
      userId: { type: String, required: true },
      reviewText: { type: String, required: true },
      rating: { type: Number, required: true, min: 1, max: 5 },
      createdAt: { type: String, default: new Date().toISOString() }
    }
  ],
  rating: { type: Number, default: 0 },
  status: {
    onlineStatus: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now }
  }
});

// // Indexes for Instructor Schema
// instructorSchema.index({ email: 1 }, { unique: true });
// instructorSchema.index({ userId: 1 });
// instructorSchema.index({ 'notifications.recipient': 1, 'notifications.readStatus': 1 });
// instructorSchema.index({ 'messages.receiver': 1, 'messages.read': 1 });
// instructorSchema.index({ instructorId: 1 });

// Student Schema
const studentSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  profilePictureUrl: { type: String, required: true },
  idCardUrl: { type: String, default: '' },
  studentId: { type: String, required: true, unique: true },
  averageRating: { type: Number, default: 0 },
  cohort: { type: String, default: '' },
  program: { type: String, default: '' },
  emergencyContactName: { type: String, required: true },
  emergencyContactRelationship: { type: String, required: true },
  emergencyContactPhone: { type: String, required: true },
  role: { type: String, default: 'student' },
  notifications: [
    {
      message: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      type: { type: String, enum: ['info', 'warning', 'error', 'success'], default: 'info' },
      recipient: { type: mongoose.Schema.Types.ObjectId, required: true },
      readStatus: { type: Boolean, default: false },
      priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
      actionLink: { type: String, default: '' },
      source: { type: String, ref: 'User' },
      isDeleted: { type: Boolean, default: false }
    }
  ],
  messages: [
    {
      delivered: { type: Boolean, default: false },
      isSentByUser: { type: Boolean, default: false },
      message: { type: String, required: true },
      read: { type: Boolean, default: false },
      receiver: { type: Map, of: String },
      sender: { type: Map, of: String },
      timestamp: { type: String, required: true }
    }
  ],
  userId: { type: String, unique: true },
  createdAt: { type: String, default: new Date().toISOString() },
  updatedAt: { type: String, default: new Date().toISOString() },
  status: {
    onlineStatus: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now }
  }
});

// // Indexes for Student Schema
// studentSchema.index({ email: 1 }, { unique: true });
// studentSchema.index({ userId: 1 });
// studentSchema.index({ 'notifications.recipient': 1, 'notifications.readStatus': 1 });
// studentSchema.index({ 'messages.receiver': 1, 'messages.read': 1 });
// studentSchema.index({ studentId: 1 });

// Export the schemas
const Admin = db1Connection.model('Admin', adminSchema);
const SuperAdmin = db1Connection.model('SuperAdmin', superAdminSchema);
const Instructor = db1Connection.model('Instructor', instructorSchema);
const Student = db1Connection.model('Student', studentSchema);

module.exports = { Admin, SuperAdmin, Instructor, Student };
