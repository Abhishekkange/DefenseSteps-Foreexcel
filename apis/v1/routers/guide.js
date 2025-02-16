const express = require('express');
const router = express.Router();
const Guide = require('../models/Guide'); // Import the Guide model
const Step = require('../models/Step')
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Save files in the 'uploads' directory
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // Generate unique filenames
  },
});

const upload = multer({ storage });

// Get All Guides
router.get('/guides', async (req, res) => {
  try {
    const guides = await Guide.find({}, { name: 1, description: 1, icon: 1, welcome_audio: 1, _id: 1 });
    res.status(200).json(guides);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get Guide Info by ID
router.get('/guide-info/:guide_id', async (req, res) => {
  const { guide_id } = req.params;

  try {
    // Find the guide by the numeric guide_id
  
    const guide = await Guide.findOne({ guide_id: guide_id }).populate('Step');
    if (!guide) {
      return res.status(404).json({ status: false, error: 'Guide not found' });
    }

    // Format the response
    const response = {
      status: true,
      guide: {
        id: guide.id,
        name: guide.name,
        description: guide.description,
        icon: guide.icon,
        welcome_audio: guide.welcome_audio,
        created_at: guide.created_at.toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }),
        updated_at: guide.updated_at.toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }),
        number_of_steps: guide.steps.length,
      },
    };

    res.status(200).json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: false, error: 'Server error' });
  }
});



router.post('/add-guide', upload.fields([
  { name: 'icon', maxCount: 1 },
  { name: 'welcome_audio', maxCount: 1 },
]), async (req, res) => {
  try {
    const { name, description } = req.body;
    const iconPath = req.files['icon'][0].path; // Path to the uploaded icon file
    const welcomeAudioPath = req.files['welcome_audio'][0].path; // Path to the uploaded welcome audio file

    // Create a new guide
    const newGuide = new Guide({
      name,
      description,
      icon: iconPath,
      welcome_audio: welcomeAudioPath,
    });

    // Save the guide to the database
    await newGuide.save();

    // Return the response
    res.status(201).json({
      status: true,
      message: 'Guide created successfully',
      guide: {
        name: newGuide.name,
        description: newGuide.description,
        icon: newGuide.icon,
        welcome_audio: newGuide.welcome_audio,
        updated_at: newGuide.updatedAt,
        created_at: newGuide.createdAt,
        id: newGuide.guide_id,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: false, message: 'Server error' });
  }
});
// Edit Guide by ID (POST)
router.post('/edit-guide/:guide_id', upload.fields([
  { name: 'icon', maxCount: 1 },
  { name: 'welcome_audio', maxCount: 1 },
]), async (req, res) => {
  try {
    const { guide_id } = req.params; // Get guide_id from URL parameters
    const { name, description } = req.body; // Get updated fields from request body
    const iconFile = req.files['icon'] ? req.files['icon'][0] : null; // Check if icon file is uploaded
    const welcomeAudioFile = req.files['welcome_audio'] ? req.files['welcome_audio'][0] : null; // Check if welcome_audio file is uploaded

    // Find the guide by guide_id
    const guide = await Guide.findOne({ guide_id });
    if (!guide) {
      return res.status(404).json({ status: false, message: 'Guide not found' });
    }

    // Update the guide fields
    if (name) guide.name = name;
    if (description) guide.description = description;
    if (iconFile) guide.icon = iconFile.path; // Update icon path if a new file is uploaded
    if (welcomeAudioFile) guide.welcome_audio = welcomeAudioFile.path; // Update welcome_audio path if a new file is uploaded

    // Save the updated guide
    await guide.save();

    // Return the response
    res.status(200).json({
      status: true,
      message: 'Guide updated successfully',
      guide: {
        id: guide.guide_id,
        name: guide.name,
        description: guide.description,
        icon: guide.icon,
        welcome_audio: guide.welcome_audio,
        updated_at: guide.updatedAt, // Correctly returning the updated_at timestamp
        created_at: guide.createdAt, // Keeping the created_at field
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: false, message: 'Server error' });
  }
});


// Delete Guide by ID
// Endpoint to delete a guide by guide_id
router.post('/delete-guide/:guide_id', async (req, res) => {
  try {
    const { guide_id } = req.params; // Get guide_id from URL parameters

    // Find the guide by guide_id and delete it
    const deletedGuide = await Guide.findOneAndDelete({ guide_id });

    if (!deletedGuide) {
      return res.status(404).json({ status: false, message: 'Guide not found' });
    }

    // Return success response
    res.status(200).json({
      status: true,
      message: 'Guide deleted successfully'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: false, message: 'Server error' });
  }
});


module.exports = router;