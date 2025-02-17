const express = require('express');
const router = express.Router();
const Guide = require('../models/Guide');

router.post('/add-content', async (req, res) => {
    try {
        const { guide_id, step_id, type, placement, link } = req.body;

        if (!guide_id || !step_id || !type || !placement || !link) {
            return res.status(400).json({ status: false, message: 'guide_id, step_id, type, placement, and link are required' });
        }

        // Find the guide and populate its steps
        const guide = await Guide.findOne({ guide_id }).populate('steps');
        if (!guide) {
            return res.status(404).json({ status: false, message: 'Guide not found' });
        }

        // Validate step_id within the guide's steps list
        if (step_id < 1 || step_id > guide.steps.length) {
            return res.status(400).json({ status: false, message: 'Invalid step_id' });
        }

        // Get the correct step
        const step = guide.steps[step_id - 1];

        if (!step) {
            return res.status(404).json({ status: false, message: 'Step not found' });
        }

        // Create a new content object
        const newContent = {
            type,
            placement,
            link,
        };

        // Add the content object to the contents array
        step.contents.push(newContent);

        step.updated_at = Date.now();
        await step.save();

        res.status(200).json({
            status: true,
            message: 'Content added successfully',
            step,
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ status: false, message: 'Server error' });
    }
});

router.put('/edit-content/:id', async (req, res) => {
    try {
        const { guide_id, step_id, type, placement, link } = req.body;
        const contentId = req.params.id;  // Extract content ID from the URL parameters

        if (!guide_id || !step_id || !type || !placement || !link) {
            return res.status(400).json({ status: false, message: 'guide_id, step_id, type, placement, and link are required' });
        }

        // Find the guide by guide_id
        const guide = await Guide.findOne({ guide_id }).populate('steps');
        if (!guide) {
            return res.status(404).json({ status: false, message: 'Guide not found' });
        }

        // Validate step_id within the guide's steps list
        if (step_id < 1 || step_id > guide.steps.length) {
            return res.status(400).json({ status: false, message: 'Invalid step_id' });
        }

        // Get the correct step by step_id
        const step = guide.steps[step_id - 1];

        if (!step) {
            return res.status(404).json({ status: false, message: 'Step not found' });
        }

        // Find the content by contentId
        const content = step.contents.id(contentId);  // Find content by its ObjectId

        if (!content) {
            return res.status(404).json({ status: false, message: 'Content not found' });
        }

        // Update the content object
        content.type = type;
        content.placement = placement;
        content.link = link;

        // Save the updated step
        step.updated_at = Date.now();
        await step.save();

        res.status(200).json({
            status: true,
            message: 'Content updated successfully',
            content,
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ status: false, message: 'Server error' });
    }
});
module.exports = router;