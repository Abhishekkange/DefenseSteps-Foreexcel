const express = require('express');
const router = express.Router();
const Guide = require('../models/Guide'); // Import the Guide model
const Step = require('../models/Step')
const multer = require('multer');
const path = require('path');
const GuideEdit = require('../models/GuideEdit')

const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, 'abhishek'); // Replace with process.env.JWT_SECRET
    req.user = decoded; // Store decoded user info in req.user
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

module.exports = authMiddleware;

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
// Request Guide Edit API
router.post('/request-guide-edit/:guideId', authMiddleware, async (req, res) => {
  try {
    const { guideId } = req.params;
    const userId = req.user._id; // Extract user ID from JWT token
    const newGuideData = req.body;

    // Fetch existing guide
    const existingGuide = await Guide.findById(guideId);
    if (!existingGuide) {
      return res.status(404).json({ error: 'Guide not found' });
    }

    // Compare changes while ignoring 'placement'
    const updatedFields = {};
    const { steps: newSteps, placement, ...otherUpdates } = newGuideData; // Exclude placement

    // Handle non-step fields (ignoring placement)
    Object.keys(otherUpdates).forEach(key => {
      if (JSON.stringify(existingGuide[key]) !== JSON.stringify(otherUpdates[key])) {
        updatedFields[key] = otherUpdates[key];
      }
    });

    // Handle Step Updates
    if (newSteps) {
      const updatedSteps = [];
      const removedSteps = [];
      const addedSteps = [];

      const existingSteps = existingGuide.steps.map(step => step._id.toString());
      const newStepIds = newSteps.map(step => step._id?.toString()).filter(id => id);

      // Identify Removed Steps
      removedSteps.push(...existingSteps.filter(id => !newStepIds.includes(id)));

      // Identify Added Steps (steps without an _id)
      addedSteps.push(...newSteps.filter(step => !step._id));

      // Identify Modified Steps (excluding placement field)
      newSteps.forEach(newStep => {
        if (newStep._id) {
          const oldStep = existingGuide.steps.find(s => s._id.toString() === newStep._id);
          if (oldStep) {
            const stepChanges = {};
            Object.keys(newStep).forEach(field => {
              if (field !== "placement" && JSON.stringify(newStep[field]) !== JSON.stringify(oldStep[field])) {
                stepChanges[field] = newStep[field];
              }
            });

            if (Object.keys(stepChanges).length > 0) {
              updatedSteps.push({ step_id: newStep._id, updated_values: stepChanges });
            }
          }
        }
      });

      // Store Step Changes in updatedFields
      if (updatedSteps.length || removedSteps.length || addedSteps.length) {
        updatedFields.steps = {};
        if (updatedSteps.length) updatedFields.steps.updatedSteps = updatedSteps;
        if (removedSteps.length) updatedFields.steps.removedSteps = removedSteps;
        if (addedSteps.length) updatedFields.steps.addedSteps = addedSteps;
      }
    }

    // If No Changes Detected
    if (Object.keys(updatedFields).length === 0) {
      return res.status(400).json({ message: "No changes detected" });
    }

    // Save Edit Request
    const guideEdit = new GuideEdit({
      guide_id: guideId,
      user_id: userId, // User ID from token
      updated_fields: updatedFields
    });

    await guideEdit.save();
    res.json({ message: "Edit request created", edit_id: guideEdit._id, status: "pending" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

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

    // Fetch the original guide
    const guide = await Guide.findById(editRequest.guide_id);
    if (!guide) return res.status(404).json({ error: 'Guide not found' });

    // Apply top-level field changes
    Object.keys(editRequest.updated_fields).forEach(key => {
      if (key !== "steps") {
        guide[key] = editRequest.updated_fields[key];
      }
    });

    // Apply step-level updates
    if (editRequest.updated_fields.steps) {
      const { updatedSteps, removedSteps, addedSteps } = editRequest.updated_fields.steps;

      // Process step updates
      if (updatedSteps) {
        updatedSteps.forEach(update => {
          let step = guide.steps.id(update.step_id);
          if (step) {
            Object.keys(update.updated_values).forEach(field => {
              step[field] = update.updated_values[field];
            });
          }
        });
      }

      // Process step removals
      if (removedSteps) {
        guide.steps = guide.steps.filter(step => !removedSteps.includes(step._id.toString()));
      }

      // Process step additions
      if (addedSteps) {
        guide.steps.push(...addedSteps);
      }
    }

    // Save updated guide
    await guide.save();

    // Mark edit request as approved
    editRequest.status = 'approved';
    await editRequest.save();

    res.json({ message: "Edit approved and applied to the guide", guide_id: guide._id, status: "approved" });

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