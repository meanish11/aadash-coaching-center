class DashboardManager {
    constructor() {
        this.students = [];
        this.faculty = [];
        this.classes = [];
        this.currentStudent = null;
        this.currentFaculty = null;
        this.filteredStudents = [];
        this.init();
    }

    async init() {
        try {
            this.bindEvents();
            await this.loadDashboardData();
            this.updateDashboard();
        } catch (error) {
            console.error('Dashboard initialization error:', error);
            utils.showAlert('Error loading dashboard data', 'error');
        }
    }

    bindEvents() {
        // Class filter for students overview
        const dashboardClassFilter = document.getElementById('dashboardClassFilter');
        if (dashboardClassFilter) {
            dashboardClassFilter.addEventListener('change', () => {
                this.filterStudentsOverview();
            });
        }

        // Student modal events
        document.getElementById('closeDashboardStudentModal')?.addEventListener('click', () => {
            this.closeStudentModal();
        });

        document.getElementById('closeDashboardFacultyModal')?.addEventListener('click', () => {
            this.closeFacultyModal();
        });

        // Tab switching for modals
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('details-tab-btn')) {
                this.switchDetailsTab(e.target.dataset.tab);
            }
        });

        // Edit form submission
        document.getElementById('dashboardStudentEditForm')?.addEventListener('submit', (e) => {
            this.handleStudentUpdate(e);
        });

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }

    async loadDashboardData() {
        try {
            const [studentsResponse, facultyResponse, classesResponse] = await Promise.all([
                api.getStudents(),
                api.getFaculty(),
                api.getClasses()
            ]);

            this.students = studentsResponse.data || [];
            this.faculty = facultyResponse.data || [];
            this.classes = classesResponse.data || [];
            this.filteredStudents = [...this.students];
            
            this.populateClassFilter();
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.students = [];
            this.faculty = [];
            this.classes = [];
            this.filteredStudents = [];
        }
    }

    populateClassFilter() {
        const classFilter = document.getElementById('dashboardClassFilter');
        if (!classFilter) return;

        classFilter.innerHTML = '<option value="">All Classes</option>';
        
        this.classes.forEach(classItem => {
            const option = document.createElement('option');
            option.value = classItem.className;
            option.textContent = classItem.className;
            classFilter.appendChild(option);
        });
    }

    filterStudentsOverview() {
        const selectedClass = document.getElementById('dashboardClassFilter')?.value || '';
        
        this.filteredStudents = selectedClass 
            ? this.students.filter(student => student.personalDetails.className === selectedClass)
            : [...this.students];
            
        this.updateStudentsOverview();
    }

    updateDashboard() {
        this.updateStatCards();
        this.updateStudentsOverview();
        this.updateFacultyOverview();
    }

    updateStatCards() {
        const totalStudentsEl = document.getElementById('totalStudents');
        const totalFacultyEl = document.getElementById('totalFaculty');
        const totalClassesEl = document.getElementById('totalClasses');

        if (totalStudentsEl) {
            totalStudentsEl.innerHTML = this.students.length || 0;
        }

        if (totalFacultyEl) {
            totalFacultyEl.innerHTML = this.faculty.length || 0;
        }

        if (totalClassesEl) {
            totalClassesEl.innerHTML = this.classes.length || 0;
        }
    }

    updateStudentsOverview() {
        const tbody = document.getElementById('studentsOverview');
        if (!tbody) return;

        if (this.filteredStudents.length === 0) {
            const selectedClass = document.getElementById('dashboardClassFilter')?.value || '';
            const message = selectedClass 
                ? `No students found in class "${selectedClass}"`
                : 'No students found';
                
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 2rem;">
                        <i class="fas fa-users" style="font-size: 2rem; color: #ddd;"></i>
                        <p>${message}</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.filteredStudents.slice(0, 15).map(student => {
            const dueAmount = student.calculatedDue || 0;
            const dueColor = dueAmount > 0 ? '#dc3545' : dueAmount < 0 ? '#17a2b8' : '#28a745';
            
            return `
                <tr>
                    <td>${student.personalDetails.studentId}</td>
                    <td>
                        <span class="clickable-name" onclick="dashboardManager.viewStudentDetails('${student._id}')">
                            ${student.personalDetails.fullName}
                        </span>
                    </td>
                    <td><span class="class-badge">${student.personalDetails.className}</span></td>
                    <td>${student.personalDetails.phone}</td>
                    <td>${utils.formatCurrency(student.feeDetails.monthlyFee || 0)}</td>
                    <td style="color: ${dueColor}; font-weight: bold;">
                        ${utils.formatCurrency(Math.abs(dueAmount))}
                    </td>
                    <td>
                        <span class="status-${student.personalDetails.status.toLowerCase()}">
                            ${student.personalDetails.status}
                        </span>
                    </td>
                    <td>
                        <button class="btn-sm btn-edit" onclick="dashboardManager.editStudentProfile('${student._id}')" title="Edit Profile">
                            <i class="fas fa-edit"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    updateFacultyOverview() {
        const tbody = document.getElementById('facultyOverview');
        if (!tbody) return;

        if (this.faculty.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 2rem;">
                        <i class="fas fa-chalkboard-teacher" style="font-size: 2rem; color: #ddd;"></i>
                        <p>No faculty members found</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.faculty.slice(0, 10).map(faculty => {
            const lastPayment = faculty.salaryDetails.salaryHistory && faculty.salaryDetails.salaryHistory.length > 0 
                ? faculty.salaryDetails.salaryHistory[faculty.salaryDetails.salaryHistory.length - 1]
                : null;

            return `
                <tr>
                    <td>${faculty.personalDetails.facultyId}</td>
                    <td>
                        <span class="clickable-name" onclick="dashboardManager.viewFacultyDetails('${faculty._id}')">
                            ${faculty.personalDetails.fullName}
                        </span>
                    </td>
                    <td>
                        ${faculty.personalDetails.subjects.map(subject => 
                            `<span class="subject-badge-sm">${subject}</span>`
                        ).join(' ')}
                    </td>
                    <td>${faculty.personalDetails.phone}</td>
                    <td>${utils.formatCurrency(faculty.salaryDetails.totalSalary || 0)}</td>
                    <td>${lastPayment ? utils.formatDate(lastPayment.paidDate) : 'Never'}</td>
                    <td>
                        <span class="status-${faculty.personalDetails.status.toLowerCase()}">
                            ${faculty.personalDetails.status}
                        </span>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // ... rest of the existing methods remain the same
    async viewStudentDetails(studentId) {
        try {
            const response = await api.getStudent(studentId);
            const student = response.data;
            this.currentStudent = student;
            
            document.getElementById('dashboardStudentTitle').textContent = `${student.personalDetails.fullName} - Complete Details`;
            
            this.fillStudentInfo(student);
            this.fillStudentFees(student);
            this.fillStudentEditForm(student);
            
            document.getElementById('dashboardStudentModal').style.display = 'block';
            this.switchDetailsTab('info');
            
        } catch (error) {
            console.error('Error loading student details:', error);
            utils.showAlert('Error loading student details', 'error');
        }
    }

    fillStudentInfo(student) {
        const infoDiv = document.getElementById('dashboardStudentInfo');
        const dueAmount = student.calculatedDue || 0;
        const dueStatus = dueAmount > 0 ? 'Due' : dueAmount < 0 ? 'Overpaid' : 'Up to Date';
        const dueColor = dueAmount > 0 ? '#dc3545' : dueAmount < 0 ? '#17a2b8' : '#28a745';
        
        infoDiv.innerHTML = `
            <div class="student-info-grid">
                <div class="info-section">
                    <h4><i class="fas fa-user"></i> Personal Information</h4>
                    <div class="info-grid">
                        <div class="info-item">
                            <label>Student ID:</label>
                            <span>${student.personalDetails.studentId}</span>
                        </div>
                        <div class="info-item">
                            <label>Full Name:</label>
                            <span>${student.personalDetails.fullName}</span>
                        </div>
                        <div class="info-item">
                            <label>Father's Name:</label>
                            <span>${student.personalDetails.fatherName}</span>
                        </div>
                        <div class="info-item">
                            <label>Phone:</label>
                            <span>${student.personalDetails.phone}</span>
                        </div>
                        <div class="info-item">
                            <label>Class:</label>
                            <span>${student.personalDetails.className}</span>
                        </div>
                        <div class="info-item">
                            <label>Status:</label>
                            <span class="status-${student.personalDetails.status.toLowerCase()}">${student.personalDetails.status}</span>
                        </div>
                        <div class="info-item">
                            <label>Admission Date:</label>
                            <span>${utils.formatDate(student.createdAt)}</span>
                        </div>
                    </div>
                </div>
                
                <div class="info-section">
                    <h4><i class="fas fa-rupee-sign"></i> Fee Summary</h4>
                    <div class="fee-summary-cards">
                        <div class="fee-card">
                            <div class="fee-label">Monthly Fee</div>
                            <div class="fee-value">${utils.formatCurrency(student.feeDetails.monthlyFee || 0)}</div>
                        </div>
                        <div class="fee-card">
                            <div class="fee-label">Total Paid</div>
                            <div class="fee-value">${utils.formatCurrency(student.feeDetails.totalPaidAmount || 0)}</div>
                        </div>
                        <div class="fee-card">
                            <div class="fee-label">Due/Overpaid</div>
                            <div class="fee-value" style="color: ${dueColor};">${utils.formatCurrency(Math.abs(dueAmount))}</div>
                            <div class="fee-status" style="color: ${dueColor};">${dueStatus}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    fillStudentFees(student) {
        const feesDiv = document.getElementById('dashboardStudentFees');
        
        if (student.feeDetails.monthlyPayments && student.feeDetails.monthlyPayments.length > 0) {
            const paymentsTable = student.feeDetails.monthlyPayments
                .sort((a, b) => new Date(b.paidDate) - new Date(a.paidDate))
                .map(payment => `
                    <tr>
                        <td>${payment.month} ${payment.year}</td>
                        <td>${utils.formatCurrency(payment.amount)}</td>
                        <td>${utils.formatDate(payment.paidDate)}</td>
                        <td>${payment.paymentMode}</td>
                        <td>
                            <span class="payment-status status-${payment.status.toLowerCase()}">
                                ${payment.status}
                            </span>
                        </td>
                        <td>${payment.receiptNumber}</td>
                    </tr>
                `).join('');

            feesDiv.innerHTML = `
                <h4><i class="fas fa-history"></i> Payment History (${student.feeDetails.monthlyPayments.length} payments)</h4>
                <div class="table-responsive">
                    <table class="payment-history-table">
                        <thead>
                            <tr>
                                <th>Month</th>
                                <th>Amount</th>
                                <th>Payment Date</th>
                                <th>Mode</th>
                                <th>Status</th>
                                <th>Receipt</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${paymentsTable}
                        </tbody>
                    </table>
                </div>
            `;
        } else {
            feesDiv.innerHTML = `
                <div class="no-payments">
                    <i class="fas fa-receipt" style="font-size: 3rem; color: #ddd;"></i>
                    <h4>No Payment History</h4>
                    <p>No payments have been recorded for this student yet.</p>
                </div>
            `;
        }
    }

    fillStudentEditForm(student) {
        const form = document.getElementById('dashboardStudentEditForm');
        if (!form) return;
        
        form.fullName.value = student.personalDetails.fullName;
        form.fatherName.value = student.personalDetails.fatherName;
        form.phone.value = student.personalDetails.phone;
        form.monthlyFee.value = student.feeDetails.monthlyFee || 0;
    }

    async handleStudentUpdate(e) {
        e.preventDefault();
        
        try {
            const formData = new FormData(e.target);
            
            const updateData = {
                personalDetails: {
                    ...this.currentStudent.personalDetails,
                    fullName: formData.get('fullName').trim(),
                    fatherName: formData.get('fatherName').trim(),
                    phone: formData.get('phone').trim()
                },
                feeDetails: {
                    ...this.currentStudent.feeDetails,
                    monthlyFee: parseInt(formData.get('monthlyFee'))
                }
            };

            const submitBtn = e.target.querySelector('button[type="submit"]');
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
            submitBtn.disabled = true;

            await api.updateStudent(this.currentStudent._id, updateData);
            utils.showAlert('Student profile updated successfully!', 'success');
            
            await this.loadDashboardData();
            this.updateDashboard();
            this.closeStudentModal();
            
        } catch (error) {
            console.error('Error updating student:', error);
            utils.showAlert('Error updating student profile', 'error');
        } finally {
            const submitBtn = e.target.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.innerHTML = 'Update Profile';
                submitBtn.disabled = false;
            }
        }
    }

    editStudentProfile(studentId) {
        this.viewStudentDetails(studentId).then(() => {
            this.switchDetailsTab('edit');
        });
    }

    async viewFacultyDetails(facultyId) {
        try {
            const response = await api.getFacultyMember(facultyId);
            const faculty = response.data;
            this.currentFaculty = faculty;
            
            document.getElementById('dashboardFacultyTitle').textContent = `${faculty.personalDetails.fullName} - Complete Details`;
            
            this.fillFacultyInfo(faculty);
            this.fillFacultySalary(faculty);
            
            document.getElementById('dashboardFacultyModal').style.display = 'block';
            this.switchDetailsTab('faculty-info');
            
        } catch (error) {
            console.error('Error loading faculty details:', error);
            utils.showAlert('Error loading faculty details', 'error');
        }
    }

    fillFacultyInfo(faculty) {
        const infoDiv = document.getElementById('dashboardFacultyInfo');
        
        infoDiv.innerHTML = `
            <div class="faculty-info-grid">
                <div class="info-section">
                    <h4><i class="fas fa-user"></i> Personal Information</h4>
                    <div class="info-grid">
                        <div class="info-item">
                            <label>Faculty ID:</label>
                            <span>${faculty.personalDetails.facultyId}</span>
                        </div>
                        <div class="info-item">
                            <label>Full Name:</label>
                            <span>${faculty.personalDetails.fullName}</span>
                        </div>
                        <div class="info-item">
                            <label>Qualification:</label>
                            <span>${faculty.personalDetails.qualification}</span>
                        </div>
                        <div class="info-item">
                            <label>Specialization:</label>
                            <span>${faculty.personalDetails.specialization}</span>
                        </div>
                        <div class="info-item">
                            <label>Experience:</label>
                            <span>${faculty.personalDetails.experience}</span>
                        </div>
                        <div class="info-item">
                            <label>Phone:</label>
                            <span>${faculty.personalDetails.phone}</span>
                        </div>
                        <div class="info-item">
                            <label>Email:</label>
                            <span>${faculty.personalDetails.email}</span>
                        </div>
                        <div class="info-item">
                            <label>Employment Type:</label>
                            <span>${faculty.personalDetails.employmentType}</span>
                        </div>
                        <div class="info-item">
                            <label>Subjects:</label>
                            <span>${faculty.personalDetails.subjects.map(s => `<span class="subject-badge-sm">${s}</span>`).join(' ')}</span>
                        </div>
                        <div class="info-item">
                            <label>Status:</label>
                            <span class="status-${faculty.personalDetails.status.toLowerCase()}">${faculty.personalDetails.status}</span>
                        </div>
                        <div class="info-item">
                            <label>Joining Date:</label>
                            <span>${utils.formatDate(faculty.personalDetails.joiningDate)}</span>
                        </div>
                    </div>
                </div>
                
                <div class="info-section">
                    <h4><i class="fas fa-money-bill-wave"></i> Salary Details</h4>
                    <div class="salary-breakdown">
                        <div class="salary-item">
                            <label>Monthly Salary:</label>
                            <span>${utils.formatCurrency(faculty.salaryDetails.totalSalary)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    fillFacultySalary(faculty) {
        const salaryDiv = document.getElementById('dashboardFacultySalary');
        
        if (faculty.salaryDetails.salaryHistory && faculty.salaryDetails.salaryHistory.length > 0) {
            const salaryTable = faculty.salaryDetails.salaryHistory
                .sort((a, b) => new Date(b.paidDate) - new Date(a.paidDate))
                .map(salary => `
                    <tr>
                        <td>${salary.month}</td>
                        <td>${utils.formatCurrency(salary.amount)}</td>
                        <td>${utils.formatCurrency(salary.deductions || 0)}</td>
                        <td>${utils.formatCurrency(salary.netAmount)}</td>
                        <td>${utils.formatDate(salary.paidDate)}</td>
                        <td>${salary.remarks || '-'}</td>
                    </tr>
                `).join('');

            salaryDiv.innerHTML = `
                <h4><i class="fas fa-history"></i> Salary Payment History (${faculty.salaryDetails.salaryHistory.length} payments)</h4>
                <div class="table-responsive">
                    <table class="salary-history-table">
                        <thead>
                            <tr>
                                <th>Month</th>
                                <th>Gross Amount</th>
                                <th>Deductions</th>
                                <th>Net Amount</th>
                                <th>Payment Date</th>
                                <th>Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${salaryTable}
                        </tbody>
                    </table>
                </div>
            `;
        } else {
            salaryDiv.innerHTML = `
                <div class="no-payments">
                    <i class="fas fa-money-bill-wave" style="font-size: 3rem; color: #ddd;"></i>
                    <h4>No Salary History</h4>
                    <p>No salary payments have been recorded for this faculty member yet.</p>
                </div>
            `;
        }
    }

    switchDetailsTab(tabName) {
        document.querySelectorAll('.details-tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.details-tab-content').forEach(content => content.classList.remove('active'));
        
        const tabBtn = document.querySelector(`[data-tab="${tabName}"]`);
        const tabContent = document.getElementById(`${tabName}-tab`);
        
        if (tabBtn) tabBtn.classList.add('active');
        if (tabContent) tabContent.classList.add('active');
    }

    closeStudentModal() {
        document.getElementById('dashboardStudentModal').style.display = 'none';
        this.currentStudent = null;
    }

    closeFacultyModal() {
        document.getElementById('dashboardFacultyModal').style.display = 'none';
        this.currentFaculty = null;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.dashboardManager = new DashboardManager();
});
