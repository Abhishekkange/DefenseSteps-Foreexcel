const mongoose = require('mongoose');

const StepSchema = new mongoose.Schema({
  guide_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Guide',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  welcome_audio: {
    type: String,
    default: '',
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
  placements: [
    {
      type: String,
      default: '',
    },
  ],
  contents: [
    {
      type: {
        type: String,
      },
      link: {
        type: String,
      },
    },
  ],
});

const Step = mongoose.model('Step', StepSchema);
module.exports = Step;