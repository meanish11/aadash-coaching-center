const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    personalDetails: {
        studentId: {
            type: String,
            required: true,
            unique: true
        },
        fullName: {
            type: String,
            required: true,
            trim: true
        },
        fatherName: {
            type: String,
            required: true,
            trim: true
        },
        phone: {
            type: String,
            required: true,
            match: [/^[6-9]\d{9}$/, 'Please enter a valid phone number']
        },
        className: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ['Active', 'Inactive'],
            default: 'Active'
        }
    },
    feeDetails: {
        monthlyFee: {
            type: Number,
            required: true,
            default: 0
        },
        totalPaidAmount: {
            type: Number,
            default: 0
        },
        monthlyPayments: [{
            month: {
                type: String,
                required: true
            },
            year: {
                type: Number,
                required: true
            },
            amount: {
                type: Number,
                required: true
            },
            paidDate: {
                type: Date,
                default: Date.now
            },
            receiptNumber: String,
            paymentMode: {
                type: String,
                enum: ['Cash', 'Online', 'Cheque', 'Card'],
                default: 'Cash'
            },
            status: {
                type: String,
                enum: ['Paid', 'Partial', 'Overpaid'],
                default: 'Paid'
            }
        }]
    }
}, {
    timestamps: true
});

// Calculate due/overpaid amount based on 1st day of month rule
studentSchema.methods.calculateDueAmount = function() {
    const currentDate = new Date();
    const joiningDate = this.createdAt;
    
    // Calculate months from joining till current month (if we're past 1st day)
    let monthsOwed = 0;
    let checkDate = new Date(joiningDate.getFullYear(), joiningDate.getMonth(), 1);
    
    while (checkDate <= currentDate) {
        // If current date is past 1st of the month, fee is due for this month
        if (checkDate.getMonth() === currentDate.getMonth() && 
            checkDate.getFullYear() === currentDate.getFullYear()) {
            // Only count current month if we're past the 1st day
            if (currentDate.getDate() > 1) {
                monthsOwed++;
            }
        } else if (checkDate < currentDate) {
            monthsOwed++;
        }
        
        // Move to next month
        checkDate.setMonth(checkDate.getMonth() + 1);
    }
    
    const totalDueAmount = monthsOwed * this.feeDetails.monthlyFee;
    return totalDueAmount - this.feeDetails.totalPaidAmount;
};

// Get payment status for a specific month
studentSchema.methods.getMonthPaymentStatus = function(month, year) {
    const payment = this.feeDetails.monthlyPayments.find(p => 
        p.month === month && p.year === year
    );
    
    if (!payment) return { status: 'Unpaid', amount: 0 };
    
    if (payment.amount > this.feeDetails.monthlyFee) {
        return { status: 'Overpaid', amount: payment.amount };
    } else if (payment.amount < this.feeDetails.monthlyFee) {
        return { status: 'Partial', amount: payment.amount };
    } else {
        return { status: 'Paid', amount: payment.amount };
    }
};

module.exports = mongoose.model('Student', studentSchema);
