const express = require('express');
const mongoose = require('mongoose'); // ← ADDED THIS
const Student = require('../models/Student');
const router = express.Router();

// GET /api/students - Get all students
router.get('/', async (req, res) => {
    try {
        const { className } = req.query;
        let query = {};
        
        if (className) {
            query['personalDetails.className'] = className;
        }
        
        const students = await Student.find(query).sort({ createdAt: -1 });
        
        res.json({
            success: true,
            data: students
        });
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching students',
            error: error.message
        });
    }
});

// GET /api/students/reports/due-summary - Get due/overpaid summary report
router.get('/reports/due-summary', async (req, res) => {
    try {
        console.log('Due summary report requested');
        
        // Get all active students
        const students = await Student.find({ 'personalDetails.status': 'Active' });
        console.log(`Found ${students.length} active students`);
        
        let studentsWithDues = 0;
        let studentsWithOverpayment = 0;
        let totalDueAmount = 0;
        let totalOverpaidAmount = 0;
        const details = [];

        students.forEach(student => {
            try {
                const personalDetails = student.personalDetails || {};
                const feeDetails = student.feeDetails || {};
                const monthlyPayments = feeDetails.monthlyPayments || [];
                
                const monthlyFee = feeDetails.monthlyFee || 0;
                const totalPaid = monthlyPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
                const dueAmount = monthlyFee - totalPaid;
                
                if (dueAmount > 0) {
                    studentsWithDues++;
                    totalDueAmount += dueAmount;
                    details.push({
                        studentId: personalDetails.studentId || 'N/A',
                        name: personalDetails.fullName || 'Unknown',
                        className: personalDetails.className || 'N/A',
                        monthlyFee: monthlyFee,
                        totalPaid: totalPaid,
                        dueAmount: dueAmount,
                        status: 'Due'
                    });
                } else if (dueAmount < 0) {
                    studentsWithOverpayment++;
                    totalOverpaidAmount += Math.abs(dueAmount);
                    details.push({
                        studentId: personalDetails.studentId || 'N/A',
                        name: personalDetails.fullName || 'Unknown',
                        className: personalDetails.className || 'N/A',
                        monthlyFee: monthlyFee,
                        totalPaid: totalPaid,
                        dueAmount: dueAmount,
                        status: 'Overpaid'
                    });
                }
            } catch (studentError) {
                console.error('Error processing student:', student._id, studentError);
                // Continue with other students
            }
        });

        const responseData = {
            success: true,
            data: {
                studentsWithDues,
                studentsWithOverpayment,
                totalStudents: students.length,
                totalDueAmount,
                totalOverpaidAmount,
                details
            }
        };
        
        console.log('Due summary response:', responseData);
        res.json(responseData);
    } catch (error) {
        console.error('Error generating due summary report:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating due summary report',
            error: error.message
        });
    }
});

// GET /api/students/:id - Get single student
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid student ID format'
            });
        }
        
        const student = await Student.findById(id);
        
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        
        res.json({
            success: true,
            data: student
        });
    } catch (error) {
        console.error('Error fetching student:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching student',
            error: error.message
        });
    }
});

// POST /api/students - Create new student
router.post('/', async (req, res) => {
    try {
        const studentData = req.body;
        
        // Generate student ID
        const count = await Student.countDocuments();
        const studentId = `STD${String(count + 1).padStart(4, '0')}`;
        
        studentData.personalDetails.studentId = studentId;
        studentData.personalDetails.status = 'Active';
        
        const newStudent = new Student(studentData);
        const savedStudent = await newStudent.save();
        
        res.status(201).json({
            success: true,
            message: 'Student created successfully',
            data: savedStudent
        });
    } catch (error) {
        console.error('Error creating student:', error);
        
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                success: false,
                message: `${field} already exists`
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error creating student',
            error: error.message
        });
    }
});

