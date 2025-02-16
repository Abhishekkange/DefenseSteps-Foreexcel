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
  contents: [
    {
      type: {
        type: String,
        required: true,
      },
      link: {
        type: String,
        required: true,
      },
      position: {
        x: { type: Number, default: 0 },
        y: { type: Number, default: 0 },
        z: { type: Number, default: 0 },
      },
      rotations: {
        x: { type: Number, default: 0 },
        y: { type: Number, default: 0 },
        z: { type: Number, default: 0 },
      },
    },
  ],
});

const Step = mongoose.model('Step', StepSchema);
module.exports = Step;