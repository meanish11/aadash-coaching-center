const express = require('express');
const router = express.Router();
const Class = require('../models/Class');
const Student = require('../models/Student');

router.get('/', async (req, res) => {
    try {
        const classes = await Class.find().sort({ createdAt: -1 });
        res.json({
            success: true,
            data: classes
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

router.post('/', async (req, res) => {
    try {
        const classData = new Class(req.body);
        const savedClass = await classData.save();
        
        res.status(201).json({
            success: true,
            message: 'Class created successfully',
            data: savedClass
        });
    } catch (error) {
        res.status(400).json({ 
            success: false, 
            message: error.message 
        });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const classToDelete = await Class.findById(req.params.id);
        if (!classToDelete) {
            return res.status(404).json({ 
                success: false, 
                message: 'Class not found' 
            });
        }

        const studentsInClass = await Student.countDocuments({ 
            'personalDetails.className': classToDelete.className 
        });
        
        if (studentsInClass > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete class with ${studentsInClass} existing students`
            });
        }

        await Class.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Class deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

module.exports = router;
