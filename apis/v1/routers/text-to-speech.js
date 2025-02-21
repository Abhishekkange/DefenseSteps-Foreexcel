const express = require('express');
const mongoose = require('mongoose');
const MyModel = require('../models/audio'); 


const router = express.Router();

// List of available audio file links
const audioLinks = [
  'https://example.com/audio1.mp3',
  'https://example.com/audio2.mp3',
  'https://example.com/audio3.mp3'
];

router.post('/text-to-speech', async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text field is required' });
  }

  try {
    // Select a random audio link
    const randomLink = audioLinks[Math.floor(Math.random() * audioLinks.length)];

    // Store in MongoDB
    const newEntry = new MyModel({ text, link: randomLink });
    await newEntry.save();

    res.status(200).json({ message: 'Text-to-speech entry created', link: randomLink });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;