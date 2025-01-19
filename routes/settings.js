const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Hiển thị trang cài đặt
router.get('/', async (req, res) => {
    try {
        // Get current settings from database or use defaults
        const settings = {
            workTime: 25,
            shortBreak: 5,
            longBreak: 15,
            notifications: true
        };
        
        res.render('settings', { settings });
    } catch (error) {
        res.status(500).render('error', { message: 'Error loading settings' });
    }
});

// Lưu cài đặt
router.post('/update', async (req, res) => {
    try {
        const { workTime, shortBreak, longBreak, notifications } = req.body;
        
        // Validate input
        if (!workTime || !shortBreak || !longBreak) {
            return res.status(400).json({ 
                success: false, 
                message: 'All time fields are required' 
            });
        }

        // Save to database or session
        const settings = { workTime, shortBreak, longBreak, notifications };
        
        // Emit event to update timer
        res.json({ 
            success: true, 
            message: 'Settings updated successfully',
            settings 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error updating settings' 
        });
    }
});

module.exports = router; 