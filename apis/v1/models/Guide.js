const mongoose = require('mongoose');

// Define the Guide schema
const GuideSchema = new mongoose.Schema({
  guide_id: {
    type: Number,
    unique: true, // Ensure guide_id is unique
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  icon: {
    type: String,
    default: '',
  },
  welcome_audio: {
    type: String,
    default: '',
  },
  steps: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Step', // This references the 'Step' model
    },
  ],
});

const Guide = mongoose.model('Guide', GuideSchema);

module.exports = Guide;