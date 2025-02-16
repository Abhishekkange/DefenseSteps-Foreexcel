const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Get All Users
router.get('/users', async (req, res) => {
    try {
      const users = await User.find({}, { username: 1, email: 1, role: 1 });
  
      const formattedUsers = users.map((user) => ({
        id: user._id, // Assuming _id is used as the unique identifier
        username: user.username,
        email: user.email,
        role: user.role, // Keeping role as number
      }));
  
      res.status(200).json({
        status: true,
        users: formattedUsers,
      });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });
  
// Update User Role
router.post('/edit-user', async (req, res) => {
    const { username, new_role } = req.body;
  
    try {
      // Validate request fields
      if (!username || new_role === undefined) {
        return res.status(400).json({
          status: false,
          message: "The username field is required.",
          errors: {
            username: username ? [] : ["The username field is required."],
            role: new_role !== undefined ? [] : ["The role field is required."]
          }
        });
      }
  
      // Validate new_role
      if (![0, 1, 2].includes(new_role)) {
        return res.status(400).json({ error: 'Invalid role. Role must be 0, 1, or 2.' });
      }
  
      // Find user by username
      const user = await User.findOne({ username });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      // Check if username is already taken
      const existingUser = await User.findOne({ username, _id: { $ne: user._id } });
      if (existingUser) {
        return res.status(400).json({
          status: false,
          message: "The username has already been taken.",
          errors: {
            username: ["The username has already been taken."]
          }
        });
      }
  
      // Update user role
      user.role = new_role;
      await user.save();
  
      res.status(200).json({
        status: true,
        message: "User updated successfully",
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          
        }
      });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

router.post('/delete-user', async (req, res) => {
    const { username } = req.body;
  
    try {
      const user = await User.findOneAndDelete({ username });
      if (!user) {
        return res.status(404).json({
          status: false,
          message: "User not found"
        });
      }
  
      res.status(200).json({
        status: true,
        message: "User deleted successfully"
      });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });
  


module.exports = router;