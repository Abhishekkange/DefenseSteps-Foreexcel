const express = require('express');
const router = express.Router();
const Guide = require('../models/Guide'); // Import the Guide model
const Step = require('../models/Step')
const multer = require('multer');
const path = require('path');
const GuideEdit = require('../models/GuideEdit')

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
    const guides = await Guide.find({}, '_id name description steps created_at updated_at');

    // Transform the response to include step count
    const formattedGuides = guides.map(guide => ({
      _id: guide._id,
      name: guide.name,
      description: guide.description,
      steps_count: guide.steps.length, // Number of steps
      created_at: guide.created_at,
      updated_at: guide.updated_at
    }));

    res.status(200).json({ guides: formattedGuides });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// all info of guide by guide_id all details 
// Get Guide by ID
router.get('/guide-info', async (req, res) => {
  try {
    const { id } = req.query; // Get the guide ID from query parameters

    if (!id) {
      return res.status(400).json({ status: false, message: 'Guide ID is required' });
    }

    // Fetch guide from MongoDB
    const guide = await Guide.findById(id);

    if (!guide) {
      return res.status(404).json({ status: false, message: 'Guide not found' });
    }

    res.status(200).json({
      status: true,
      guide,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: 'Internal server error' });
  }
});


// Add Guide Route
router.post('/add-guide', async (req, res) => {
  try {
    const { name, description, steps } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    // Create a new guide document
    const newGuide = new Guide({
      name,
      description,
      steps,
    });

    // Save the guide to MongoDB
    await newGuide.save();

    res.status(201).json({ message: 'Guide added successfully', guide: newGuide });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Edit Guide by ID (POST)
router.get('/edit-guide/:id', async (req, res) => {
  try {
    const { id } = req.params; // Extract _id from the URL parameter

    // Find the guide by _id
    const guide = await Guide.findById(id);

    // If guide not found, return 404
    if (!guide) {
      return res.status(404).json({ message: 'Guide not found' });
    }

    // Return the guide document
    res.status(200).json({ message: 'Guide fetched successfully', guide });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 📌 1. Create an Edit Request
router.post('/request-guide-edit/:guideId', async (req, res) => {
  try {
    const { guideId } = req.params;
    const userId = req.body.user_id; // Assume user_id is sent in the request
    const newGuideData = { ...req.body };
    delete newGuideData.user_id; // Remove user_id from comparison

    // Fetch existing guide
    const existingGuide = await Guide.findById(guideId);
    if (!existingGuide) return res.status(404).json({ error: 'Guide not found' });

    // Compare changes (only store modified fields)
    const updatedFields = {};
    Object.keys(newGuideData).forEach(key => {
      if (JSON.stringify(existingGuide[key]) !== JSON.stringify(newGuideData[key])) {
        updatedFields[key] = newGuideData[key];
      }
    });

    // If no changes detected
    if (Object.keys(updatedFields).length === 0) {
      return res.status(400).json({ message: "No changes detected" });
    }

    // Save edit request
    const guideEdit = new GuideEdit({
      guide_id: guideId,
      user_id: userId,
      updated_fields: updatedFields
    });

    await guideEdit.save();
    res.json({ message: "Edit request created", edit_id: guideEdit._id, status: "pending" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📌 2. Fetch All Pending Edits (Admin)
router.get('/pending-edits', async (req, res) => {
  try {
    const pendingEdits = await GuideEdit.find({ status: 'pending' });
    res.json(pendingEdits);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📌 3. Approve an Edit Request
router.post('/approve-edit/:editId', async (req, res) => {
  try {
    const editRequest = await GuideEdit.findById(req.params.editId);
    if (!editRequest) return res.status(404).json({ error: 'Edit request not found' });

    // Apply changes to Guide
    await Guide.findByIdAndUpdate(editRequest.guide_id, { $set: editRequest.updated_fields });

    // Update the edit request status
    editRequest.status = 'approved';
    await editRequest.save();

    res.json({ message: "Edit approved and applied to the guide", guide_id: editRequest.guide_id, status: "approved" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.post('/edit-guide/:id', async (req, res) => {
  try {
    const { id } = req.params; // Extract _id from the URL parameter
    const { guide_id, name, description, steps } = req.body; // Extract updated data from the request body

  

    // Find the guide by _id and update it
    const oldGuide = await Guide.findById(id);

if (!oldGuide) {
  return res.status(404).json({ message: "Guide not found" });
}

// Merge the old placement data with the new update request
const updatedSteps = steps.map((newStep) => {
  const oldStep = oldGuide.steps.find((s) => s._id.toString() === newStep._id);

  if (!oldStep) return newStep; // If step doesn't exist in old guide, keep the new one

  return {
    ...newStep,
    contents: newStep.contents.map((newContent) => {
      const oldContent = oldStep.contents.find(
        (c) => c._id.toString() === newContent._id
      );

      if (!oldContent) return newContent; // If content is new, use it directly

      return {
        ...newContent,
        placement: oldContent.placement, // Preserve the old placement
      };
    }),
  };
});

const updatedGuide = await Guide.findByIdAndUpdate(
  id,
  {
    name,
    description,
    steps: updatedSteps,
  },
  { new: true } // Return the updated document
);

    // If guide not found, return 404
    if (!updatedGuide) {
      return res.status(404).json({ message: 'Guide not found' });
    }

    // Return the updated guide document
    res.status(200).json({ message: 'Guide updated successfully', guide: updatedGuide });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Duplicate guide_id. guide_id must be unique.' });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
});


// Endpoint to delete a guide by guide_id
router.post('/delete-guide/:guide_id', async (req, res) => {
  try {
    const { guide_id } = req.params; // Get guide_id from URL parameters

    // Find the guide by guide_id and delete it
    const deletedGuide = await Guide.findOneAndDelete({ _id: guide_id });

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

router.post('/edit-annotation', async (req, res) => {
    try {
      const { guide_id, step_id, annotation } = req.body;
  
      if (!guide_id || !step_id || !annotation) {
        return res.status(400).json({ message: 'guide_id, step_id, and annotation are required' });
      }

      // Find the guide and update the specific step's annotation
      const updatedGuide = await Guide.findOneAndUpdate(
        { _id: guide_id, "steps._id": step_id },
        { $set: { "steps.$.annotations": annotation } },
        { new: true }
      );
  
      if (!updatedGuide) {
        return res.status(404).json({ message: 'Guide or Step not found' });
      }
  
      res.json({ message: 'Annotation updated successfully', updatedGuide });
    } catch (error) {
      console.error('Error updating annotation:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  router.post('/reject-guide-edit/:editId', async (req, res) => {
    try {
      const { editId } = req.params;
  
      // Find and update the guide edit request status
      const guideEdit = await GuideEdit.findByIdAndUpdate(editId, { status: "rejected" }, { new: true });
      if (!guideEdit) return res.status(404).json({ error: "Edit request not found" });
  
      res.json({ message: "Guide edit request rejected", edit_id: guideEdit._id });
  
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  



module.exports = router;