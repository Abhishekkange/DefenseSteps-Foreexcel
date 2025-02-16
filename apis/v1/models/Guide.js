const mongoose = require('mongoose');

// Define a counter schema to keep track of the last used guide_id
const CounterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // Collection name
  sequence_value: { type: Number, default: 0 }, // Last used guide_id
});

const Counter = mongoose.model('Counter', CounterSchema);

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

// Pre-save middleware to auto-increment guide_id
GuideSchema.pre('save', async function (next) {
  if (!this.guide_id) {
    // If guide_id is not set, generate the next value
    const counter = await Counter.findByIdAndUpdate(
      { _id: 'guide_id' }, // Use a fixed ID for the counter
      { $inc: { sequence_value: 1 } }, // Increment the sequence_value
      { new: true, upsert: true } // Create the counter if it doesn't exist
    );
    this.guide_id = counter.sequence_value; // Set the guide_id to the incremented value
  }
  next();
});

const Guide = mongoose.model('Guide', GuideSchema);
module.exports = Guide;