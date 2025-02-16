const express = require('express');
const router = express.Router();
const Guide = require('../models/Guide');

router.post('/add-content', async (req, res) => {
    try {
        const { guide_id, step_id, placement } = req.body;

        if (!guide_id || !step_id || !placement) {
            return res.status(400).json({ status: false, message: 'guide_id, step_id, and placement are required' });
        }

        const guide = await Guide.findOne({ guide_id }).populate('steps');
        if (!guide) {
            return res.status(404).json({ status: false, message: 'Guide not found' });
        }

        if (step_id < 1 || step_id > guide.steps.length) {
            return res.status(400).json({ status: false, message: 'Invalid step_id' });
        }

        const step = guide.steps[step_id - 1];

        if (!step) {
            return res.status(404).json({ status: false, message: 'Step not found' });
        }

        // Replace the existing placement text with the new one
        step.placements = placement; 

        step.updated_at = Date.now();
        await step.save();

        res.status(200).json({
            status: true,
            message: 'Placement updated successfully',
            step,
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ status: false, message: 'Server error' });
    }
});

module.exports = router;