// PUT /api/students/:id - Update student
// PUT /api/students/:id - Update student
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        console.log('Updating Student ID:', id);
        console.log('Update Data Received:', JSON.stringify(updateData, null, 2));

        // Validate MongoDB ObjectId format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid student ID format',
                studentId: id
            });
        }

        // Check if student exists
        const existingStudent = await Student.findById(id);
        if (!existingStudent) {
            return res.status(404).json({
                success: false,
                message: 'Student not found',
                studentId: id
            });
        }

        // PRESERVE THE EXISTING STUDENT ID - Don't let it be overwritten
        if (updateData.personalDetails && !updateData.personalDetails.studentId) {
            updateData.personalDetails.studentId = existingStudent.personalDetails.studentId;
        }

        // Validate required fields
        if (updateData.personalDetails) {
            const { fullName, fatherName, phone, className } = updateData.personalDetails;
            
            if (!fullName || fullName.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'Full name is required',
                    field: 'fullName'
                });
            }
            
            if (!fatherName || fatherName.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'Father name is required',
                    field: 'fatherName'
                });
            }
            
            if (!phone || phone.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'Phone number is required',
                    field: 'phone'
                });
            }
            
            if (!className || className.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'Class name is required',
                    field: 'className'
                });
            }

            // Check for duplicate phone number (excluding current student)
            const duplicatePhone = await Student.findOne({
                'personalDetails.phone': phone,
                _id: { $ne: id }
            });
            
            if (duplicatePhone) {
                return res.status(400).json({
                    success: false,
                    message: 'Phone number already exists for another student',
                    field: 'phone',
                    conflictingStudent: duplicatePhone.personalDetails.fullName
                });
            }
        }

        if (updateData.feeDetails) {
            const { monthlyFee } = updateData.feeDetails;
            
            if (!monthlyFee || monthlyFee <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Monthly fee must be greater than 0',
                    field: 'monthlyFee',
                    received: monthlyFee
                });
            }
        }

        // Update the student - use $set to avoid validation issues
        const updatedStudent = await Student.findByIdAndUpdate(
            id,
            { $set: updateData },
            { 
                new: true, 
                runValidators: false, // Disable validation to avoid studentId issues
                context: 'query'
            }
        );

        res.json({
            success: true,
            message: 'Student updated successfully',
            data: updatedStudent
        });

    } catch (error) {
        console.error('Error updating student:', error);
        
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
        });
    }
});

// DELETE /api/students/:id - Delete student
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid student ID format'
            });
        }
        
        const deletedStudent = await Student.findByIdAndDelete(id);
        
        if (!deletedStudent) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Student deleted successfully',
            data: deletedStudent
        });
    } catch (error) {
        console.error('Error deleting student:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting student',
            error: error.message
        });
    }
});

// POST /api/students/:id/monthly-payment - Record monthly fee payment
router.post('/:id/monthly-payment', async (req, res) => {
    try {
        const { id } = req.params;
        const paymentData = req.body;

        console.log('Recording monthly payment for student:', id);
        console.log('Payment data:', paymentData);

        // Validate MongoDB ObjectId format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid student ID format'
            });
        }

        // Check if student exists
        const student = await Student.findById(id);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Validate required payment fields
        const { month, year, amount, paymentMode } = paymentData;
        
        if (!month || !year || !amount || !paymentMode) {
            return res.status(400).json({
                success: false,
                message: 'Month, year, amount, and payment mode are required'
            });
        }

        if (amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Payment amount must be greater than 0'
            });
        }

        // Generate receipt number
        const receiptNumber = `RCP${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

        // Create payment record
        const payment = {
            month: month,
            year: parseInt(year),
            amount: parseFloat(amount),
            paymentMode: paymentMode,
            paidDate: new Date(),
            receiptNumber: receiptNumber,
            status: 'Paid',
            remarks: paymentData.remarks || ''
        };

        // Add payment to student's monthlyPayments array
        if (!student.feeDetails.monthlyPayments) {
            student.feeDetails.monthlyPayments = [];
        }

        // Check if payment for this month/year already exists
        const existingPayment = student.feeDetails.monthlyPayments.find(
            p => p.month === month && p.year === parseInt(year)
        );

        if (existingPayment) {
            return res.status(400).json({
                success: false,
                message: `Payment for ${month} ${year} already exists`
            });
        }

        // Add payment
        student.feeDetails.monthlyPayments.push(payment);

        // Update total paid amount
        const totalPaid = student.feeDetails.monthlyPayments.reduce((sum, p) => sum + p.amount, 0);
        student.feeDetails.totalPaidAmount = totalPaid;

        // Calculate due amount
        const monthlyFee = student.feeDetails.monthlyFee || 0;
        const dueAmount = monthlyFee - totalPaid;
        student.calculatedDue = dueAmount;

        // Save the updated student
        await student.save();

        console.log('Payment recorded successfully');

        res.json({
            success: true,
            message: 'Monthly payment recorded successfully',
            data: {
                payment: payment,
                student: {
                    _id: student._id,
                    studentId: student.personalDetails.studentId,
                    fullName: student.personalDetails.fullName,
                    totalPaidAmount: student.feeDetails.totalPaidAmount,
                    calculatedDue: student.calculatedDue
                }
            }
        });

    } catch (error) {
        console.error('Error recording monthly payment:', error);
        res.status(500).json({
            success: false,
            message: 'Error recording monthly payment',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
        });
    }
});

module.exports = router;
