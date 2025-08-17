class FacultyManager {
    constructor() {
        this.faculty = [];
        this.currentFaculty = null;
        this.currentFacultyForDetails = null;
        this.isEditMode = false;
        this.init();
    }

    async init() {
        try {
            this.bindEvents();
            await this.loadFaculty();
            this.renderFaculty();
        } catch (error) {
            console.error('Faculty manager initialization error:', error);
            utils.showAlert('Error loading faculty data', 'error');
        }
    }

    bindEvents() {
        // Add faculty button
        document.getElementById('addFacultyBtn')?.addEventListener('click', () => {
            this.openFacultyModal();
        });

        // Excel export button
        document.getElementById('exportFacultyExcelBtn')?.addEventListener('click', () => {
            this.exportFacultyExcel();
        });

        // Faculty modal events
        document.getElementById('closeFacultyModal')?.addEventListener('click', () => {
            this.closeFacultyModal();
        });

        document.getElementById('cancelFacultyBtn')?.addEventListener('click', () => {
            this.closeFacultyModal();
        });

        document.getElementById('facultyForm')?.addEventListener('submit', (e) => {
            this.handleFacultySubmit(e);
        });

        // Faculty details modal events
        document.getElementById('closeFacultyDetailsModal')?.addEventListener('click', () => {
            this.closeFacultyDetailsModal();
        });

        // Tab switching for faculty details
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('details-tab-btn')) {
                const tabName = e.target.dataset.tab;
                if (tabName) {
                    this.switchDetailsTab(tabName);
                }
            }
        });

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }

    // ==================== FACULTY MANAGEMENT ====================

    async loadFaculty() {
        try {
            const response = await api.getFaculty();
            this.faculty = response.data || [];
        } catch (error) {
            console.error('Error loading faculty:', error);
            utils.showAlert('Error loading faculty data', 'error');
            this.faculty = [];
        }
    }

   // Update the renderFaculty method
