const Enquiry = require('../models/schema/enquiriesSchema');

// Controller to fetch all enquiries
const getEnquiries = async (req, res) => {
  try {
    const enquiries = await Enquiry.find().sort({ createdAt: -1 });
    res.status(200).json(enquiries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch enquiries' });
  }
};

// Controller to create a new enquiry
const postEnquiry = async (req, res) => {
    console.log('called')
  const { name, message, phoneNumber } = req.body;

  try {
    const enquiry = new Enquiry({ name, message, phoneNumber });
    await enquiry.save();
    res.status(201).json(enquiry);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create enquiry' });
  }
};

// Controller to toggle read status
const patchEnquiryReadStatus = async (req, res) => {
  const { id } = req.params;

  try {
    const enquiry = await Enquiry.findById(id);
    if (!enquiry) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }

    enquiry.read = !enquiry.read; // Toggle read status
    await enquiry.save();
    res.status(200).json(enquiry);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update enquiry status' });
  }
};

// Controller to delete an enquiry
const deleteEnquiry = async (req, res) => {
  const { id } = req.params;

  try {
    const enquiry = await Enquiry.findByIdAndDelete(id);
    if (!enquiry) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }
    res.status(200).json({ message: 'Enquiry deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete enquiry' });
  }
};

module.exports = {
  getEnquiries,
  postEnquiry,
  patchEnquiryReadStatus,
  deleteEnquiry,
};
