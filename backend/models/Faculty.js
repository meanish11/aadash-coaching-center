const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema({
    personalDetails: {
        facultyId: {
            type: String,
            required: true,
            unique: true
        },
        fullName: {
            type: String,
            required: true,
            trim: true
        },
        dateOfBirth: {
            type: Date,
            required: true
        },
        gender: {
            type: String,
            enum: ['Male', 'Female', 'Other'],
            required: true
        },
        qualification: {
            type: String,
            required: true,
            trim: true
        },
        specialization: {
            type: String,
            required: true,
            trim: true
        },
        experience: {
            type: String,
            required: true
        },
        address: {
            street: { type: String, trim: true },
            city: { type: String, trim: true },
            state: { type: String, default: 'Maharashtra' },
            pincode: { type: String, trim: true }
        },
        phone: {
            type: String,
            required: true,
            match: [/^[6-9]\d{9}$/, 'Please enter a valid phone number']
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
        },
        emergencyContact: {
            type: String,
            match: [/^[6-9]\d{9}$/, 'Please enter a valid emergency contact']
        },
        joiningDate: {
            type: Date,
            default: Date.now
        },
        employmentType: {
            type: String,
            enum: ['Full-time', 'Part-time', 'Contract'],
            required: true
        },
        subjects: [{
            type: String,
            enum: ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'English', 'Hindi', 'Social Science']
        }],
        status: {
            type: String,
            enum: ['Active', 'Inactive'],
            default: 'Active'
        }
    },
    salaryDetails: {
        basicSalary: {
            type: Number,
            required: true,
            min: 0
        },
        allowances: {
            hra: {
                type: Number,
                default: 0
            },
            transport: {
                type: Number,
                default: 0
            },
            medical: {
                type: Number,
                default: 0
            },
            other: {
                type: Number,
                default: 0
            }
        },
        totalSalary: {
            type: Number,
            min: 0
        },
        paymentMode: {
            type: String,
            enum: ['Bank Transfer', 'Cash', 'Cheque'],
            default: 'Bank Transfer'
        },
        bankDetails: {
            accountNumber: String,
            bankName: String,
            ifscCode: String,
            branchName: String
        },
        salaryHistory: [{
            month: {
                type: String,
                required: true
            },
            amount: {
                type: Number,
                required: true,
                min: 0
            },
            paidDate: {
                type: Date,
                default: Date.now
            },
            deductions: {
                type: Number,
                default: 0
            },
            netAmount: {
                type: Number,
                required: true
            },
            remarks: String
        }]
    }
}, {
    timestamps: true
});

facultySchema.pre('save', function(next) {
    const allowances = this.salaryDetails.allowances;
    this.salaryDetails.totalSalary = this.salaryDetails.basicSalary + 
                                    allowances.hra + 
                                    allowances.transport + 
                                    allowances.medical + 
                                    allowances.other;
    next();
});

module.exports = mongoose.model('Faculty', facultySchema);