renderFaculty() {
    const tbody = document.getElementById('facultyTableBody');
    if (!tbody) return;
    
    if (this.faculty.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 3rem;">
                    <i class="fas fa-chalkboard-teacher" style="font-size: 3rem; color: #ddd; margin-bottom: 1rem; display: block;"></i>
                    <h4 style="color: #666; margin-bottom: 0.5rem;">No Faculty Found</h4>
                    <p style="color: #999; margin-bottom: 1.5rem;">Add your first faculty member to get started</p>
                    <button class="btn-primary" onclick="facultyManager.openFacultyModal()">
                        <i class="fas fa-plus"></i> Add First Faculty
                    </button>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = this.faculty.map(faculty => {
        const subjects = faculty.personalDetails.subjects || [];
        const subjectsDisplay = subjects.length > 0 
            ? subjects.slice(0, 2).map(sub => `<span class="subject-badge-sm">${sub}</span>`).join(' ') +
              (subjects.length > 2 ? `<span class="subject-more">+${subjects.length - 2}</span>` : '')
            : '<span class="text-muted">No subjects assigned</span>';

        return `
            <tr>
                <td>
                    <strong>${faculty.personalDetails.facultyId}</strong>
                </td>
                <td>
                    <span class="clickable-name" onclick="facultyManager.viewFacultyDetails('${faculty._id}')">
                        <strong>${faculty.personalDetails.fullName}</strong>
                    </span>
                    <br>
                    <small style="color: #666;">${faculty.personalDetails.phone}</small>
                </td>
                <td>${faculty.personalDetails.specialization || 'Not specified'}</td>
                <td>
                    <div class="subjects-display">
                        ${subjectsDisplay}
                    </div>
                </td>
                <td>
                    <strong>${utils.formatCurrency(faculty.salaryDetails.monthlySalary || 0)}</strong>
                    <br>
                    <small style="color: #666;">${faculty.personalDetails.employmentType || 'Not specified'}</small>
                </td>
                <td style="text-align: center;">
                    <span class="status-badge status-${faculty.personalDetails.status.toLowerCase()}">
                        <i class="fas fa-circle"></i> ${faculty.personalDetails.status}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action" onclick="facultyManager.viewFacultyDetails('${faculty._id}')" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-action" onclick="facultyManager.exportFacultyData('${faculty._id}')" title="Export Faculty Data">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="btn-action btn-edit" onclick="facultyManager.editFaculty('${faculty._id}')" title="Edit Faculty">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action btn-danger" onclick="facultyManager.deleteFaculty('${faculty._id}')" title="Delete Faculty">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Update the fillFacultyForm method
fillFacultyForm(faculty) {
    const form = document.getElementById('facultyForm');
    if (!form || !faculty) return;
    
    try {
        // Fill personal details
        Object.keys(faculty.personalDetails).forEach(key => {
            const field = form.querySelector(`[name="${key}"]`);
            if (field) {
                if (field.type === 'checkbox') {
                    field.checked = faculty.personalDetails[key];
                } else {
                    field.value = faculty.personalDetails[key] || '';
                }
            }
        });

        // Fill monthly salary
        const monthlySalaryField = form.querySelector(`[name="monthlySalary"]`);
        if (monthlySalaryField) {
            monthlySalaryField.value = faculty.salaryDetails.monthlySalary || faculty.salaryDetails.totalSalary || '';
        }

        // Handle subjects checkboxes
        this.populateSubjectsCheckboxes();
        if (faculty.personalDetails.subjects) {
            faculty.personalDetails.subjects.forEach(subject => {
                const checkbox = form.querySelector(`input[name="subjects"][value="${subject}"]`);
                if (checkbox) {
                    checkbox.checked = true;
                }
            });
        }

    } catch (error) {
        console.error('Error filling faculty form:', error);
        utils.showAlert('Error loading faculty data into form', 'error');
    }
}



// Update the renderFaculty method to handle any salary format
renderFaculty() {
    const tbody = document.getElementById('facultyTableBody');
    if (!tbody) return;
    
    if (this.faculty.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 3rem;">
                    <i class="fas fa-chalkboard-teacher" style="font-size: 3rem; color: #ddd; margin-bottom: 1rem; display: block;"></i>
                    <h4 style="color: #666; margin-bottom: 0.5rem;">No Faculty Found</h4>
                    <p style="color: #999; margin-bottom: 1.5rem;">Add your first faculty member to get started</p>
                    <button class="btn-primary" onclick="facultyManager.openFacultyModal()">
                        <i class="fas fa-plus"></i> Add First Faculty
                    </button>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = this.faculty.map(faculty => {
        const subjects = faculty.personalDetails.subjects || [];
        const subjectsDisplay = subjects.length > 0 
            ? subjects.slice(0, 2).map(sub => `<span class="subject-badge-sm">${sub}</span>`).join(' ') +
              (subjects.length > 2 ? `<span class="subject-more">+${subjects.length - 2}</span>` : '')
            : '<span class="text-muted">No subjects assigned</span>';

        // Display salary as is - no formatting
        const salaryDisplay = faculty.salaryDetails.monthlySalary || faculty.salaryDetails.totalSalary || 'Not specified';

        return `
            <tr>
                <td>
                    <strong>${faculty.personalDetails.facultyId || 'N/A'}</strong>
                </td>
                <td>
                    <span class="clickable-name" onclick="facultyManager.viewFacultyDetails('${faculty._id}')">
                        <strong>${faculty.personalDetails.fullName || 'No Name'}</strong>
                    </span>
                    <br>
                    <small style="color: #666;">${faculty.personalDetails.phone || 'No Phone'}</small>
                </td>
                <td>${faculty.personalDetails.specialization || 'Not specified'}</td>
                <td>
                    <div class="subjects-display">
                        ${subjectsDisplay}
                    </div>
                </td>
                <td>
                    <strong>${salaryDisplay}</strong>
                    <br>
                    <small style="color: #666;">${faculty.personalDetails.employmentType || 'Not specified'}</small>
                </td>
                <td style="text-align: center;">
                    <span class="status-badge status-${(faculty.personalDetails.status || 'active').toLowerCase()}">
                        <i class="fas fa-circle"></i> ${faculty.personalDetails.status || 'Active'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action" onclick="facultyManager.viewFacultyDetails('${faculty._id}')" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-action" onclick="facultyManager.exportFacultyData('${faculty._id}')" title="Export Faculty Data">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="btn-action btn-edit" onclick="facultyManager.editFaculty('${faculty._id}')" title="Edit Faculty">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action btn-danger" onclick="facultyManager.deleteFaculty('${faculty._id}')" title="Delete Faculty">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Update the fillFacultySalaryInfo method to display salary as is
fillFacultySalaryInfo(faculty) {
    const salaryDiv = document.getElementById('facultySalaryInfo');
    if (!salaryDiv) return;

    const salaryDetails = faculty.salaryDetails || {};
    const monthlySalary = salaryDetails.monthlySalary || salaryDetails.totalSalary || 'Not specified';

    salaryDiv.innerHTML = `
        <div class="faculty-info-grid">
            <div class="info-section">
                <h4><i class="fas fa-rupee-sign"></i> Salary Information</h4>
                <div class="salary-display">
                    <div class="salary-main">
                        <span class="salary-label">Monthly Salary</span>
                        <span class="salary-amount">${monthlySalary}</span>
                    </div>
                    <div class="salary-details">
                        <div class="salary-info-item">
                            <span class="info-label">Employment Type:</span>
                            <span class="info-value">${faculty.personalDetails.employmentType || 'Not specified'}</span>
                        </div>
                        <div class="salary-info-item">
                            <span class="info-label">Join Date:</span>
                            <span class="info-value">${utils.formatDate(faculty.createdAt)}</span>
                        </div>
                        <div class="salary-info-item">
                            <span class="info-label">Status:</span>
                            <span class="info-value">
                                <span class="status-badge status-${(faculty.personalDetails.status || 'active').toLowerCase()}">
                                    ${faculty.personalDetails.status || 'Active'}
                                </span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        ${salaryDetails.salaryHistory && salaryDetails.salaryHistory.length > 0 ? `
        <div class="salary-history-section">
            <h4><i class="fas fa-history"></i> Salary Payment History</h4>
            <div class="table-responsive">
                <table class="salary-history-table">
                    <thead>
                        <tr>
                            <th>Month</th>
                            <th>Amount</th>
                            <th>Deductions</th>
                            <th>Net Amount</th>
                            <th>Payment Date</th>
                            <th>Remarks</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${salaryDetails.salaryHistory
                            .sort((a, b) => new Date(b.paidDate) - new Date(a.paidDate))
                            .map(salary => `
                                <tr>
                                    <td><strong>${salary.month || 'N/A'}</strong></td>
                                    <td>${salary.amount || 'N/A'}</td>
                                    <td>${salary.deductions || 'N/A'}</td>
                                    <td><strong>${salary.netAmount || 'N/A'}</strong></td>
                                    <td>${salary.paidDate ? utils.formatDate(salary.paidDate) : 'N/A'}</td>
                                    <td>${salary.remarks || 'No remarks'}</td>
                                </tr>
                            `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        ` : `
        <div class="no-payments">
            <div class="no-payments-content">
                <i class="fas fa-history"></i>
                <h4>No Salary Payment Records</h4>
                <p>No salary payments have been recorded for this faculty member yet.</p>
            </div>
        </div>
        `}
    `;
}


// Update the fillFacultySalaryInfo method
fillFacultySalaryInfo(faculty) {
    const salaryDiv = document.getElementById('facultySalaryInfo');
    if (!salaryDiv) return;

    const salaryDetails = faculty.salaryDetails || {};
    const monthlySalary = salaryDetails.monthlySalary || salaryDetails.totalSalary || 0;

    salaryDiv.innerHTML = `
        <div class="faculty-info-grid">
            <div class="info-section">
                <h4><i class="fas fa-rupee-sign"></i> Salary Information</h4>
                <div class="salary-display">
                    <div class="salary-main">
                        <span class="salary-label">Monthly Salary</span>
                        <span class="salary-amount">${utils.formatCurrency(monthlySalary)}</span>
                    </div>
                    <div class="salary-details">
                        <div class="salary-info-item">
                            <span class="info-label">Employment Type:</span>
                            <span class="info-value">${faculty.personalDetails.employmentType || 'Not specified'}</span>
                        </div>
                        <div class="salary-info-item">
                            <span class="info-label">Join Date:</span>
                            <span class="info-value">${utils.formatDate(faculty.createdAt)}</span>
                        </div>
                        <div class="salary-info-item">
                            <span class="info-label">Status:</span>
                            <span class="info-value">
                                <span class="status-badge status-${faculty.personalDetails.status.toLowerCase()}">
                                    ${faculty.personalDetails.status}
                                </span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        ${salaryDetails.salaryHistory && salaryDetails.salaryHistory.length > 0 ? `
        <div class="salary-history-section">
            <h4><i class="fas fa-history"></i> Salary Payment History</h4>
            <div class="table-responsive">
                <table class="salary-history-table">
                    <thead>
                        <tr>
                            <th>Month</th>
                            <th>Amount</th>
                            <th>Deductions</th>
                            <th>Net Amount</th>
                            <th>Payment Date</th>
                            <th>Remarks</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${salaryDetails.salaryHistory
                            .sort((a, b) => new Date(b.paidDate) - new Date(a.paidDate))
                            .map(salary => `
                                <tr>
                                    <td><strong>${salary.month}</strong></td>
                                    <td>${utils.formatCurrency(salary.amount || 0)}</td>
                                    <td>${utils.formatCurrency(salary.deductions || 0)}</td>
                                    <td><strong>${utils.formatCurrency(salary.netAmount || 0)}</strong></td>
                                    <td>${utils.formatDate(salary.paidDate)}</td>
                                    <td>${salary.remarks || 'No remarks'}</td>
                                </tr>
                            `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        ` : `
        <div class="no-payments">
            <div class="no-payments-content">
                <i class="fas fa-history"></i>
                <h4>No Salary Payment Records</h4>
                <p>No salary payments have been recorded for this faculty member yet.</p>
            </div>
        </div>
        `}
    `;
}

// Update the exportFacultyExcel method
async exportFacultyExcel() {
    try {
        utils.showAlert('Generating Faculty Excel file...', 'info');
        
        if (this.faculty.length === 0) {
            utils.showAlert('No faculty data to export', 'warning');
            return;
        }

        const excelData = [
            ['AADASH COACHING CENTER - FACULTY DETAILS'],
            [`Total Faculty: ${this.faculty.length}`],
            [`Generated on: ${new Date().toLocaleString()}`],
            [],
            [
                'Faculty ID',
                'Full Name',
                'Date of Birth',
                'Gender',
                'Phone',
                'Email',
                'Qualification',
                'Specialization',
                'Experience',
                'Employment Type',
                'Subjects Teaching',
                'Monthly Salary (₹)',
                'Status',
                'Join Date',
                'Address'
            ]
        ];

        this.faculty.forEach(faculty => {
            const joinDate = new Date(faculty.createdAt).toLocaleDateString();
            const subjects = faculty.personalDetails.subjects ? faculty.personalDetails.subjects.join(', ') : 'N/A';
            const monthlySalary = faculty.salaryDetails.monthlySalary || faculty.salaryDetails.totalSalary || 0;
            
            excelData.push([
                faculty.personalDetails.facultyId,
                faculty.personalDetails.fullName,
                faculty.personalDetails.dateOfBirth ? new Date(faculty.personalDetails.dateOfBirth).toLocaleDateString() : 'N/A',
                faculty.personalDetails.gender || 'N/A',
                faculty.personalDetails.phone,
                faculty.personalDetails.email,
                faculty.personalDetails.qualification || 'N/A',
                faculty.personalDetails.specialization || 'N/A',
                faculty.personalDetails.experience || 'N/A',
                faculty.personalDetails.employmentType || 'N/A',
                subjects,
                monthlySalary,
                faculty.personalDetails.status || 'Active',
                joinDate,
                faculty.personalDetails.address || 'N/A'
            ]);
        });

        const totalSalaryExpense = this.faculty.reduce((sum, f) => {
            const salary = f.salaryDetails.monthlySalary || f.salaryDetails.totalSalary || 0;
            return sum + salary;
        }, 0);
        const averageSalary = totalSalaryExpense / this.faculty.length;
        const activeFaculty = this.faculty.filter(f => f.personalDetails.status === 'Active').length;
        
        const allSubjects = new Set();
        this.faculty.forEach(f => {
            if (f.personalDetails.subjects) {
                f.personalDetails.subjects.forEach(subject => allSubjects.add(subject));
            }
        });

        excelData.push([]);
        excelData.push(['FACULTY SUMMARY']);
        excelData.push(['Total Faculty:', this.faculty.length]);
        excelData.push(['Active Faculty:', activeFaculty]);
        excelData.push(['Total Monthly Salary Expense:', `₹${totalSalaryExpense.toLocaleString()}`]);
        excelData.push(['Average Salary:', `₹${averageSalary.toLocaleString()}`]);
        excelData.push(['Subjects Offered:', Array.from(allSubjects).join(', ')]);

        const employmentTypes = {};
        this.faculty.forEach(f => {
            const type = f.personalDetails.employmentType || 'Not Specified';
            employmentTypes[type] = (employmentTypes[type] || 0) + 1;
        });

        excelData.push([]);
        excelData.push(['EMPLOYMENT TYPE BREAKDOWN']);
        Object.entries(employmentTypes).forEach(([type, count]) => {
            excelData.push([type + ':', count]);
        });

        const worksheet = XLSX.utils.aoa_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        
        const columnWidths = [
            { wch: 12 }, { wch: 20 }, { wch: 12 }, { wch: 8 },
            { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 15 },
            { wch: 12 }, { wch: 12 }, { wch: 20 }, { wch: 15 },
            { wch: 10 }, { wch: 12 }, { wch: 30 }
        ];
        worksheet['!cols'] = columnWidths;

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Faculty Details');

        const salaryHistoryData = [
            ['FACULTY SALARY HISTORY'],
            [`Generated on: ${new Date().toLocaleString()}`],
            [],
            ['Faculty ID', 'Faculty Name', 'Month', 'Amount Paid', 'Deductions', 'Net Amount', 'Payment Date', 'Remarks']
        ];

        let hasSalaryHistory = false;
        this.faculty.forEach(faculty => {
            if (faculty.salaryDetails.salaryHistory && faculty.salaryDetails.salaryHistory.length > 0) {
                faculty.salaryDetails.salaryHistory.forEach(salary => {
                    salaryHistoryData.push([
                        faculty.personalDetails.facultyId,
                        faculty.personalDetails.fullName,
                        salary.month,
                        salary.amount || 0,
                        salary.deductions || 0,
                        salary.netAmount || 0,
                        new Date(salary.paidDate).toLocaleDateString(),
                        salary.remarks || 'N/A'
                    ]);
                    hasSalaryHistory = true;
                });
            }
        });

        if (hasSalaryHistory) {
            const salarySheet = XLSX.utils.aoa_to_sheet(salaryHistoryData);
            salarySheet['!cols'] = [
                { wch: 12 }, { wch: 20 }, { wch: 15 }, { wch: 12 }, 
                { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 25 }
            ];
            XLSX.utils.book_append_sheet(workbook, salarySheet, 'Salary History');
        }

        const fileName = `Aladash_Faculty_Details_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(workbook, fileName);
        
        utils.showAlert(`Excel file "${fileName}" downloaded successfully!`, 'success');

    } catch (error) {
        console.error('Error exporting faculty Excel:', error);
        utils.showAlert('Error generating Excel file', 'error');
    }
}


    // ==================== EXCEL EXPORT FUNCTIONALITY ====================

    async exportFacultyExcel() {
        try {
            utils.showAlert('Generating Faculty Excel file...', 'info');
            
            if (this.faculty.length === 0) {
                utils.showAlert('No faculty data to export', 'warning');
                return;
            }

            const excelData = [
                ['AADASH COACHING CENTER - FACULTY DETAILS'],
                [`Total Faculty: ${this.faculty.length}`],
                [`Generated on: ${new Date().toLocaleString()}`],
                [],
                [
                    'Faculty ID',
                    'Full Name',
                    'Date of Birth',
                    'Gender',
                    'Phone',
                    'Email',
                    'Qualification',
                    'Specialization',
                    'Experience',
                    'Employment Type',
                    'Subjects Teaching',
                    'Basic Salary (₹)',
                    'HRA (₹)',
                    'Transport (₹)',
                    'Medical (₹)',
                    'Other (₹)',
                    'Total Salary (₹)',
                    'Payment Mode',
                    'Bank Account',
                    'Bank Name',
                    'IFSC Code',
                    'Status',
                    'Join Date',
                    'Address'
                ]
            ];

            this.faculty.forEach(faculty => {
                const joinDate = new Date(faculty.createdAt).toLocaleDateString();
                const subjects = faculty.personalDetails.subjects ? faculty.personalDetails.subjects.join(', ') : 'N/A';
                
                excelData.push([
                    faculty.personalDetails.facultyId,
                    faculty.personalDetails.fullName,
                    faculty.personalDetails.dateOfBirth ? new Date(faculty.personalDetails.dateOfBirth).toLocaleDateString() : 'N/A',
                    faculty.personalDetails.gender || 'N/A',
                    faculty.personalDetails.phone,
                    faculty.personalDetails.email,
                    faculty.personalDetails.qualification || 'N/A',
                    faculty.personalDetails.specialization || 'N/A',
                    faculty.personalDetails.experience || 'N/A',
                    faculty.personalDetails.employmentType || 'N/A',
                    subjects,
                    faculty.salaryDetails.basicSalary || 0,
                    faculty.salaryDetails.allowances?.hra || 0,
                    faculty.salaryDetails.allowances?.transport || 0,
                    faculty.salaryDetails.allowances?.medical || 0,
                    faculty.salaryDetails.allowances?.other || 0,
                    faculty.salaryDetails.totalSalary || 0,
                    faculty.salaryDetails.paymentMode || 'N/A',
                    faculty.salaryDetails.bankDetails?.accountNumber || 'N/A',
                    faculty.salaryDetails.bankDetails?.bankName || 'N/A',
                    faculty.salaryDetails.bankDetails?.ifscCode || 'N/A',
                    faculty.personalDetails.status || 'Active',
                    joinDate,
                    faculty.personalDetails.address || 'N/A'
                ]);
            });

            const totalSalaryExpense = this.faculty.reduce((sum, f) => sum + (f.salaryDetails.totalSalary || 0), 0);
            const averageSalary = totalSalaryExpense / this.faculty.length;
            const activeFaculty = this.faculty.filter(f => f.personalDetails.status === 'Active').length;
            
            const allSubjects = new Set();
            this.faculty.forEach(f => {
                if (f.personalDetails.subjects) {
                    f.personalDetails.subjects.forEach(subject => allSubjects.add(subject));
                }
            });

            excelData.push([]);
            excelData.push(['FACULTY SUMMARY']);
            excelData.push(['Total Faculty:', this.faculty.length]);
            excelData.push(['Active Faculty:', activeFaculty]);
            excelData.push(['Total Monthly Salary Expense:', `₹${totalSalaryExpense.toLocaleString()}`]);
            excelData.push(['Average Salary:', `₹${averageSalary.toLocaleString()}`]);
            excelData.push(['Subjects Offered:', Array.from(allSubjects).join(', ')]);

            const employmentTypes = {};
            this.faculty.forEach(f => {
                const type = f.personalDetails.employmentType || 'Not Specified';
                employmentTypes[type] = (employmentTypes[type] || 0) + 1;
            });

            excelData.push([]);
            excelData.push(['EMPLOYMENT TYPE BREAKDOWN']);
            Object.entries(employmentTypes).forEach(([type, count]) => {
                excelData.push([type + ':', count]);
            });

            const worksheet = XLSX.utils.aoa_to_sheet(excelData);
            const workbook = XLSX.utils.book_new();
            
            const columnWidths = [
                { wch: 12 }, { wch: 20 }, { wch: 12 }, { wch: 8 },
                { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 15 },
                { wch: 12 }, { wch: 12 }, { wch: 20 }, { wch: 12 },
                { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
                { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 15 },
                { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 30 }
            ];
            worksheet['!cols'] = columnWidths;

            XLSX.utils.book_append_sheet(workbook, worksheet, 'Faculty Details');

            const salaryHistoryData = [
                ['FACULTY SALARY HISTORY'],
                [`Generated on: ${new Date().toLocaleString()}`],
                [],
                ['Faculty ID', 'Faculty Name', 'Month', 'Amount Paid', 'Deductions', 'Net Amount', 'Payment Date', 'Remarks']
            ];

            let hasSalaryHistory = false;
            this.faculty.forEach(faculty => {
                if (faculty.salaryDetails.salaryHistory && faculty.salaryDetails.salaryHistory.length > 0) {
                    faculty.salaryDetails.salaryHistory.forEach(salary => {
                        salaryHistoryData.push([
                            faculty.personalDetails.facultyId,
                            faculty.personalDetails.fullName,
                            salary.month,
                            salary.amount || 0,
                            salary.deductions || 0,
                            salary.netAmount || 0,
                            new Date(salary.paidDate).toLocaleDateString(),
                            salary.remarks || 'N/A'
                        ]);
                        hasSalaryHistory = true;
                    });
                }
            });

            if (hasSalaryHistory) {
                const salarySheet = XLSX.utils.aoa_to_sheet(salaryHistoryData);
                salarySheet['!cols'] = [
                    { wch: 12 }, { wch: 20 }, { wch: 15 }, { wch: 12 }, 
                    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 25 }
                ];
                XLSX.utils.book_append_sheet(workbook, salarySheet, 'Salary History');
            }

            const fileName = `Aadash_Faculty_Details_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(workbook, fileName);
            
            utils.showAlert(`Excel file "${fileName}" downloaded successfully!`, 'success');

        } catch (error) {
            console.error('Error exporting faculty Excel:', error);
            utils.showAlert('Error generating Excel file', 'error');
        }
    }

    // ==================== FACULTY MODAL MANAGEMENT ====================

    openFacultyModal(faculty = null) {
        this.currentFaculty = faculty;
        this.isEditMode = !!faculty;
        
        const modal = document.getElementById('facultyModal');
        const form = document.getElementById('facultyForm');
        const modalTitle = document.getElementById('facultyModalTitle');
        
        if (!modal || !form) return;

        if (faculty) {
            if (modalTitle) modalTitle.textContent = `Edit Faculty - ${faculty.personalDetails.fullName}`;
            this.fillFacultyForm(faculty);
        } else {
            if (modalTitle) modalTitle.textContent = 'Add New Faculty';
            form.reset();
            this.isEditMode = false;
            this.populateSubjectsCheckboxes();
        }
        
        modal.style.display = 'block';
        
        setTimeout(() => {
            const firstInput = form.querySelector('input[name="fullName"]');
            if (firstInput) {
                firstInput.focus();
            }
        }, 100);
    }

    closeFacultyModal() {
        const modal = document.getElementById('facultyModal');
        if (modal) {
            modal.style.display = 'none';
        }
        this.currentFaculty = null;
        this.isEditMode = false;
    }

    fillFacultyForm(faculty) {
        const form = document.getElementById('facultyForm');
        if (!form || !faculty) return;
        
        try {
            // Fill personal details
            Object.keys(faculty.personalDetails).forEach(key => {
                const field = form.querySelector(`[name="${key}"]`);
                if (field) {
                    if (field.type === 'checkbox') {
                        field.checked = faculty.personalDetails[key];
                    } else {
                        field.value = faculty.personalDetails[key] || '';
                    }
                }
            });

            // Fill salary details
            Object.keys(faculty.salaryDetails).forEach(key => {
                if (key === 'allowances') {
                    Object.keys(faculty.salaryDetails.allowances || {}).forEach(allowanceKey => {
                        const field = form.querySelector(`[name="${allowanceKey}"]`);
                        if (field) {
                            field.value = faculty.salaryDetails.allowances[allowanceKey] || 0;
                        }
                    });
                } else if (key === 'bankDetails') {
                    Object.keys(faculty.salaryDetails.bankDetails || {}).forEach(bankKey => {
                        const field = form.querySelector(`[name="${bankKey}"]`);
                        if (field) {
                            field.value = faculty.salaryDetails.bankDetails[bankKey] || '';
                        }
                    });
                } else {
                    const field = form.querySelector(`[name="${key}"]`);
                    if (field) {
                        field.value = faculty.salaryDetails[key] || '';
                    }
                }
            });

            // Handle subjects checkboxes
            this.populateSubjectsCheckboxes();
            if (faculty.personalDetails.subjects) {
                faculty.personalDetails.subjects.forEach(subject => {
                    const checkbox = form.querySelector(`input[name="subjects"][value="${subject}"]`);
                    if (checkbox) {
                        checkbox.checked = true;
                    }
                });
            }

        } catch (error) {
            console.error('Error filling faculty form:', error);
            utils.showAlert('Error loading faculty data into form', 'error');
        }
    }

    populateSubjectsCheckboxes() {
        const subjectsContainer = document.getElementById('subjectsCheckboxes');
        if (!subjectsContainer) return;
        
        const subjects = [
            'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English',
            'Hindi', 'Social Science', 'Computer Science', 'Economics',
            'Accountancy', 'Business Studies', 'Geography', 'History',
            'Political Science', 'Psychology', 'Sociology'
        ];
        
        subjectsContainer.innerHTML = subjects.map(subject => `
            <label class="checkbox-label">
                <input type="checkbox" name="subjects" value="${subject}">
                <span class="checkbox-custom"></span>
                ${subject}
            </label>
        `).join('');
    }



    // Update the editFaculty method to ensure proper editing
async editFaculty(facultyId) {
    try {
        let faculty = this.faculty.find(f => f._id === facultyId);
        
        if (!faculty) {
            utils.showAlert('Loading faculty data...', 'info');
            const response = await api.getFaculty(facultyId);
            faculty = response.data;
        }

        if (faculty) {
            // Ensure all required objects exist
            if (!faculty.personalDetails) faculty.personalDetails = {};
            if (!faculty.salaryDetails) faculty.salaryDetails = {};
            
            this.openFacultyModal(faculty);
        } else {
            utils.showAlert('Faculty not found', 'error');
        }
    } catch (error) {
        console.error('Error loading faculty for editing:', error);
        utils.showAlert('Error loading faculty data for editing', 'error');
    }
}

// Complete fillFacultyForm method with all field handling
fillFacultyForm(faculty) {
    const form = document.getElementById('facultyForm');
    if (!form || !faculty) return;
    
    try {
        // Ensure data objects exist
        const personalDetails = faculty.personalDetails || {};
        const salaryDetails = faculty.salaryDetails || {};
        
        console.log('Filling form with faculty data:', faculty); // Debug log
        
        // Fill all personal details fields
        const personalFields = [
            'fullName', 'dateOfBirth', 'gender', 'phone', 'email', 
            'address', 'qualification', 'specialization', 'experience', 'employmentType'
        ];
        
        personalFields.forEach(fieldName => {
            const field = form.querySelector(`[name="${fieldName}"]`);
            if (field) {
                const value = personalDetails[fieldName] || '';
                
                if (field.type === 'checkbox') {
                    field.checked = !!value;
                } else if (field.tagName === 'SELECT') {
                    field.value = value;
                    // If value doesn't exist in options, add it
                    if (value && !Array.from(field.options).some(option => option.value === value)) {
                        const option = document.createElement('option');
                        option.value = value;
                        option.textContent = value;
                        field.appendChild(option);
                    }
                } else if (field.tagName === 'TEXTAREA') {
                    field.value = value;
                } else {
                    field.value = value;
                }
                
                console.log(`Set ${fieldName} to:`, value); // Debug log
            }
        });

        // Fill monthly salary field
        const monthlySalaryField = form.querySelector(`[name="monthlySalary"]`);
        if (monthlySalaryField) {
            const salaryValue = salaryDetails.monthlySalary || salaryDetails.totalSalary || salaryDetails.basicSalary || '';
            monthlySalaryField.value = salaryValue;
            console.log('Set monthlySalary to:', salaryValue); // Debug log
        }

        // Handle subjects checkboxes
        this.populateSubjectsCheckboxes();
        
        // Clear all checkboxes first
        const subjectCheckboxes = form.querySelectorAll('input[name="subjects"]');
        subjectCheckboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Check the subjects this faculty teaches
        if (personalDetails.subjects && Array.isArray(personalDetails.subjects)) {
            personalDetails.subjects.forEach(subject => {
                const checkbox = form.querySelector(`input[name="subjects"][value="${subject}"]`);
                if (checkbox) {
                    checkbox.checked = true;
                    console.log('Checked subject:', subject); // Debug log
                } else {
                    console.log('Subject checkbox not found for:', subject); // Debug log
                }
            });
        }

        // Switch to first tab to show populated data
        this.switchFormTab('personal');

    } catch (error) {
        console.error('Error filling faculty form:', error);
        utils.showAlert('Error loading faculty data into form', 'error');
    }
}

// Add method to switch form tabs
switchFormTab(tabName) {
    // Remove active class from all tabs and content
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Add active class to specified tab and content
    const tabBtn = document.querySelector(`[data-tab="${tabName}"]`);
    const tabContent = document.getElementById(tabName);
    
    if (tabBtn) tabBtn.classList.add('active');
    if (tabContent) tabContent.classList.add('active');
}

// Complete handleFacultySubmit method for both create and update
async handleFacultySubmit(e) {
    e.preventDefault();
    
    try {
        const formData = new FormData(e.target);
        
        // Get all form data
        const selectedSubjects = Array.from(formData.getAll('subjects'));
        const monthlySalary = formData.get('monthlySalary')?.trim() || '';
        
        const facultyData = {
            personalDetails: {
                fullName: formData.get('fullName')?.trim() || '',
                dateOfBirth: formData.get('dateOfBirth') || new Date(),
                gender: formData.get('gender') || 'Male',
                phone: formData.get('phone')?.trim() || '9999999999',
                email: formData.get('email')?.trim() || 'faculty@example.com',
                address: formData.get('address')?.trim() || 'Address not provided',
                qualification: formData.get('qualification')?.trim() || 'Not specified',
                specialization: formData.get('specialization')?.trim() || 'Not specified',
                experience: formData.get('experience')?.trim() || 'Not specified',
                employmentType: formData.get('employmentType') || 'Full-time',
                subjects: selectedSubjects,
                status: 'Active'
            },
            salaryDetails: {
                monthlySalary: monthlySalary,
                totalSalary: monthlySalary, // Keep for backward compatibility
                basicSalary: monthlySalary, // Keep for backward compatibility
                allowances: {
                    hra: 0,
                    transport: 0,
                    medical: 0,
                    other: 0
                }
            }
        };

        console.log('Submitting faculty data:', facultyData); // Debug log

        // Only check if name is provided (minimal validation)
        if (!facultyData.personalDetails.fullName) {
            utils.showAlert('Please enter at least the faculty name', 'error');
            return;
        }

        // Preserve existing data for edit mode
        if (this.isEditMode && this.currentFaculty) {
            // Merge with existing data to preserve required fields
            const existingPersonal = this.currentFaculty.personalDetails || {};
            const existingSalary = this.currentFaculty.salaryDetails || {};
            
            facultyData.personalDetails = {
                ...existingPersonal,
                ...facultyData.personalDetails,
                facultyId: existingPersonal.facultyId,
                status: existingPersonal.status || 'Active'
            };
            
            facultyData.salaryDetails = {
                ...existingSalary,
                ...facultyData.salaryDetails,
                salaryHistory: existingSalary.salaryHistory || []
            };
        }

        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            submitBtn.disabled = true;
        }

        let response;
        if (this.isEditMode && this.currentFaculty) {
            console.log('Updating faculty with ID:', this.currentFaculty._id); // Debug log
            response = await api.updateFaculty(this.currentFaculty._id, facultyData);
            utils.showAlert(`${facultyData.personalDetails.fullName} updated successfully!`, 'success');
        } else {
            console.log('Creating new faculty'); // Debug log
            response = await api.createFaculty(facultyData);
            utils.showAlert(`${facultyData.personalDetails.fullName} added successfully! ID: ${response.data.personalDetails.facultyId}`, 'success');
        }
        
        this.closeFacultyModal();
        await this.loadFaculty();
        this.renderFaculty();
        
    } catch (error) {
        console.error('Error saving faculty:', error);
        let errorMessage = 'Error saving faculty. Please try again.';
        
        // Handle specific error types
        if (error.message) {
            if (error.message.includes('phone')) {
                errorMessage = 'Phone number already exists. Please use a different phone number.';
            } else if (error.message.includes('email')) {
                errorMessage = 'Email already exists. Please use a different email address.';
            } else if (error.message.includes('validation')) {
                errorMessage = 'Please check your input data and try again.';
            } else {
                errorMessage = error.message;
            }
        }
        
        utils.showAlert(errorMessage, 'error');
    } finally {
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            const buttonText = this.isEditMode ? 'Update Faculty' : 'Save Faculty';
            const iconClass = this.isEditMode ? 'fas fa-save' : 'fas fa-user-plus';
            submitBtn.innerHTML = `<i class="${iconClass}"></i> ${buttonText}`;
            submitBtn.disabled = false;
        }
    }
}

// Enhanced openFacultyModal with better debugging
openFacultyModal(faculty = null) {
    console.log('Opening faculty modal with data:', faculty); // Debug log
    
    this.currentFaculty = faculty;
    this.isEditMode = !!faculty;
    
    const modal = document.getElementById('facultyModal');
    const form = document.getElementById('facultyForm');
    const modalTitle = document.getElementById('facultyModalTitle');
    
    if (!modal || !form) {
        console.error('Modal or form not found'); // Debug log
        return;
    }

    if (faculty) {
        const facultyName = faculty.personalDetails?.fullName || 'Unknown Faculty';
        if (modalTitle) modalTitle.textContent = `Edit Faculty - ${facultyName}`;
        
        // Fill form with faculty data
        this.fillFacultyForm(faculty);
    } else {
        if (modalTitle) modalTitle.textContent = 'Add New Faculty';
        form.reset();
        this.isEditMode = false;
        this.populateSubjectsCheckboxes();
    }
    
    modal.style.display = 'block';
    
    // Focus on first field
    setTimeout(() => {
        const firstInput = form.querySelector('input[name="fullName"]');
        if (firstInput) {
            firstInput.focus();
        }
    }, 100);
}

// Enhanced renderFaculty method to ensure edit button works
renderFaculty() {
    const tbody = document.getElementById('facultyTableBody');
    if (!tbody) return;
    
    if (this.faculty.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 3rem;">
                    <i class="fas fa-chalkboard-teacher" style="font-size: 3rem; color: #ddd; margin-bottom: 1rem; display: block;"></i>
                    <h4 style="color: #666; margin-bottom: 0.5rem;">No Faculty Found</h4>
                    <p style="color: #999; margin-bottom: 1.5rem;">Add your first faculty member to get started</p>
                    <button class="btn-primary" onclick="facultyManager.openFacultyModal()">
                        <i class="fas fa-plus"></i> Add First Faculty
                    </button>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = this.faculty.map(faculty => {
        const personalDetails = faculty.personalDetails || {};
        const salaryDetails = faculty.salaryDetails || {};
        const subjects = personalDetails.subjects || [];
        
        const subjectsDisplay = subjects.length > 0 
            ? subjects.slice(0, 2).map(sub => `<span class="subject-badge-sm">${sub}</span>`).join(' ') +
              (subjects.length > 2 ? `<span class="subject-more">+${subjects.length - 2}</span>` : '')
            : '<span class="text-muted">No subjects assigned</span>';

        // Display salary as is - no formatting
        const salaryDisplay = salaryDetails.monthlySalary || salaryDetails.totalSalary || 'Not specified';

        return `
            <tr data-faculty-id="${faculty._id}">
                <td>
                    <strong>${personalDetails.facultyId || 'N/A'}</strong>
                </td>
                <td>
                    <span class="clickable-name" onclick="facultyManager.viewFacultyDetails('${faculty._id}')">
                        <strong>${personalDetails.fullName || 'No Name'}</strong>
                    </span>
                    <br>
                    <small style="color: #666;">${personalDetails.phone || 'No Phone'}</small>
                </td>
                <td>${personalDetails.specialization || 'Not specified'}</td>
                <td>
                    <div class="subjects-display">
                        ${subjectsDisplay}
                    </div>
                </td>
                <td>
                    <strong>${salaryDisplay}</strong>
                    <br>
                    <small style="color: #666;">${personalDetails.employmentType || 'Not specified'}</small>
                </td>
                <td style="text-align: center;">
                    <span class="status-badge status-${(personalDetails.status || 'active').toLowerCase()}">
                        <i class="fas fa-circle"></i> ${personalDetails.status || 'Active'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action" onclick="facultyManager.viewFacultyDetails('${faculty._id}')" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-action" onclick="facultyManager.exportFacultyData('${faculty._id}')" title="Export Faculty Data">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="btn-action btn-edit" onclick="facultyManager.editFaculty('${faculty._id}')" title="Edit Faculty" data-faculty-id="${faculty._id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action btn-danger" onclick="facultyManager.deleteFaculty('${faculty._id}')" title="Delete Faculty">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}


    async deleteFaculty(facultyId) {
        try {
            const faculty = this.faculty.find(f => f._id === facultyId);
            if (!faculty) {
                utils.showAlert('Faculty not found', 'error');
                return;
            }

            const confirmMessage = `Are you sure you want to delete faculty?\n\n📋 Name: ${faculty.personalDetails.fullName}\n🆔 ID: ${faculty.personalDetails.facultyId}\n📧 Email: ${faculty.personalDetails.email}\n📞 Phone: ${faculty.personalDetails.phone}\n\n⚠️ This action cannot be undone and will delete all salary records!`;
            
            if (!confirm(confirmMessage)) {
                return;
            }

            utils.showAlert('Deleting faculty...', 'info');

            await api.deleteFaculty(facultyId);
            utils.showAlert(`${faculty.personalDetails.fullName} deleted successfully!`, 'success');
            
            await this.loadFaculty();
            this.renderFaculty();
            
        } catch (error) {
            console.error('Error deleting faculty:', error);
            utils.showAlert(error.message || 'Error deleting faculty', 'error');
        }
    }

    // ==================== FACULTY DETAILS VIEW ====================

   // Update the viewFacultyDetails method with proper error handling
async viewFacultyDetails(facultyId) {
    try {
        utils.showLoading(document.body, true);
        
        const response = await api.getFaculty(facultyId);
        const faculty = response.data;
        
        // Add null checks
        if (!faculty) {
            utils.showAlert('Faculty data not found', 'error');
            return;
        }
        
        if (!faculty.personalDetails) {
            faculty.personalDetails = {};
        }
        
        if (!faculty.salaryDetails) {
            faculty.salaryDetails = {};
        }
        
        this.currentFacultyForDetails = faculty;
        
        const modal = document.getElementById('facultyDetailsModal');
        const title = document.getElementById('facultyDetailsTitle');
        
        if (title) {
            const facultyName = faculty.personalDetails.fullName || 'Unknown Faculty';
            title.textContent = `${facultyName} - Complete Details`;
        }
        
        this.fillFacultyPersonalInfo(faculty);
        this.fillFacultySalaryInfo(faculty);
        
        if (modal) {
            modal.style.display = 'block';
        }
        
        this.switchDetailsTab('personal');
        
    } catch (error) {
        console.error('Error loading faculty details:', error);
        utils.showAlert('Error loading faculty details', 'error');
    } finally {
        utils.showLoading(document.body, false);
    }
}

// Update the fillFacultyPersonalInfo method with null checks
fillFacultyPersonalInfo(faculty) {
    const infoDiv = document.getElementById('facultyPersonalInfo');
    if (!infoDiv) return;

    // Ensure personalDetails exists with defaults
    const personalDetails = faculty.personalDetails || {};
    const joinDate = utils.formatDate(faculty.createdAt);
    const subjects = personalDetails.subjects || [];
    const subjectsDisplay = subjects.length > 0 
        ? subjects.map(sub => `<span class="subject-badge">${sub}</span>`).join(' ')
        : '<span class="text-muted">No subjects assigned</span>';
    
    infoDiv.innerHTML = `
        <div class="faculty-info-grid">
            <div class="info-section">
                <h4><i class="fas fa-user"></i> Personal Information</h4>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">Faculty ID:</span>
                        <span class="info-value highlight">${personalDetails.facultyId || 'Not assigned'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Full Name:</span>
                        <span class="info-value">${personalDetails.fullName || 'Not provided'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Date of Birth:</span>
                        <span class="info-value">${personalDetails.dateOfBirth ? utils.formatDate(personalDetails.dateOfBirth) : 'Not provided'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Gender:</span>
                        <span class="info-value">${personalDetails.gender || 'Not specified'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Phone Number:</span>
                        <span class="info-value">${personalDetails.phone || 'Not provided'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Email:</span>
                        <span class="info-value">${personalDetails.email || 'Not provided'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Address:</span>
                        <span class="info-value">${personalDetails.address || 'Not provided'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Join Date:</span>
                        <span class="info-value">${joinDate}</span>
                    </div>
                </div>
            </div>

            <div class="info-section">
                <h4><i class="fas fa-graduation-cap"></i> Professional Information</h4>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">Qualification:</span>
                        <span class="info-value">${personalDetails.qualification || 'Not provided'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Specialization:</span>
                        <span class="info-value">${personalDetails.specialization || 'Not provided'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Experience:</span>
                        <span class="info-value">${personalDetails.experience || 'Not provided'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Employment Type:</span>
                        <span class="info-value">${personalDetails.employmentType || 'Not specified'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Status:</span>
                        <span class="info-value">
                            <span class="status-badge status-${(personalDetails.status || 'active').toLowerCase()}">
                                ${personalDetails.status || 'Active'}
                            </span>
                        </span>
                    </div>
                    <div class="info-item" style="grid-column: 1 / -1;">
                        <span class="info-label">Subjects Teaching:</span>
                        <div class="subjects-list">
                            ${subjectsDisplay}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Update the exportFacultyData method with null checks
async exportFacultyData(facultyId) {
    try {
        const response = await api.getFaculty(facultyId);
        const faculty = response.data;
        
        if (!faculty) {
            utils.showAlert('Faculty not found', 'error');
            return;
        }

        // Ensure required objects exist
        const personalDetails = faculty.personalDetails || {};
        const salaryDetails = faculty.salaryDetails || {};

        const exportData = {
            personal: {
                'Faculty ID': personalDetails.facultyId || 'N/A',
                'Full Name': personalDetails.fullName || 'N/A',
                'Date of Birth': personalDetails.dateOfBirth ? utils.formatDate(personalDetails.dateOfBirth) : 'N/A',
                'Gender': personalDetails.gender || 'N/A',
                'Phone': personalDetails.phone || 'N/A',
                'Email': personalDetails.email || 'N/A',
                'Address': personalDetails.address || 'N/A',
                'Qualification': personalDetails.qualification || 'N/A',
                'Specialization': personalDetails.specialization || 'N/A',
                'Experience': personalDetails.experience || 'N/A',
                'Employment Type': personalDetails.employmentType || 'N/A',
                'Status': personalDetails.status || 'Active',
                'Join Date': utils.formatDate(faculty.createdAt),
                'Subjects': personalDetails.subjects ? personalDetails.subjects.join(', ') : 'N/A'
            },
            salary: {
                'Monthly Salary': salaryDetails.monthlySalary || salaryDetails.totalSalary || 'N/A'
            },
            salaryHistory: salaryDetails.salaryHistory || []
        };

        let csvContent = 'AADASH COACHING CENTER - FACULTY REPORT\n';
        csvContent += `Generated: ${new Date().toLocaleString()}\n\n`;
        
        csvContent += 'PERSONAL DETAILS\n';
        csvContent += 'Field,Value\n';
        Object.entries(exportData.personal).forEach(([key, value]) => {
            csvContent += `"${key}","${value}"\n`;
        });
        
        csvContent += '\nSALARY DETAILS\n';
        csvContent += 'Field,Value\n';
        Object.entries(exportData.salary).forEach(([key, value]) => {
            csvContent += `"${key}","${value}"\n`;
        });
        
        csvContent += '\nSALARY HISTORY\n';
        csvContent += 'Month,Amount,Deductions,Net Amount,Payment Date,Remarks\n';
        exportData.salaryHistory.forEach(salary => {
            csvContent += `"${salary.month || 'N/A'}","${salary.amount || 'N/A'}","${salary.deductions || 'N/A'}","${salary.netAmount || 'N/A'}","${salary.paidDate ? utils.formatDate(salary.paidDate) : 'N/A'}","${salary.remarks || 'N/A'}"\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const fileName = `${personalDetails.facultyId || 'Unknown'}_${(personalDetails.fullName || 'Unknown').replace(/\s+/g, '_')}_Report.csv`;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        utils.showAlert('Faculty data exported successfully!', 'success');
        
    } catch (error) {
        console.error('Error exporting faculty data:', error);
        utils.showAlert('Error exporting faculty data', 'error');
    }
}


    fillFacultyPersonalInfo(faculty) {
        const infoDiv = document.getElementById('facultyPersonalInfo');
        if (!infoDiv) return;

        const joinDate = utils.formatDate(faculty.createdAt);
        const subjects = faculty.personalDetails.subjects || [];
        const subjectsDisplay = subjects.length > 0 
            ? subjects.map(sub => `<span class="subject-badge">${sub}</span>`).join(' ')
            : '<span class="text-muted">No subjects assigned</span>';
        
        infoDiv.innerHTML = `
            <div class="faculty-info-grid">
                <div class="info-section">
                    <h4><i class="fas fa-user"></i> Personal Information</h4>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">Faculty ID:</span>
                            <span class="info-value highlight">${faculty.personalDetails.facultyId}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Full Name:</span>
                            <span class="info-value">${faculty.personalDetails.fullName}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Date of Birth:</span>
                            <span class="info-value">${faculty.personalDetails.dateOfBirth ? utils.formatDate(faculty.personalDetails.dateOfBirth) : 'Not provided'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Gender:</span>
                            <span class="info-value">${faculty.personalDetails.gender || 'Not specified'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Phone Number:</span>
                            <span class="info-value">${faculty.personalDetails.phone}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Email:</span>
                            <span class="info-value">${faculty.personalDetails.email}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Address:</span>
                            <span class="info-value">${faculty.personalDetails.address || 'Not provided'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Join Date:</span>
                            <span class="info-value">${joinDate}</span>
                        </div>
                    </div>
                </div>

                <div class="info-section">
                    <h4><i class="fas fa-graduation-cap"></i> Professional Information</h4>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">Qualification:</span>
                            <span class="info-value">${faculty.personalDetails.qualification || 'Not provided'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Specialization:</span>
                            <span class="info-value">${faculty.personalDetails.specialization || 'Not provided'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Experience:</span>
                            <span class="info-value">${faculty.personalDetails.experience || 'Not provided'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Employment Type:</span>
                            <span class="info-value">${faculty.personalDetails.employmentType || 'Not specified'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Status:</span>
                            <span class="info-value">
                                <span class="status-badge status-${faculty.personalDetails.status.toLowerCase()}">
                                    ${faculty.personalDetails.status}
                                </span>
                            </span>
                        </div>
                        <div class="info-item" style="grid-column: 1 / -1;">
                            <span class="info-label">Subjects Teaching:</span>
                            <div class="subjects-list">
                                ${subjectsDisplay}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    fillFacultySalaryInfo(faculty) {
                const salaryDiv = document.getElementById('facultySalaryInfo');
        if (!salaryDiv) return;

        const salaryDetails = faculty.salaryDetails || {};
        const bankDetails = salaryDetails.bankDetails || {};
        const allowances = salaryDetails.allowances || {};

        salaryDiv.innerHTML = `
            <div class="faculty-info-grid">
                <div class="info-section">
                    <h4><i class="fas fa-rupee-sign"></i> Salary Breakdown</h4>
                    <div class="salary-breakdown">
                        <div class="salary-item">
                            <span class="salary-label">Basic Salary</span>
                            <span class="salary-value">${utils.formatCurrency(salaryDetails.basicSalary || 0)}</span>
                        </div>
                        <div class="salary-item">
                            <span class="salary-label">HRA</span>
                            <span class="salary-value">${utils.formatCurrency(allowances.hra || 0)}</span>
                        </div>
                        <div class="salary-item">
                            <span class="salary-label">Transport Allowance</span>
                            <span class="salary-value">${utils.formatCurrency(allowances.transport || 0)}</span>
                        </div>
                        <div class="salary-item">
                            <span class="salary-label">Medical Allowance</span>
                            <span class="salary-value">${utils.formatCurrency(allowances.medical || 0)}</span>
                        </div>
                        <div class="salary-item">
                            <span class="salary-label">Other Allowance</span>
                            <span class="salary-value">${utils.formatCurrency(allowances.other || 0)}</span>
                        </div>
                        <div class="salary-item total">
                            <span class="salary-label">Total Monthly Salary</span>
                            <span class="salary-value total-amount">${utils.formatCurrency(salaryDetails.totalSalary || 0)}</span>
                        </div>
                    </div>
                </div>

                <div class="info-section">
                    <h4><i class="fas fa-university"></i> Bank Details</h4>
                    <div class="bank-details">
                        <h5><i class="fas fa-credit-card"></i> Payment Information</h5>
                        <div class="bank-info">
                            <div class="bank-item">
                                <span class="info-label">Payment Mode:</span>
                                <span class="info-value">${salaryDetails.paymentMode || 'Not specified'}</span>
                            </div>
                            <div class="bank-item">
                                <span class="info-label">Bank Name:</span>
                                <span class="info-value">${bankDetails.bankName || 'Not provided'}</span>
                            </div>
                            <div class="bank-item">
                                <span class="info-label">Account Number:</span>
                                <span class="info-value">${bankDetails.accountNumber || 'Not provided'}</span>
                            </div>
                            <div class="bank-item">
                                <span class="info-label">IFSC Code:</span>
                                <span class="info-value">${bankDetails.ifscCode || 'Not provided'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            ${salaryDetails.salaryHistory && salaryDetails.salaryHistory.length > 0 ? `
            <div class="salary-history-section">
                <h4><i class="fas fa-history"></i> Salary Payment History</h4>
                <div class="table-responsive">
                    <table class="salary-history-table">
                        <thead>
                            <tr>
                                <th>Month</th>
                                <th>Amount</th>
                                <th>Deductions</th>
                                <th>Net Amount</th>
                                <th>Payment Date</th>
                                <th>Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${salaryDetails.salaryHistory
                                .sort((a, b) => new Date(b.paidDate) - new Date(a.paidDate))
                                .map(salary => `
                                    <tr>
                                        <td><strong>${salary.month}</strong></td>
                                        <td>${utils.formatCurrency(salary.amount || 0)}</td>
                                        <td>${utils.formatCurrency(salary.deductions || 0)}</td>
                                        <td><strong>${utils.formatCurrency(salary.netAmount || 0)}</strong></td>
                                        <td>${utils.formatDate(salary.paidDate)}</td>
                                        <td>${salary.remarks || 'No remarks'}</td>
                                    </tr>
                                `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            ` : `
            <div class="no-payments">
                <div class="no-payments-content">
                    <i class="fas fa-history"></i>
                    <h4>No Salary Payment Records</h4>
                    <p>No salary payments have been recorded for this faculty member yet.</p>
                </div>
            </div>
            `}
        `;
    }

    switchDetailsTab(tabName) {
        document.querySelectorAll('.details-tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.details-tab-content').forEach(content => content.classList.remove('active'));
        
        const tabBtn = document.querySelector(`[data-tab="${tabName}"]`);
        const tabContent = document.getElementById(`${tabName}-details-tab`);
        
        if (tabBtn) tabBtn.classList.add('active');
        if (tabContent) tabContent.classList.add('active');
    }

    closeFacultyDetailsModal() {
        const modal = document.getElementById('facultyDetailsModal');
        if (modal) {
            modal.style.display = 'none';
        }
        this.currentFacultyForDetails = null;
    }

    // ==================== EXPORT FACULTY DATA ====================

    async exportFacultyData(facultyId) {
        try {
            const response = await api.getFaculty(facultyId);
            const faculty = response.data;
            
            if (!faculty) {
                utils.showAlert('Faculty not found', 'error');
                return;
            }

            const exportData = {
                personal: {
                    'Faculty ID': faculty.personalDetails.facultyId,
                    'Full Name': faculty.personalDetails.fullName,
                    'Date of Birth': faculty.personalDetails.dateOfBirth ? utils.formatDate(faculty.personalDetails.dateOfBirth) : 'N/A',
                    'Gender': faculty.personalDetails.gender || 'N/A',
                    'Phone': faculty.personalDetails.phone,
                    'Email': faculty.personalDetails.email,
                    'Address': faculty.personalDetails.address || 'N/A',
                    'Qualification': faculty.personalDetails.qualification || 'N/A',
                    'Specialization': faculty.personalDetails.specialization || 'N/A',
                    'Experience': faculty.personalDetails.experience || 'N/A',
                    'Employment Type': faculty.personalDetails.employmentType || 'N/A',
                    'Status': faculty.personalDetails.status,
                    'Join Date': utils.formatDate(faculty.createdAt),
                    'Subjects': faculty.personalDetails.subjects ? faculty.personalDetails.subjects.join(', ') : 'N/A'
                },
                salary: {
                    'Basic Salary': utils.formatCurrency(faculty.salaryDetails.basicSalary || 0),
                    'HRA': utils.formatCurrency(faculty.salaryDetails.allowances?.hra || 0),
                    'Transport Allowance': utils.formatCurrency(faculty.salaryDetails.allowances?.transport || 0),
                    'Medical Allowance': utils.formatCurrency(faculty.salaryDetails.allowances?.medical || 0),
                    'Other Allowance': utils.formatCurrency(faculty.salaryDetails.allowances?.other || 0),
                    'Total Salary': utils.formatCurrency(faculty.salaryDetails.totalSalary || 0),
                    'Payment Mode': faculty.salaryDetails.paymentMode || 'N/A',
                    'Bank Name': faculty.salaryDetails.bankDetails?.bankName || 'N/A',
                    'Account Number': faculty.salaryDetails.bankDetails?.accountNumber || 'N/A',
                    'IFSC Code': faculty.salaryDetails.bankDetails?.ifscCode || 'N/A'
                },
                salaryHistory: faculty.salaryDetails.salaryHistory || []
            };

            let csvContent = 'AADASH COACHING CENTER - FACULTY REPORT\n';
            csvContent += `Generated: ${new Date().toLocaleString()}\n\n`;
            
            csvContent += 'PERSONAL DETAILS\n';
            csvContent += 'Field,Value\n';
            Object.entries(exportData.personal).forEach(([key, value]) => {
                csvContent += `"${key}","${value}"\n`;
            });
            
            csvContent += '\nSALARY DETAILS\n';
            csvContent += 'Field,Value\n';
            Object.entries(exportData.salary).forEach(([key, value]) => {
                csvContent += `"${key}","${value}"\n`;
            });
            
            csvContent += '\nSALARY HISTORY\n';
            csvContent += 'Month,Amount,Deductions,Net Amount,Payment Date,Remarks\n';
            exportData.salaryHistory.forEach(salary => {
                csvContent += `"${salary.month}","${utils.formatCurrency(salary.amount || 0)}","${utils.formatCurrency(salary.deductions || 0)}","${utils.formatCurrency(salary.netAmount || 0)}","${utils.formatDate(salary.paidDate)}","${salary.remarks || 'N/A'}"\n`;
            });

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${faculty.personalDetails.facultyId}_${faculty.personalDetails.fullName.replace(/\s+/g, '_')}_Report.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            utils.showAlert('Faculty data exported successfully!', 'success');
            
        } catch (error) {
            console.error('Error exporting faculty data:', error);
            utils.showAlert('Error exporting faculty data', 'error');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.facultyManager = new FacultyManager();
});




