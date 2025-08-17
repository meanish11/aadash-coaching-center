const express = require('express');
const router = express.Router();
const Faculty = require('../models/Faculty');

router.get('/', async (req, res) => {
    try {
        const { search, subject, status } = req.query;
        let query = {};

        if (search) {
            query.$or = [
                { 'personalDetails.fullName': { $regex: search, $options: 'i' } },
                { 'personalDetails.facultyId': { $regex: search, $options: 'i' } }
            ];
        }

        if (subject) {
            query['personalDetails.subjects'] = subject;
        }

        if (status) {
            query['personalDetails.status'] = status;
        }

        const faculty = await Faculty.find(query).sort({ createdAt: -1 });
        res.json({
            success: true,
            count: faculty.length,
            data: faculty
        });
    } catch (error) {
        console.error('Error fetching faculty:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching faculty',
            error: error.message 
        });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const faculty = await Faculty.findById(req.params.id);
        if (!faculty) {
            return res.status(404).json({ 
                success: false, 
                message: 'Faculty member not found' 
            });
        }
        res.json({
            success: true,
            data: faculty
        });
    } catch (error) {
        console.error('Error fetching faculty member:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching faculty member',
            error: error.message 
        });
    }
});

router.post('/', async (req, res) => {
    try {
        const facultyCount = await Faculty.countDocuments();
        const facultyId = `FAC${String(facultyCount + 1).padStart(4, '0')}`;

        let address = req.body.personalDetails.address;
        if (typeof address === 'string') {
            const addressParts = address.split(',').map(part => part.trim());
            address = {
                street: addressParts[0] || '',
                city: addressParts[1] || '',
                state: 'Maharashtra',
                pincode: addressParts[2] || ''
            };
        }

        const facultyData = {
            personalDetails: {
                ...req.body.personalDetails,
                facultyId: facultyId,
                address: address
            },
            salaryDetails: req.body.salaryDetails
        };

        const faculty = new Faculty(facultyData);
        const savedFaculty = await faculty.save();
        
        res.status(201).json({
            success: true,
            message: 'Faculty member created successfully',
            data: savedFaculty
        });
    } catch (error) {
        console.error('Error creating faculty member:', error);
        res.status(400).json({ 
            success: false, 
            message: 'Error creating faculty member',
            error: error.message 
        });
    }
});

router.put('/:id', async (req, res) => {
    try {
        if (req.body.personalDetails && req.body.personalDetails.address && 
            typeof req.body.personalDetails.address === 'string') {
            const addressParts = req.body.personalDetails.address.split(',').map(part => part.trim());
            req.body.personalDetails.address = {
                street: addressParts[0] || '',
                city: addressParts[1] || '',
                state: 'Maharashtra',
                pincode: addressParts[2] || ''
            };
        }

        const faculty = await Faculty.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!faculty) {
            return res.status(404).json({ 
                success: false, 
                message: 'Faculty member not found' 
            });
        }
        
        res.json({
            success: true,
            message: 'Faculty member updated successfully',
            data: faculty
        });
    } catch (error) {
        console.error('Error updating faculty member:', error);
        res.status(400).json({ 
            success: false, 
            message: 'Error updating faculty member',
            error: error.message 
        });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const faculty = await Faculty.findByIdAndDelete(req.params.id);
        if (!faculty) {
            return res.status(404).json({ 
                success: false, 
                message: 'Faculty member not found' 
            });
        }
        res.json({
            success: true,
            message: 'Faculty member deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting faculty member:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error deleting faculty member',
            error: error.message 
        });
    }
});

router.post('/:id/salary', async (req, res) => {
    try {
        const faculty = await Faculty.findById(req.params.id);
        if (!faculty) {
            return res.status(404).json({ 
                success: false, 
                message: 'Faculty member not found' 
            });
        }

        const salaryPayment = {
            month: req.body.month,
            amount: parseFloat(req.body.amount),
            paidDate: req.body.paidDate || new Date(),
            deductions: parseFloat(req.body.deductions) || 0,
            netAmount: parseFloat(req.body.amount) - (parseFloat(req.body.deductions) || 0),
            remarks: req.body.remarks || ''
        };

        faculty.salaryDetails.salaryHistory.push(salaryPayment);
        await faculty.save();
        
        res.json({
            success: true,
            message: 'Salary payment recorded successfully',
            data: faculty
        });
    } catch (error) {
        console.error('Error recording salary payment:', error);
        res.status(400).json({ 
            success: false, 
            message: 'Error recording salary payment',
            error: error.message 
        });
    }
});

module.exports = router;
