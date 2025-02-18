const express = require('express');
const mongoose = require('mongoose');

// Content Schema
const contentSchema = new mongoose.Schema({
  type: String,
  link: String,
  placement: String,
});

// Step Schema
const stepSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  contents: [contentSchema], // Embed content schema
});

// Guide Schema
const guideSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  steps: [stepSchema], // Embed step schema
});

// Guide Model
const Guide = mongoose.model('Guide', guideSchema);
module.exports = Guide;
