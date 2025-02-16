const express = require('express');
const router = express.Router();
const Guide = require('../models/Guide'); // Import the Guide model

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
router.get('/guide-info/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const guide = await Guide.findById(id).populate('steps');
    if (!guide) {
      return res.status(404).json({ error: 'Guide not found' });
    }
    res.status(200).json(guide);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add a New Guide (POST)
router.post('/add-guide', async (req, res) => {
  const { name, description } = req.body;

  try {
    const guide = new Guide({ name, description });
    await guide.save();
    res.status(201).json({ message: 'Guide created successfully', id: guide._id });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Edit Guide by ID (POST)
router.post('/edit-guide/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, icon, welcome_audio } = req.body;

  try {
    const guide = await Guide.findById(id);
    if (!guide) {
      return res.status(404).json({ error: 'Guide not found' });
    }

    // Update guide fields
    if (name) guide.name = name;
    if (description) guide.description = description;
    if (icon) guide.icon = icon;
    if (welcome_audio) guide.welcome_audio = welcome_audio;

    await guide.save();
    res.status(200).json({ message: 'Guide updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete Guide by ID
router.delete('/delete-guide/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const guide = await Guide.findByIdAndDelete(id);
    if (!guide) {
      return res.status(404).json({ error: 'Guide not found' });
    }
    res.status(200).json({ message: 'Guide deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;