class StudentsManager {
    constructor() {
        this.classes = [];
        this.students = [];
        this.selectedClass = null;
        this.currentStudent = null;
        this.currentStudentForDetails = null;
        this.isEditMode = false;
        this.init();
    }

    async init() {
        try {
            this.bindEvents();
            await this.loadClasses();
            this.renderClasses();
            this.populateClassSelect();
        } catch (error) {
            console.error('Students manager initialization error:', error);
            utils.showAlert('Error loading data', 'error');
        }
    }

    bindEvents() {
        // Add class button
        document.getElementById('addClassBtn')?.addEventListener('click', () => {
            this.openClassModal();
        });

        // Excel export buttons
        document.getElementById('exportStudentsExcelBtn')?.addEventListener('click', () => {
            this.exportAllStudentsExcel();
        });

        document.getElementById('exportClassExcelBtn')?.addEventListener('click', () => {
            this.exportClassExcel();
        });

        // Class modal events
        document.getElementById('closeClassModal')?.addEventListener('click', () => {
            this.closeClassModal();
        });

        document.getElementById('cancelClassBtn')?.addEventListener('click', () => {
            this.closeClassModal();
        });

        document.getElementById('classForm')?.addEventListener('submit', (e) => {
            this.handleClassSubmit(e);
        });

        // Student modal events
        document.getElementById('closeStudentModal')?.addEventListener('click', () => {
            this.closeStudentModal();
        });

        document.getElementById('cancelStudentBtn')?.addEventListener('click', () => {
            this.closeStudentModal();
        });

        document.getElementById('studentForm')?.addEventListener('submit', (e) => {
            this.handleStudentSubmit(e);
        });

        // Student details modal events
        document.getElementById('closeStudentDetailsModal')?.addEventListener('click', () => {
            this.closeStudentDetailsModal();
        });

        // Add student button
        document.getElementById('addStudentBtn')?.addEventListener('click', () => {
            this.openStudentModal();
        });

        // Tab switching for student details
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-btn')) {
                const tabName = e.target.dataset.tab;
                if (tabName) {
                    this.switchTab(tabName);
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

    // ==================== CLASS MANAGEMENT ====================

    async loadClasses() {
        try {
            const response = await api.getClasses();
            this.classes = response.data || [];
        } catch (error) {
            console.error('Error loading classes:', error);
            utils.showAlert('Error loading classes', 'error');
            this.classes = [];
        }
    }

    populateClassSelect() {
        const select = document.getElementById('studentClassSelect');
        if (!select) return;

        select.innerHTML = '<option value="">Choose Class</option>';
        
        this.classes.forEach(classItem => {
            const option = document.createElement('option');
            option.value = classItem.className;
            option.textContent = classItem.className;
            select.appendChild(option);
        });
    }

    renderClasses() {
        const grid = document.getElementById('classesGrid');
        if (!grid) return;
        
        if (this.classes.length === 0) {
            grid.innerHTML = `
                <div class="empty-card">
                    <i class="fas fa-school"></i>
                    <h3>No Classes Created</h3>
                    <p>Create your first class to start adding students</p>
                    <button class="btn-primary" onclick="studentsManager.openClassModal()">
                        <i class="fas fa-plus"></i> Create Class
                    </button>
                </div>
            `;
            return;
        }

        grid.innerHTML = this.classes.map(classItem => `
            <div class="class-card" onclick="studentsManager.selectClass('${classItem.className}')">
                <div class="class-header">
                    <h3>${classItem.className}</h3>
                    <button class="delete-class-btn" onclick="event.stopPropagation(); studentsManager.deleteClass('${classItem._id}', '${classItem.className}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <p class="class-description">${classItem.description || 'No description'}</p>
                <div class="class-stats">
                    <span id="students-count-${classItem.className}">
                        <i class="fas fa-user-graduate"></i> Loading...
                    </span>
                    <span class="class-status status-${classItem.status.toLowerCase()}">
                        ${classItem.status}
                    </span>
                </div>
            </div>
        `).join('');

        this.loadStudentCounts();
    }

    async loadStudentCounts() {
        for (const classItem of this.classes) {
            try {
                const response = await api.getStudents({ className: classItem.className });
                const count = response.data ? response.data.length : 0;
                const element = document.getElementById(`students-count-${classItem.className}`);
                if (element) {
                    element.innerHTML = `<i class="fas fa-user-graduate"></i> ${count} Students`;
                }
            } catch (error) {
                console.error(`Error loading student count for ${classItem.className}:`, error);
            }
        }
    }

    openClassModal() {
        const modal = document.getElementById('classModal');
        const form = document.getElementById('classForm');
        if (modal && form) {
            modal.style.display = 'block';
            form.reset();
        }
    }

    closeClassModal() {
        const modal = document.getElementById('classModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    async handleClassSubmit(e) {
        e.preventDefault();
        
        try {
            const formData = new FormData(e.target);
            const classData = {
                className: formData.get('className')?.trim(),
                description: formData.get('description')?.trim()
            };

            if (!classData.className) {
                utils.showAlert('Please enter a class name', 'error');
                return;
            }

            const submitBtn = e.target.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
                submitBtn.disabled = true;
            }

            await api.createClass(classData);
            utils.showAlert('Class created successfully!', 'success');
            
            this.closeClassModal();
            await this.loadClasses();
            this.renderClasses();
            this.populateClassSelect();
            
        } catch (error) {
            console.error('Error creating class:', error);
            utils.showAlert(error.message || 'Error creating class', 'error');
        } finally {
            const submitBtn = e.target.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.innerHTML = 'Create Class';
                submitBtn.disabled = false;
            }
        }
    }

    async deleteClass(classId, className) {
        try {
            const confirmMessage = `Are you sure you want to delete class "${className}"?\n\nThis will also delete all students in this class!\n\nThis action cannot be undone.`;
            
            if (!confirm(confirmMessage)) {
                return;
            }

            await api.deleteClass(classId);
            utils.showAlert('Class deleted successfully!', 'success');
            
            if (this.selectedClass === className) {
                const studentsSection = document.getElementById('studentsSection');
                if (studentsSection) {
                    studentsSection.style.display = 'none';
                }
                this.selectedClass = null;
                this.students = [];
            }
            
            await this.loadClasses();
            this.renderClasses();
            this.populateClassSelect();
            
        } catch (error) {
            console.error('Error deleting class:', error);
            utils.showAlert(error.message || 'Cannot delete class with existing students', 'error');
        }
    }

    // ==================== STUDENT CLASS SELECTION ====================

    async selectClass(className) {
        this.selectedClass = className;
        
        const selectedClassNameEl = document.getElementById('selectedClassName');
        const studentsSection = document.getElementById('studentsSection');
        const addStudentBtn = document.getElementById('addStudentBtn');
        const exportClassBtn = document.getElementById('exportClassExcelBtn');
        
        if (selectedClassNameEl) {
            selectedClassNameEl.textContent = `Students in ${className}`;
        }
        
        if (studentsSection) {
            studentsSection.style.display = 'block';
        }
        
        if (addStudentBtn) {
            addStudentBtn.style.display = 'inline-flex';
        }

        if (exportClassBtn) {
            exportClassBtn.style.display = 'inline-flex';
        }

        await this.loadStudentsForClass(className);
        this.renderStudents();
    }

    async loadStudentsForClass(className) {
        try {
            utils.showLoading(document.body, true);
            const response = await api.getStudents({ className: className });
            this.students = response.data || [];
        } catch (error) {
            console.error('Error loading students:', error);
            utils.showAlert('Error loading students', 'error');
            this.students = [];
        } finally {
            utils.showLoading(document.body, false);
        }
    }

    renderStudents() {
        const tbody = document.getElementById('studentsTableBody');
        if (!tbody) return;
        
        if (this.students.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 3rem;">
                        <i class="fas fa-user-graduate" style="font-size: 3rem; color: #ddd; margin-bottom: 1rem; display: block;"></i>
                        <h4 style="color: #666; margin-bottom: 0.5rem;">No students in this class</h4>
                        <p style="color: #999; margin-bottom: 1.5rem;">Start by adding your first student to this class</p>
                        <button class="btn-primary" onclick="studentsManager.openStudentModal()">
                            <i class="fas fa-plus"></i> Add First Student
                        </button>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.students.map(student => {
            const dueAmount = student.calculatedDue || 0;
            const dueStatus = dueAmount > 0 ? 'Due' : dueAmount < 0 ? 'Overpaid' : 'Paid';
            const dueColor = dueAmount > 0 ? '#dc3545' : dueAmount < 0 ? '#17a2b8' : '#28a745';
            
            return `
                <tr>
                    <td>
                        <strong>${student.personalDetails.studentId}</strong>
                    </td>
                    <td>
                        <span class="student-name-link" onclick="studentsManager.viewStudentDetails('${student._id}')">
                            <strong>${student.personalDetails.fullName}</strong>
                        </span>
                        <br>
                        <small style="color: #666;">${student.personalDetails.phone}</small>
                    </td>
                    <td>${student.personalDetails.fatherName}</td>
                    <td>${student.personalDetails.phone}</td>
                    <td>
                        <strong>${utils.formatCurrency(student.feeDetails.monthlyFee || 0)}</strong>
                        <br>
                        <small style="color: #666;">per month</small>
                    </td>
                    <td style="text-align: center;">
                        <span style="color: ${dueColor}; font-weight: bold; font-size: 1.1rem;">
                            ${utils.formatCurrency(Math.abs(dueAmount))}
                        </span>
                        <br>
                        <small style="color: ${dueColor}; font-weight: 600;">
                            ${dueStatus}
                        </small>
                    </td>
                    <td style="text-align: center;">
                        <span class="status-badge status-${student.personalDetails.status.toLowerCase()}">
                            <i class="fas fa-circle"></i> ${student.personalDetails.status}
                        </span>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-action btn-pdf" onclick="studentsManager.exportStudentPDF('${student._id}')" title="Export Student PDF Report">
                                <i class="fas fa-file-pdf"></i>
                            </button>
                            <button class="btn-action" onclick="studentsManager.generateIDCard('${student._id}')" title="Generate ID Card">
                                <i class="fas fa-id-card"></i>
                            </button>
                            <button class="btn-action" onclick="studentsManager.exportStudentData('${student._id}')" title="Export Student Data (CSV)">
                                <i class="fas fa-download"></i>
                            </button>
                            <button class="btn-action btn-edit" onclick="studentsManager.editStudent('${student._id}')" title="Edit Student">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-action btn-danger" onclick="studentsManager.deleteStudent('${student._id}')" title="Delete Student">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // ==================== STUDENT MANAGEMENT ====================

    openStudentModal(student = null) {
        this.currentStudent = student;
        this.isEditMode = !!student;
        
        const modal = document.getElementById('studentModal');
        const form = document.getElementById('studentForm');
        const modalTitle = document.getElementById('studentModalTitle');
        
        if (!modal || !form) return;

        if (student) {
            if (modalTitle) modalTitle.textContent = `Edit Student - ${student.personalDetails.fullName}`;
            this.fillStudentForm(student);
        } else {
            if (modalTitle) modalTitle.textContent = 'Add New Student';
            form.reset();
            this.isEditMode = false;
            
            if (this.selectedClass) {
                const classSelect = document.getElementById('studentClassSelect');
                if (classSelect) {
                    classSelect.value = this.selectedClass;
                }
            }
        }
        
        modal.style.display = 'block';
        
        setTimeout(() => {
            const firstInput = form.querySelector('input[name="fullName"]');
            if (firstInput) {
                firstInput.focus();
                firstInput.select();
            }
        }, 100);
    }

    closeStudentModal() {
        const modal = document.getElementById('studentModal');
        if (modal) {
            modal.style.display = 'none';
        }
        this.currentStudent = null;
        this.isEditMode = false;
    }

    fillStudentForm(student) {
        const form = document.getElementById('studentForm');
        if (!form || !student) return;
        
        try {
            const fullNameField = form.querySelector('input[name="fullName"]');
            const fatherNameField = form.querySelector('input[name="fatherName"]');
            const phoneField = form.querySelector('input[name="phone"]');
            const classNameField = form.querySelector('select[name="className"]');
            const monthlyFeeField = form.querySelector('input[name="monthlyFee"]');

            if (fullNameField) fullNameField.value = student.personalDetails.fullName || '';
            if (fatherNameField) fatherNameField.value = student.personalDetails.fatherName || '';
            if (phoneField) phoneField.value = student.personalDetails.phone || '';
            if (classNameField) classNameField.value = student.personalDetails.className || '';
            if (monthlyFeeField) monthlyFeeField.value = student.feeDetails.monthlyFee || '';

        } catch (error) {
            console.error('Error filling student form:', error);
            utils.showAlert('Error loading student data into form', 'error');
        }
    }

    async handleStudentSubmit(e) {
        e.preventDefault();
        
        try {
            const formData = new FormData(e.target);
            
            const fullName = formData.get('fullName')?.trim();
            const fatherName = formData.get('fatherName')?.trim();
            const phone = formData.get('phone')?.trim();
            const className = formData.get('className');
            const monthlyFee = formData.get('monthlyFee');

            if (!fullName || !fatherName || !phone || !className || !monthlyFee) {
                utils.showAlert('Please fill all required fields', 'error');
                return;
            }

            if (!utils.validatePhone(phone)) {
                utils.showAlert('Please enter a valid 10-digit phone number starting with 6-9', 'error');
                return;
            }

            const feeAmount = parseInt(monthlyFee);
            if (isNaN(feeAmount) || feeAmount <= 0) {
                utils.showAlert('Please enter a valid monthly fee amount', 'error');
                return;
            }

            const studentData = {
                personalDetails: {
                    fullName: fullName,
                    fatherName: fatherName,
                    phone: phone,
                    className: className
                },
                feeDetails: {
                    monthlyFee: feeAmount
                }
            };

            if (this.isEditMode && this.currentStudent) {
                studentData.personalDetails.studentId = this.currentStudent.personalDetails.studentId;
                studentData.personalDetails.status = this.currentStudent.personalDetails.status;
            }

            const submitBtn = e.target.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
                submitBtn.disabled = true;
            }

            let response;
            if (this.isEditMode && this.currentStudent) {
                response = await api.updateStudent(this.currentStudent._id, studentData);
                utils.showAlert(`${fullName} updated successfully!`, 'success');
            } else {
                response = await api.createStudent(studentData);
                utils.showAlert(`${fullName} added successfully! ID: ${response.data.personalDetails.studentId}`, 'success');
            }
            
            this.closeStudentModal();
            
            if (this.selectedClass) {
                await this.loadStudentsForClass(this.selectedClass);
                this.renderStudents();
            }
            
            this.loadStudentCounts();
            
        } catch (error) {
            console.error('Error saving student:', error);
            let errorMessage = 'Error saving student. Please try again.';
            
            if (error.message.includes('phone')) {
                errorMessage = 'Phone number already exists. Please use a different phone number.';
            } else if (error.message.includes('validation')) {
                errorMessage = 'Please check your input data and try again.';
            } else if (error.message.includes('not found')) {
                errorMessage = 'Student not found. Please refresh the page and try again.';
            }
            
            utils.showAlert(errorMessage, 'error');
        } finally {
            const submitBtn = e.target.querySelector('button[type="submit"]');
            if (submitBtn) {
                const buttonText = this.isEditMode ? 'Update Student' : 'Save Student';
                const iconClass = this.isEditMode ? 'fas fa-save' : 'fas fa-user-plus';
                submitBtn.innerHTML = `<i class="${iconClass}"></i> ${buttonText}`;
                submitBtn.disabled = false;
            }
        }
    }

    async editStudent(studentId) {
        try {
            let student = this.students.find(s => s._id === studentId);
            
            if (!student) {
                utils.showAlert('Loading student data...', 'info');
                const response = await api.getStudent(studentId);
                student = response.data;
            }

            if (student) {
                this.openStudentModal(student);
            } else {
                utils.showAlert('Student not found', 'error');
            }
        } catch (error) {
            console.error('Error loading student for editing:', error);
            utils.showAlert('Error loading student data for editing', 'error');
        }
    }

    async deleteStudent(studentId) {
        try {
            const student = this.students.find(s => s._id === studentId);
            if (!student) {
                utils.showAlert('Student not found', 'error');
                return;
            }

            const confirmMessage = `Are you sure you want to delete student?\n\n📋 Name: ${student.personalDetails.fullName}\n🆔 ID: ${student.personalDetails.studentId}\n🏫 Class: ${student.personalDetails.className}\n📞 Phone: ${student.personalDetails.phone}\n\n⚠️ This action cannot be undone and will delete all payment records!`;
            
            if (!confirm(confirmMessage)) {
                return;
            }

            utils.showAlert('Deleting student...', 'info');

            await api.deleteStudent(studentId);
            utils.showAlert(`${student.personalDetails.fullName} deleted successfully!`, 'success');
            
            if (this.selectedClass) {
                await this.loadStudentsForClass(this.selectedClass);
                this.renderStudents();
            }
            
            this.loadStudentCounts();
            
        } catch (error) {
            console.error('Error deleting student:', error);
            utils.showAlert(error.message || 'Error deleting student', 'error');
        }
    }

    // ==================== EXCEL EXPORT FUNCTIONALITY ====================

    async exportAllStudentsExcel() {
        try {
            utils.showAlert('Generating Excel file for all students...', 'info');
            
            const allStudents = [];
            
            for (const classItem of this.classes) {
                const response = await api.getStudents({ className: classItem.className });
                const classStudents = response.data || [];
                allStudents.push(...classStudents.map(student => ({
                    ...student,
                    className: classItem.className
                })));
            }

            if (allStudents.length === 0) {
                utils.showAlert('No students found to export', 'warning');
                return;
            }

            const studentsByClass = {};
            allStudents.forEach(student => {
                const className = student.personalDetails.className;
                if (!studentsByClass[className]) {
                    studentsByClass[className] = [];
                }
                studentsByClass[className].push(student);
            });

            const workbook = XLSX.utils.book_new();

            const summaryData = [
                ['AADASH COACHING CENTER - STUDENTS SUMMARY'],
                [`Generated on: ${new Date().toLocaleString()}`],
                [],
                ['Class', 'Total Students', 'Total Monthly Revenue', 'Total Paid', 'Students with Dues']
            ];

            let grandTotalStudents = 0;
            let grandTotalRevenue = 0;
            let grandTotalPaid = 0;
            let grandTotalDues = 0;

            Object.entries(studentsByClass).forEach(([className, students]) => {
                const totalStudents = students.length;
                const totalRevenue = students.reduce((sum, s) => sum + (s.feeDetails.monthlyFee || 0), 0);
                const totalPaid = students.reduce((sum, s) => sum + (s.feeDetails.totalPaidAmount || 0), 0);
                const studentsWithDues = students.filter(s => (s.calculatedDue || 0) > 0).length;

                summaryData.push([
                    className,
                    totalStudents,
                    `₹${totalRevenue.toLocaleString()}`,
                    `₹${totalPaid.toLocaleString()}`,
                    studentsWithDues
                ]);

                grandTotalStudents += totalStudents;
                grandTotalRevenue += totalRevenue;
                grandTotalPaid += totalPaid;
                grandTotalDues += studentsWithDues;
            });

            summaryData.push([]);
            summaryData.push([
                'TOTAL',
                grandTotalStudents,
                `₹${grandTotalRevenue.toLocaleString()}`,
                `₹${grandTotalPaid.toLocaleString()}`,
                grandTotalDues
            ]);

            const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
            XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

            Object.entries(studentsByClass).forEach(([className, students]) => {
                const classData = [
                    [`${className} - Students List`],
                    [`Total Students: ${students.length}`],
                    [`Generated: ${new Date().toLocaleString()}`],
                    [],
                    [
                        'Student ID',
                        'Full Name',
                        'Father Name',
                        'Phone',
                        'Monthly Fee',
                        'Total Paid',
                        'Due/Overpaid',
                        'Status',
                        'Admission Date',
                        'Total Payments'
                    ]
                ];

                students.forEach(student => {
                    const dueAmount = student.calculatedDue || 0;
                    const admissionDate = new Date(student.createdAt).toLocaleDateString();
                    const totalPayments = student.feeDetails.monthlyPayments?.length || 0;

                    classData.push([
                        student.personalDetails.studentId,
                        student.personalDetails.fullName,
                        student.personalDetails.fatherName,
                        student.personalDetails.phone,
                        `₹${(student.feeDetails.monthlyFee || 0).toLocaleString()}`,
                        `₹${(student.feeDetails.totalPaidAmount || 0).toLocaleString()}`,
                        `₹${Math.abs(dueAmount).toLocaleString()} ${dueAmount > 0 ? '(Due)' : dueAmount < 0 ? '(Overpaid)' : '(Paid)'}`,
                        student.personalDetails.status,
                        admissionDate,
                        totalPayments
                    ]);
                });

                const classSheet = XLSX.utils.aoa_to_sheet(classData);
                
                const columnWidths = [
                    { wch: 12 }, { wch: 20 }, { wch: 20 }, { wch: 15 },
                    { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 10 },
                    { wch: 12 }, { wch: 10 }
                ];
                classSheet['!cols'] = columnWidths;

                XLSX.utils.book_append_sheet(workbook, classSheet, className);
            });

            const fileName = `Aadash_All_Students_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(workbook, fileName);
            
            utils.showAlert(`Excel file "${fileName}" downloaded successfully!`, 'success');

        } catch (error) {
            console.error('Error exporting students Excel:', error);
            utils.showAlert('Error generating Excel file', 'error');
        }
    }

    async exportClassExcel() {
        try {
            if (!this.selectedClass || this.students.length === 0) {
                utils.showAlert('No students in selected class to export', 'warning');
                return;
            }

            utils.showAlert(`Generating Excel file for ${this.selectedClass}...`, 'info');

            const excelData = [
                [`AADASH COACHING CENTER - ${this.selectedClass.toUpperCase()}`],
                [`Total Students: ${this.students.length}`],
                [`Generated on: ${new Date().toLocaleString()}`],
                [],
                [
                    'Student ID',
                    'Full Name',
                    'Father Name',
                    'Phone Number',
                    'Monthly Fee (₹)',
                    'Total Paid (₹)',
                    'Due/Overpaid (₹)',
                    'Status',
                    'Admission Date',
                    'Total Payments',
                    'Last Payment Date'
                ]
            ];

            this.students.forEach(student => {
                const dueAmount = student.calculatedDue || 0;
                const dueStatus = dueAmount > 0 ? 'Due' : dueAmount < 0 ? 'Overpaid' : 'Paid';
                const admissionDate = new Date(student.createdAt).toLocaleDateString();
                const totalPayments = student.feeDetails.monthlyPayments?.length || 0;
                
                let lastPaymentDate = 'Never';
                if (student.feeDetails.monthlyPayments && student.feeDetails.monthlyPayments.length > 0) {
                    const lastPayment = student.feeDetails.monthlyPayments
                        .sort((a, b) => new Date(b.paidDate) - new Date(a.paidDate))[0];
                    lastPaymentDate = new Date(lastPayment.paidDate).toLocaleDateString();
                }

                excelData.push([
                    student.personalDetails.studentId,
                    student.personalDetails.fullName,
                    student.personalDetails.fatherName,
                    student.personalDetails.phone,
                    student.feeDetails.monthlyFee || 0,
                    student.feeDetails.totalPaidAmount || 0,
                    `${Math.abs(dueAmount)} (${dueStatus})`,
                    student.personalDetails.status,
                    admissionDate,
                    totalPayments,
                    lastPaymentDate
                ]);
            });

            const totalFee = this.students.reduce((sum, s) => sum + (s.feeDetails.monthlyFee || 0), 0);
            const totalPaid = this.students.reduce((sum, s) => sum + (s.feeDetails.totalPaidAmount || 0), 0);
            const studentsWithDues = this.students.filter(s => (s.calculatedDue || 0) > 0).length;

            excelData.push([]);
            excelData.push(['SUMMARY']);
            excelData.push(['Total Students:', this.students.length]);
            excelData.push(['Expected Monthly Revenue:', `₹${totalFee.toLocaleString()}`]);
            excelData.push(['Total Amount Collected:', `₹${totalPaid.toLocaleString()}`]);
            excelData.push(['Students with Dues:', studentsWithDues]);
            excelData.push(['Collection Rate:', `${totalFee > 0 ? ((totalPaid / totalFee) * 100).toFixed(1) : 0}%`]);

            const worksheet = XLSX.utils.aoa_to_sheet(excelData);
            const workbook = XLSX.utils.book_new();
            
            const columnWidths = [
                { wch: 12 }, { wch: 25 }, { wch: 25 }, { wch: 15 },
                { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 10 },
                { wch: 12 }, { wch: 10 }, { wch: 15 }
            ];
            worksheet['!cols'] = columnWidths;

            XLSX.utils.book_append_sheet(workbook, worksheet, this.selectedClass);

            const fileName = `Aadash_${this.selectedClass}_Students_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(workbook, fileName);
            
            utils.showAlert(`Excel file "${fileName}" downloaded successfully!`, 'success');

        } catch (error) {
            console.error('Error exporting class Excel:', error);
            utils.showAlert('Error generating Excel file', 'error');
        }
    }

    // ==================== STUDENT DETAILS VIEW ====================

    async viewStudentDetails(studentId) {
        try {
            utils.showLoading(document.body, true);
            
            const response = await api.getStudent(studentId);
            const student = response.data;
            this.currentStudentForDetails = student;
            
            const modal = document.getElementById('studentDetailsModal');
            const title = document.getElementById('studentDetailsTitle');
            
            if (title) {
                title.textContent = `${student.personalDetails.fullName} - Complete Details`;
            }
            
            this.fillPersonalInfo(student);
            this.fillFeeBreakdown(student);
            
            if (modal) {
                modal.style.display = 'block';
            }
            
            this.switchTab('personal');
            
        } catch (error) {
            console.error('Error loading student details:', error);
            utils.showAlert('Error loading student details', 'error');
        } finally {
            utils.showLoading(document.body, false);
        }
    }

    fillPersonalInfo(student) {
        const infoDiv = document.getElementById('studentPersonalInfo');
        if (!infoDiv) return;

        const admissionDate = utils.formatDate(student.createdAt);
        const dueAmount = student.calculatedDue || 0;
        const dueStatus = dueAmount > 0 ? 'Due' : dueAmount < 0 ? 'Overpaid' : 'Up to Date';
        const dueColor = dueAmount > 0 ? '#dc3545' : dueAmount < 0 ? '#17a2b8' : '#28a745';
        
        infoDiv.innerHTML = `
            <div class="personal-info-grid">
                <div class="info-card">
                    <h4><i class="fas fa-user"></i> Personal Information</h4>
                    <div class="info-details">
                        <div class="info-row">
                            <span class="info-label">Student ID:</span>
                            <span class="info-value highlight">${student.personalDetails.studentId}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Full Name:</span>
                            <span class="info-value">${student.personalDetails.fullName}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Father's Name:</span>
                            <span class="info-value">${student.personalDetails.fatherName}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Phone Number:</span>
                            <span class="info-value">${student.personalDetails.phone}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Class:</span>
                            <span class="info-value class-badge">${student.personalDetails.className}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Status:</span>
                            <span class="info-value">
                                <span class="status-badge status-${student.personalDetails.status.toLowerCase()}">
                                    ${student.personalDetails.status}
                                </span>
                            </span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Admission Date:</span>
                            <span class="info-value">${admissionDate}</span>
                        </div>
                    </div>
                </div>

                <div class="info-card">
                    <h4><i class="fas fa-rupee-sign"></i> Fee Summary</h4>
                    <div class="fee-summary-grid">
                        <div class="fee-summary-item">
                            <div class="fee-summary-label">Monthly Fee</div>
                            <div class="fee-summary-value primary">${utils.formatCurrency(student.feeDetails.monthlyFee || 0)}</div>
                        </div>
                        <div class="fee-summary-item">
                            <div class="fee-summary-label">Total Paid</div>
                            <div class="fee-summary-value success">${utils.formatCurrency(student.feeDetails.totalPaidAmount || 0)}</div>
                        </div>
                        <div class="fee-summary-item">
                            <div class="fee-summary-label">Due/Overpaid</div>
                            <div class="fee-summary-value" style="color: ${dueColor};">
                                ${utils.formatCurrency(Math.abs(dueAmount))}
                            </div>
                            <div class="fee-summary-status" style="color: ${dueColor};">
                                ${dueStatus}
                            </div>
                        </div>
                        <div class="fee-summary-item">
                            <div class="fee-summary-label">Total Payments</div>
                            <div class="fee-summary-value">${student.feeDetails.monthlyPayments?.length || 0}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    fillFeeBreakdown(student) {
        const feesDiv = document.getElementById('feesSummary');
        const tbody = document.getElementById('monthlyFeesTableBody');
        
        if (!feesDiv || !tbody) return;

        const dueAmount = student.calculatedDue || 0;
        const dueStatus = dueAmount > 0 ? 'Due' : dueAmount < 0 ? 'Overpaid' : 'Up to Date';
        const dueColor = dueAmount > 0 ? '#dc3545' : dueAmount < 0 ? '#17a2b8' : '#28a745';

        feesDiv.innerHTML = `
            <div class="monthly-fee-summary">
                <div class="summary-stats">
                    <div class="stat-item">
                        <i class="fas fa-rupee-sign"></i>
                        <span>Monthly Fee: ${utils.formatCurrency(student.feeDetails.monthlyFee || 0)}</span>
                    </div>
                    <div class="stat-item">
                        <i class="fas fa-wallet"></i>
                        <span>Total Paid: ${utils.formatCurrency(student.feeDetails.totalPaidAmount || 0)}</span>
                    </div>
                    <div class="stat-item" style="color: ${dueColor};">
                        <i class="fas fa-exclamation-circle"></i>
                        <span>Status: ${dueStatus} (${utils.formatCurrency(Math.abs(dueAmount))})</span>
                    </div>
                </div>
            </div>
        `;

        if (student.feeDetails.monthlyPayments && student.feeDetails.monthlyPayments.length > 0) {
            const sortedPayments = [...student.feeDetails.monthlyPayments].sort((a, b) => {
                if (a.year !== b.year) {
                    return b.year - a.year;
                }
                return new Date(b.paidDate) - new Date(a.paidDate);
            });

            tbody.innerHTML = sortedPayments.map(payment => {
                const statusClass = payment.status ? payment.status.toLowerCase() : 'paid';
                const statusText = payment.status || 'Paid';
                
                return `
                    <tr>
                        <td>
                            <strong>${payment.month} ${payment.year}</strong>
                        </td>
                        <td>${utils.formatCurrency(student.feeDetails.monthlyFee || 0)}</td>
                        <td>
                            <strong>${utils.formatCurrency(payment.amount)}</strong>
                        </td>
                        <td style="text-align: center;">
                            <span class="payment-status-badge status-${statusClass}">
                                ${statusText}
                            </span>
                        </td>
                        <td>${utils.formatDate(payment.paidDate)}</td>
                        <td>
                            <small class="payment-details">
                                <strong>Mode:</strong> ${payment.paymentMode}<br>
                                <strong>Receipt:</strong> ${payment.receiptNumber}
                            </small>
                        </td>
                    </tr>
                `;
            }).join('');
        } else {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 2rem;">
                        <i class="fas fa-receipt" style="font-size: 2rem; color: #ddd; margin-bottom: 1rem; display: block;"></i>
                        <h4 style="color: #666;">No Payment Records</h4>
                        <p style="color: #999;">No fee payments have been recorded for this student yet.</p>
                    </td>
                </tr>
            `;
        }
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        const tabBtn = document.querySelector(`[data-tab="${tabName}"]`);
        const tabContent = document.getElementById(`${tabName}-tab`);
        
        if (tabBtn) tabBtn.classList.add('active');
        if (tabContent) tabContent.classList.add('active');
    }

    closeStudentDetailsModal() {
        const modal = document.getElementById('studentDetailsModal');
        if (modal) {
            modal.style.display = 'none';
        }
        this.currentStudentForDetails = null;
    }

    // ==================== ID CARD GENERATION ====================

    async generateIDCard(studentId) {
        try {
            const student = this.students.find(s => s._id === studentId);
            if (!student) {
                utils.showAlert('Student not found', 'error');
                return;
            }

            const addPhoto = confirm(
                `Generate ID Card for ${student.personalDetails.fullName}\n\n` +
                `Click OK to add a photo, or Cancel for ID card without photo.`
            );

            if (addPhoto) {
                const photoInput = document.createElement('input');
                photoInput.type = 'file';
                photoInput.accept = 'image/*';
                photoInput.style.display = 'none';
                
                photoInput.onchange = (e) => {
                    const files = e.target.files;
                    if (files && files.length > 0) {
                        const file = files[0];
                        if (!file.type.startsWith('image/')) {
                            utils.showAlert('Please select a valid image file', 'error');
                            return;
                        }
                        
                        if (file.size > 5 * 1024 * 1024) {
                            utils.showAlert('Image size should be less than 5MB', 'error');
                            return;
                        }
                        
                        utils.generateIDCardWithPhoto(student, file);
                        utils.showAlert('ID Card with photo generated successfully!', 'success');
                    } else {
                        utils.generateIDCardWithPhoto(student);
                        utils.showAlert('ID Card generated successfully!', 'success');
                    }
                    
                    document.body.removeChild(photoInput);
                };
                
                document.body.appendChild(photoInput);
                photoInput.click();
            } else {
                utils.generateIDCardWithPhoto(student);
                utils.showAlert('ID Card generated successfully!', 'success');
            }
            
        } catch (error) {
            console.error('Error generating ID card:', error);
            utils.showAlert('Error generating ID card', 'error');
        }
    }

    // ==================== EXPORT STUDENT DATA ====================

    async exportStudentData(studentId) {
        try {
            const response = await api.getStudent(studentId);
            const student = response.data;
            
            if (!student) {
                utils.showAlert('Student not found', 'error');
                return;
            }

            const exportData = {
                personal: {
                    'Student ID': student.personalDetails.studentId,
                    'Full Name': student.personalDetails.fullName,
                    'Father Name': student.personalDetails.fatherName,
                    'Phone': student.personalDetails.phone,
                    'Class': student.personalDetails.className,
                    'Status': student.personalDetails.status,
                    'Admission Date': utils.formatDate(student.createdAt)
                },
                fees: {
                    'Monthly Fee': utils.formatCurrency(student.feeDetails.monthlyFee || 0),
                    'Total Paid': utils.formatCurrency(student.feeDetails.totalPaidAmount || 0),
                    'Due Amount': utils.formatCurrency(student.calculatedDue || 0),
                    'Total Payments': student.feeDetails.monthlyPayments?.length || 0
                },
                payments: student.feeDetails.monthlyPayments || []
            };

            let csvContent = 'AADASH COACHING CENTER - STUDENT REPORT\n';
            csvContent += `Generated: ${new Date().toLocaleString()}\n\n`;
            
            csvContent += 'PERSONAL DETAILS\n';
            csvContent += 'Field,Value\n';
            Object.entries(exportData.personal).forEach(([key, value]) => {
                csvContent += `"${key}","${value}"\n`;
            });
            
            csvContent += '\nFEE SUMMARY\n';
            csvContent += 'Field,Value\n';
            Object.entries(exportData.fees).forEach(([key, value]) => {
                csvContent += `"${key}","${value}"\n`;
            });
            
            csvContent += '\nPAYMENT HISTORY\n';
            csvContent += 'Month,Year,Amount,Payment Date,Mode,Receipt Number,Status\n';
            exportData.payments.forEach(payment => {
                csvContent += `"${payment.month}","${payment.year}","${utils.formatCurrency(payment.amount)}","${utils.formatDate(payment.paidDate)}","${payment.paymentMode}","${payment.receiptNumber}","${payment.status}"\n`;
            });

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${student.personalDetails.studentId}_${student.personalDetails.fullName.replace(/\s+/g, '_')}_Report.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            utils.showAlert('Student data exported successfully!', 'success');
            
        } catch (error) {
            console.error('Error exporting student data:', error);
            utils.showAlert('Error exporting student data', 'error');
        }
    }

    // ==================== PDF EXPORT FOR INDIVIDUAL STUDENT ====================

    async exportStudentPDF(studentId) {
        try {
            let student = this.students.find(s => s._id === studentId);
            
            if (!student) {
                const response = await api.getStudent(studentId);
                student = response.data;
            }
            
            if (!student) {
                utils.showAlert('Student not found', 'error');
                return;
            }

            utils.showAlert('Generating student PDF report...', 'info');

            const dueAmount = student.calculatedDue || 0;
            const dueStatus = dueAmount > 0 ? 'Due' : dueAmount < 0 ? 'Overpaid' : 'Up to Date';
            const totalPayments = student.feeDetails.monthlyPayments?.length || 0;
            const admissionDate = utils.formatDate(student.createdAt);

            this.generateStudentPDFReport(student, {
                dueAmount,
                dueStatus,
                totalPayments,
                admissionDate
            });

        } catch (error) {
            console.error('Error exporting student PDF:', error);
            utils.showAlert('Error generating student PDF', 'error');
        }
    }

    generateStudentPDFReport(student, metrics) {
        try {
            const reportHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>${student.personalDetails.fullName} - Student Report</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { 
                        font-family: 'Arial', sans-serif; 
                        line-height: 1.6; 
                        color: #333; 
                        padding: 20px;
                        background: white;
                    }
                    
                    .header { 
                        text-align: center; 
                        border-bottom: 3px solid #667eea; 
                        padding-bottom: 20px; 
                        margin-bottom: 30px;
                        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                        padding: 30px 20px 20px 20px;
                        border-radius: 10px;
                    }
                    .header h1 { 
                        color: #2c3e50; 
                        font-size: 28px; 
                        margin-bottom: 10px;
                        font-weight: bold;
                    }
                    .header h2 { 
                        color: #667eea; 
                        font-size: 20px; 
                        margin-bottom: 5px;
                    }
                    .header p { 
                        color: #6c757d; 
                        font-size: 14px;
                    }
                    
                    .student-header {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 20px;
                        border-radius: 10px;
                        margin-bottom: 30px;
                        text-align: center;
                    }
                    .student-header h2 {
                        font-size: 24px;
                        margin-bottom: 10px;
                    }
                    .student-id {
                        background: rgba(255,255,255,0.2);
                        padding: 5px 15px;
                        border-radius: 20px;
                        display: inline-block;
                        font-weight: bold;
                    }
                    
                    .info-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 30px;
                        margin-bottom: 30px;
                    }
                    
                    .info-card {
                        background: #f8f9fa;
                        padding: 20px;
                        border-radius: 10px;
                        border-left: 4px solid #667eea;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    }
                    .info-card h3 {
                        color: #2c3e50;
                        margin-bottom: 15px;
                        font-size: 18px;
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    }
                    .info-row {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 8px 0;
                        border-bottom: 1px solid #e9ecef;
                    }
                    .info-row:last-child {
                        border-bottom: none;
                    }
                    .info-label {
                        font-weight: 600;
                        color: #495057;
                        font-size: 14px;
                    }
                    .info-value {
                        color: #2c3e50;
                        font-weight: 500;
                        font-size: 14px;
                    }
                    .info-value.highlight {
                        color: #667eea;
                        font-weight: bold;
                    }
                    
                    .fee-summary {
                        background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
                        padding: 20px;
                        border-radius: 10px;
                        margin: 20px 0;
                        border-left: 4px solid #2196f3;
                    }
                    .fee-summary h3 {
                        color: #1565c0;
                        margin-bottom: 15px;
                    }
                    .fee-grid {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 15px;
                        text-align: center;
                    }
                    .fee-item {
                        background: white;
                        padding: 15px;
                        border-radius: 8px;
                        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                    }
                    .fee-item .label {
                        font-size: 12px;
                        color: #666;
                        text-transform: uppercase;
                        margin-bottom: 5px;
                    }
                    .fee-item .value {
                        font-size: 16px;
                        font-weight: bold;
                        color: #2c3e50;
                    }
                    .fee-item.due .value { color: #dc3545; }
                    .fee-item.overpaid .value { color: #17a2b8; }
                    .fee-item.paid .value { color: #28a745; }
                    
                    .transactions-section {
                        margin-top: 30px;
                    }
                    .transactions-section h3 {
                        color: #2c3e50;
                        margin-bottom: 20px;
                        font-size: 20px;
                        border-bottom: 2px solid #e9ecef;
                        padding-bottom: 10px;
                    }
                    
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 15px 0;
                        background: white;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                        border-radius: 8px;
                        overflow: hidden;
                    }
                    th, td {
                        padding: 12px 8px;
                        text-align: left;
                        border-bottom: 1px solid #dee2e6;
                        font-size: 13px;
                    }
                    th {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        font-weight: bold;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    tr:nth-child(even) {
                        background: #f8f9fa;
                    }
                    tr:hover {
                        background: #e3f2fd;
                    }
                    
                    .status-badge {
                        padding: 4px 8px;
                        border-radius: 12px;
                        font-size: 11px;
                        font-weight: bold;
                        text-transform: uppercase;
                    }
                    .status-paid { background: #d4edda; color: #155724; }
                    .status-partial { background: #fff3cd; color: #856404; }
                    .status-overpaid { background: #cce7ff; color: #004085; }
                    
                    .summary-stats {
                        background: #f8f9fa;
                        padding: 20px;
                        border-radius: 10px;
                        margin: 20px 0;
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 20px;
                        text-align: center;
                    }
                    .stat-item {
                        background: white;
                        padding: 15px;
                        border-radius: 8px;
                        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                    }
                    .stat-item .number {
                        font-size: 24px;
                        font-weight: bold;
                        color: #667eea;
                        margin-bottom: 5px;
                    }
                    .stat-item .label {
                        font-size: 12px;
                        color: #666;
                        text-transform: uppercase;
                    }
                    
                    .footer {
                        text-align: center;
                        margin-top: 40px;
                        padding-top: 20px;
                        border-top: 2px solid #e9ecef;
                        color: #6c757d;
                        font-style: italic;
                        font-size: 12px;
                    }
                    
                    .no-print {
                        margin: 20px 0;
                        text-align: center;
                    }
                    .btn {
                        padding: 12px 24px;
                        margin: 0 10px;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: bold;
                        text-transform: uppercase;
                        transition: all 0.3s;
                    }
                    .btn-primary {
                        background: #667eea;
                        color: white;
                    }
                    .btn-secondary {
                        background: #6c757d;
                        color: white;
                    }
                    
                    @media print {
                        .no-print { display: none !important; }
                        body { padding: 0; }
                        .info-grid { grid-template-columns: 1fr; }
                        .fee-grid { grid-template-columns: repeat(2, 1fr); }
                    }
                    
                    @media (max-width: 768px) {
                        .info-grid { grid-template-columns: 1fr; }
                        .fee-grid { grid-template-columns: repeat(2, 1fr); }
                        .summary-stats { grid-template-columns: 1fr; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>🎓 AADASH COACHING CENTER</h1>
                    <h2>📋 Student Report</h2>
                    <p>Generated on: ${new Date().toLocaleDateString('en-IN', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}</p>
                </div>

                <div class="student-header">
                    <h2>${student.personalDetails.fullName}</h2>
                    <div class="student-id">ID: ${student.personalDetails.studentId}</div>
                </div>

                <div class="info-grid">
                    <div class="info-card">
                        <h3>👤 Personal Information</h3>
                        <div class="info-row">
                            <span class="info-label">Student ID:</span>
                            <span class="info-value highlight">${student.personalDetails.studentId}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Full Name:</span>
                            <span class="info-value">${student.personalDetails.fullName}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Father's Name:</span>
                            <span class="info-value">${student.personalDetails.fatherName}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Phone Number:</span>
                            <span class="info-value">${student.personalDetails.phone}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Class:</span>
                            <span class="info-value highlight">${student.personalDetails.className}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Status:</span>
                            <span class="info-value">${student.personalDetails.status}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Admission Date:</span>
                            <span class="info-value">${metrics.admissionDate}</span>
                        </div>
                    </div>

                    <div class="info-card">
                        <h3>📊 Academic Information</h3>
                        <div class="info-row">
                            <span class="info-label">Current Class:</span>
                            <span class="info-value highlight">${student.personalDetails.className}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Enrollment Status:</span>
                            <span class="info-value">${student.personalDetails.status}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Days Since Admission:</span>
                            <span class="info-value">${Math.floor((new Date() - new Date(student.createdAt)) / (1000 * 60 * 60 * 24))} days</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Total Transactions:</span>
                            <span class="info-value">${metrics.totalPayments}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Account Status:</span>
                            <span class="info-value ${metrics.dueStatus.toLowerCase()}">${metrics.dueStatus}</span>
                        </div>
                    </div>
                </div>

                <div class="fee-summary">
                    <h3>💰 Fee Summary</h3>
                    <div class="fee-grid">
                        <div class="fee-item">
                            <div class="label">Monthly Fee</div>
                            <div class="value">${utils.formatCurrency(student.feeDetails.monthlyFee || 0)}</div>
                        </div>
                        <div class="fee-item">
                            <div class="label">Total Paid</div>
                            <div class="value">${utils.formatCurrency(student.feeDetails.totalPaidAmount || 0)}</div>
                        </div>
                        <div class="fee-item ${metrics.dueStatus.toLowerCase()}">
                            <div class="label">${metrics.dueAmount >= 0 ? 'Due Amount' : 'Overpaid'}</div>
                            <div class="value">${utils.formatCurrency(Math.abs(metrics.dueAmount))}</div>
                        </div>
                        <div class="fee-item">
                            <div class="label">Total Payments</div>
                            <div class="value">${metrics.totalPayments}</div>
                        </div>
                    </div>
                </div>

                ${student.feeDetails.monthlyPayments && student.feeDetails.monthlyPayments.length > 0 ? `
                <div class="transactions-section">
                    <h3>💳 Fee Transaction History</h3>
                    
                    <div class="summary-stats">
                        <div class="stat-item">
                            <div class="number">${student.feeDetails.monthlyPayments.length}</div>
                            <div class="label">Total Transactions</div>
                        </div>
                        <div class="stat-item">
                            <div class="number">${utils.formatCurrency(student.feeDetails.totalPaidAmount || 0)}</div>
                            <div class="label">Total Amount Paid</div>
                        </div>
                        <div class="stat-item">
                            <div class="number">${student.feeDetails.monthlyPayments[student.feeDetails.monthlyPayments.length - 1] ? 
                                utils.formatDate(student.feeDetails.monthlyPayments[student.feeDetails.monthlyPayments.length - 1].paidDate) : 'Never'}</div>
                            <div class="label">Last Payment Date</div>
                        </div>
                    </div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>S.No</th>
                                <th>Month & Year</th>
                                <th>Amount Paid</th>
                                <th>Payment Date</th>
                                <th>Payment Mode</th>
                                <th>Receipt No.</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${student.feeDetails.monthlyPayments
                                .sort((a, b) => {
                                    if (a.year !== b.year) return b.year - a.year;
                                    return new Date(b.paidDate) - new Date(a.paidDate);
                                })
                                .map((payment, index) => {
                                    const status = payment.status || 'Paid';
                                    const monthlyFee = student.feeDetails.monthlyFee || 0;
                                    let statusClass = 'paid';
                                    if (payment.amount > monthlyFee) statusClass = 'overpaid';
                                    else if (payment.amount < monthlyFee) statusClass = 'partial';
                                    
                                    return `
                                        <tr>
                                            <td>${index + 1}</td>
                                            <td><strong>${payment.month} ${payment.year}</strong></td>
                                            <td><strong>${utils.formatCurrency(payment.amount)}</strong></td>
                                            <td>${utils.formatDate(payment.paidDate)}</td>
                                            <td>${payment.paymentMode}</td>
                                            <td>${payment.receiptNumber || 'N/A'}</td>
                                            <td><span class="status-badge status-${statusClass}">${status}</span></td>
                                        </tr>
                                    `;
                                }).join('')}
                        </tbody>
                    </table>
                    
                    <div style="margin-top: 20px; padding: 15px; background: #e8f5e8; border-radius: 8px; border-left: 4px solid #28a745;">
                        <h4 style="color: #155724; margin-bottom: 10px;">📈 Payment Statistics</h4>
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; font-size: 14px;">
                            <div><strong>Average Payment:</strong> ${utils.formatCurrency((student.feeDetails.totalPaidAmount || 0) / metrics.totalPayments)}</div>
                            <div><strong>Highest Payment:</strong> ${utils.formatCurrency(Math.max(...student.feeDetails.monthlyPayments.map(p => p.amount)))}</div>
                            <div><strong>Lowest Payment:</strong> ${utils.formatCurrency(Math.min(...student.feeDetails.monthlyPayments.map(p => p.amount)))}</div>
                        </div>
                    </div>
                </div>
                ` : `
                <div class="transactions-section">
                    <h3>💳 Fee Transaction History</h3>
                    <div style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 10px; border: 2px dashed #dee2e6;">
                        <div style="font-size: 48px; color: #dee2e6; margin-bottom: 20px;">📋</div>
                        <h4 style="color: #6c757d; margin-bottom: 10px;">No Payment Records Found</h4>
                        <p style="color: #6c757d;">No fee payments have been recorded for this student yet.</p>
                    </div>
                </div>
                `}

                <div class="footer">
                    <p>This report is generated automatically and contains confidential student information.</p>
                    <p>© ${new Date().getFullYear()} Aadash Coaching Center. All rights reserved.</p>
                    <p>For any queries, contact the administration office.</p>
                </div>

                <div class="no-print">
                    <button class="btn btn-primary" onclick="window.print()">
                        🖨️ Print/Save as PDF
                    </button>
                    <button class="btn btn-secondary" onclick="window.close()">
                        ❌ Close
                    </button>
                </div>

                <script>
                    window.addEventListener('load', function() {
                        setTimeout(function() {
                            // window.print();
                        }, 1000);
                    });
                </script>
            </body>
            </html>
            `;

            const printWindow = window.open('', '_blank', 'width=1000,height=800,scrollbars=yes,resizable=yes');
            printWindow.document.write(reportHTML);
            printWindow.document.close();
            
            utils.showAlert(`📄 ${student.personalDetails.fullName}'s report opened! Click "Print/Save as PDF" to download.`, 'success');
            
        } catch (error) {
            console.error('Error generating student PDF report:', error);
            utils.showAlert('Error generating student PDF report', 'error');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.studentsManager = new StudentsManager();
});
