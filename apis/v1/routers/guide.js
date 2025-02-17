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

// Get All guides ka partial data id name,numver if steps , description.
router.get('/get-all-guides', async (req, res) => {
  try {
    const guides = await Guide.find({}, { name: 1, description: 1, guide_id: 1, steps: 1 });

    const formattedGuides = guides.map(guide => ({
      name: guide.name,
      description: guide.description,
      guide_id: guide.guide_id,
      number_of_steps: guide.steps?.length || 0 // Count steps safely
    }));

    res.status(200).json(formattedGuides);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// all info of guide by guide_id all details 
router.get('/guide-info', async (req, res) => {
  const { guide_id } = req.query; // Extract guide_id from query params
  console.log(guide_id);

  try {
    // Find the guide by guide_id and populate the steps with all their details
    const guide = await Guide.findOne({ guide_id }).populate({
      path: 'steps',
      model: 'Step', // Ensure correct model reference
    });

    if (!guide) {
      return res.status(404).json({ status: false, error: 'Guide not found' });
    }

    // Format response with all guide details, including steps
    const response = {
      status: true,
      guide: {
        id: guide.id,
        name: guide.name,
        description: guide.description,
        icon: guide.icon,
        welcome_audio: guide.welcome_audio,
        number_of_steps: guide.steps.length,
        steps: guide.steps.map((step) => ({
          id: step.id,
          name: step.name,
          description: step.description,
          welcome_audio: step.welcome_audio,
          created_at: step.created_at,
          updated_at: step.updated_at,
          placements: step.placements, // Since placements is an array
          contents: step.contents, // Includes type & link of each content item
        })),
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
    const { guide_id, name, description } = req.body;
    const iconPath = req.files['icon'][0].path; // Path to the uploaded icon file
    const welcomeAudioPath = req.files['welcome_audio'][0].path; // Path to the uploaded welcome audio file

    // Check if the guide_id already exists in the database
    const existingGuide = await Guide.findOne({ guide_id });
    if (existingGuide) {
      return res.status(400).json({
        status: false,
        message: `Guide ID ${guide_id} is already taken. Please choose a different ID.`,
      });
    }

    // Create a new guide with the provided guide_id
    const newGuide = new Guide({
      guide_id, // Use the guide_id provided by the user
      name,
      description,
      icon: iconPath,
      welcome_audio: welcomeAudioPath,
    });

    // Save the guide to the database
    await newGuide.save();

    // Return the response with the created guide details
    res.status(201).json({
      status: true,
      message: 'Guide created successfully',
      guide: {
        guide_id: newGuide.guide_id, // Return the guide_id
        name: newGuide.name,
        description: newGuide.description,
        icon: newGuide.icon,
        welcome_audio: newGuide.welcome_audio,
        updated_at: newGuide.updatedAt,
        created_at: newGuide.createdAt,
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