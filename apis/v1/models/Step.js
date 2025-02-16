const mongoose = require('mongoose');

const StepSchema = new mongoose.Schema({
  guide_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Guide',
    required: true,
  },
  step_name: {
    type: String,
    required: true,
  },
  step_description: {
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
  content: [
    {
      link: String,
      content_type: Number, // 0 for icon, 1 for welcome audio, 2 for normal content
      pos_x: Number,
      pos_y: Number,
      pos_z: Number,
      rot_x: Number,
      rot_y: Number,
      rot_z: Number,
    },
  ],
});

const Step = mongoose.model('Step', StepSchema);
module.exports = Step;