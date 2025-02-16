const mongoose = require('mongoose');

const GuideSchema = new mongoose.Schema({
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
      ref: 'Step',
    },
  ],
});

const Guide = mongoose.model('Guide', GuideSchema);
module.exports = Guide;