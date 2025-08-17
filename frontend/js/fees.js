class FeesManager {
    constructor() {
        this.students = [];
        this.faculty = [];
        this.classes = [];
        this.currentStudent = null;
        this.currentFaculty = null;
        this.analyticsData = null;
        this.charts = {};
        this.init();
    }

    async init() {
        try {
            this.bindEvents();
            await this.loadData();
            this.renderStudentFees();
            this.populateYearOptions();
        } catch (error) {
            console.error('Fees manager initialization error:', error);
            utils.showAlert('Error loading fees data', 'error');
        }
    }

    bindEvents() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Class filter
        document.getElementById('classFilter').addEventListener('change', () => {
            this.filterStudentFees();
        });

        // Due report button
        document.getElementById('viewDueReportBtn').addEventListener('click', () => {
            this.showDueReport();
        });

        // Analytics button
        document.getElementById('viewAnalyticsBtn').addEventListener('click', () => {
            this.showAnalytics();
        });

        // Export PDF button
       // In your bindEvents method, replace the PDF export event with:
document.getElementById('exportPDFBtn').addEventListener('click', () => {
    // Show user choice
    if (confirm('Choose report format:\n\nOK = Printable PDF Report\nCancel = Download CSV Report')) {
        this.exportPDFReport();
    } else {
        this.exportCSVReport();
    }
});


        // Monthly payment modal events
        document.getElementById('closeMonthlyPaymentModal').addEventListener('click', () => {
            this.closeMonthlyPaymentModal();
        });

        document.getElementById('cancelMonthlyPaymentBtn').addEventListener('click', () => {
            this.closeMonthlyPaymentModal();
        });

        document.getElementById('monthlyPaymentForm').addEventListener('submit', (e) => {
            this.handleMonthlyPaymentSubmit(e);
        });

        // Due report modal events
        document.getElementById('closeDueReportModal').addEventListener('click', () => {
            this.closeDueReportModal();
        });

        // Analytics modal events
        document.getElementById('closeAnalyticsModal').addEventListener('click', () => {
            this.closeAnalyticsModal();
        });

        // Salary payment modal events
        document.getElementById('closeSalaryPaymentModal').addEventListener('click', () => {
            this.closeSalaryPaymentModal();
        });

        document.getElementById('cancelSalaryPaymentBtn').addEventListener('click', () => {
            this.closeSalaryPaymentModal();
        });

        document.getElementById('salaryPaymentForm').addEventListener('submit', (e) => {
            this.handleSalaryPaymentSubmit(e);
        });

        // Analytics tab switching
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('analytics-tab-btn')) {
                this.switchAnalyticsTab(e.target.dataset.tab);
            }
        });

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }

    async loadData() {
        try {
            const [studentsResponse, facultyResponse, classesResponse] = await Promise.all([
                api.getStudents(),
                api.getFaculty(),
                api.getClasses()
            ]);

            this.students = studentsResponse.data || [];
            this.faculty = facultyResponse.data || [];
            this.classes = classesResponse.data || [];
            
            this.populateClassFilter();
        } catch (error) {
            console.error('Error loading data:', error);
            utils.showAlert('Error loading data', 'error');
        }
    }

    populateClassFilter() {
        const classFilter = document.getElementById('classFilter');
        classFilter.innerHTML = '<option value="">All Classes</option>';
        
        this.classes.forEach(classItem => {
            const option = document.createElement('option');
            option.value = classItem.className;
            option.textContent = classItem.className;
            classFilter.appendChild(option);
        });
    }

    populateYearOptions() {
        const yearSelect = document.querySelector('#monthlyPaymentModal select[name="year"]');
        const currentYear = new Date().getFullYear();
        
        yearSelect.innerHTML = '<option value="">Select Year</option>';
        
        for (let year = currentYear - 1; year <= currentYear + 1; year++) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            if (year === currentYear) {
                option.selected = true;
            }
            yearSelect.appendChild(option);
        }
    }

        switchTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(tabName).classList.add('active');

        if (tabName === 'student-fees') {
            this.renderStudentFees();
        } else if (tabName === 'teacher-salary') {
            this.renderTeacherSalary();
        }
    }

    renderStudentFees() {
        const tbody = document.getElementById('studentFeesTableBody');
        if (!tbody) return;
        
        if (this.students.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        <div class="empty-content">
                            <i class="fas fa-user-graduate"></i>
                            <h4>No Students Found</h4>
                            <p>No students have been added to the system yet.</p>
                            <a href="students.html" class="btn-primary">
                                <i class="fas fa-plus"></i> Add Students
                            </a>
                        </div>
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
                <tr class="fees-row">
                    <td>${student.personalDetails.studentId}</td>
                    <td>
                        <div class="student-info">
                            <strong>${student.personalDetails.fullName}</strong>
                            <br>
                            <small class="text-muted">${student.personalDetails.phone}</small>
                        </div>
                    </td>
                    <td><span class="class-badge">${student.personalDetails.className}</span></td>
                    <td><strong>${utils.formatCurrency(student.feeDetails.monthlyFee || 0)}</strong></td>
                    <td>
                        <strong>${utils.formatCurrency(student.feeDetails.totalPaidAmount || 0)}</strong>
                        <br>
                        <small class="text-muted">${student.feeDetails.monthlyPayments?.length || 0} payments</small>
                    </td>
                    <td style="color: ${dueColor}; font-weight: bold;">
                        ${utils.formatCurrency(Math.abs(dueAmount))}
                        <br>
                        <small style="color: ${dueColor}; font-weight: 600;">${dueStatus}</small>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-sm btn-payment" onclick="feesManager.addMonthlyPayment('${student._id}')" title="Add Monthly Payment">
                                <i class="fas fa-plus"></i> Payment
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    filterStudentFees() {
        const selectedClass = document.getElementById('classFilter')?.value || '';
        
        const filteredStudents = selectedClass 
            ? this.students.filter(student => student.personalDetails.className === selectedClass)
            : this.students;

        const tbody = document.getElementById('studentFeesTableBody');
        if (!tbody) return;
        
        if (filteredStudents.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        <div class="empty-content">
                            <i class="fas fa-search"></i>
                            <h4>No Students Found</h4>
                            <p>No students found for the selected class "${selectedClass}".</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        this.renderStudentFeesData(filteredStudents);
    }

    renderStudentFeesData(studentsData) {
        const tbody = document.getElementById('studentFeesTableBody');
        tbody.innerHTML = studentsData.map(student => {
            const dueAmount = student.calculatedDue || 0;
            const dueStatus = dueAmount > 0 ? 'Due' : dueAmount < 0 ? 'Overpaid' : 'Paid';
            const dueColor = dueAmount > 0 ? '#dc3545' : dueAmount < 0 ? '#17a2b8' : '#28a745';
            
            return `
                <tr class="fees-row">
                    <td>${student.personalDetails.studentId}</td>
                    <td>
                        <div class="student-info">
                            <strong>${student.personalDetails.fullName}</strong>
                            <br>
                            <small class="text-muted">${student.personalDetails.phone}</small>
                        </div>
                    </td>
                    <td><span class="class-badge">${student.personalDetails.className}</span></td>
                    <td><strong>${utils.formatCurrency(student.feeDetails.monthlyFee || 0)}</strong></td>
                    <td>
                        <strong>${utils.formatCurrency(student.feeDetails.totalPaidAmount || 0)}</strong>
                        <br>
                        <small class="text-muted">${student.feeDetails.monthlyPayments?.length || 0} payments</small>
                    </td>
                    <td style="color: ${dueColor}; font-weight: bold;">
                        ${utils.formatCurrency(Math.abs(dueAmount))}
                        <br>
                        <small style="color: ${dueColor}; font-weight: 600;">${dueStatus}</small>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-sm btn-payment" onclick="feesManager.addMonthlyPayment('${student._id}')" title="Add Monthly Payment">
                                <i class="fas fa-plus"></i> Payment
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    renderTeacherSalary() {
        const tbody = document.getElementById('teacherSalaryTableBody');
        if (!tbody) return;
        
        if (this.faculty.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">
                        <div class="empty-content">
                            <i class="fas fa-chalkboard-teacher"></i>
                            <h4>No Faculty Found</h4>
                            <p>No faculty members have been added to the system yet.</p>
                            <a href="faculty.html" class="btn-primary">
                                <i class="fas fa-plus"></i> Add Faculty
                            </a>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.faculty.map(faculty => {
            const lastPayment = faculty.salaryDetails.salaryHistory && faculty.salaryDetails.salaryHistory.length > 0 
                ? faculty.salaryDetails.salaryHistory[faculty.salaryDetails.salaryHistory.length - 1]
                : null;

            return `
                <tr class="salary-row">
                    <td>${faculty.personalDetails.facultyId}</td>
                    <td>
                        <div class="faculty-info">
                            <strong>${faculty.personalDetails.fullName}</strong>
                            <br>
                            <small class="text-muted">${faculty.personalDetails.specialization}</small>
                        </div>
                    </td>
                    <td>
                        <strong>${utils.formatCurrency(faculty.salaryDetails.totalSalary || 0)}</strong>
                        <br>
                        <small class="text-muted">${faculty.personalDetails.employmentType}</small>
                    </td>
                    <td>
                        ${lastPayment ? 
                            `<strong>${utils.formatDate(lastPayment.paidDate)}</strong><br><small class="text-muted">${lastPayment.month}</small>` : 
                            '<span class="text-muted">Never paid</span>'
                        }
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-sm btn-payment" onclick="feesManager.paySalary('${faculty._id}')" title="Pay Salary">
                                <i class="fas fa-money-bill-wave"></i> Pay
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // ==================== ANALYTICS FUNCTIONALITY ====================

    async showAnalytics() {
        try {
            const modal = document.getElementById('analyticsModal');
            if (modal) {
                modal.style.display = 'block';
            }
            
            await this.loadAnalyticsData();
            this.renderAnalytics('monthly');
            
        } catch (error) {
            console.error('Error showing analytics:', error);
            utils.showAlert('Error loading analytics', 'error');
        }
    }

    async loadAnalyticsData() {
        try {
            // Calculate analytics from existing data
            this.analyticsData = {
                monthly: this.calculateMonthlyAnalytics(),
                quarterly: this.calculateQuarterlyAnalytics(),
                yearly: this.calculateYearlyAnalytics()
            };
        } catch (error) {
            console.error('Error calculating analytics:', error);
            throw error;
        }
    }

    calculateMonthlyAnalytics() {
        const currentYear = new Date().getFullYear();
        const monthlyData = {};
        
        // Initialize months
        for (let month = 0; month < 12; month++) {
            const monthName = new Date(currentYear, month, 1).toLocaleDateString('en-US', { month: 'long' });
            monthlyData[monthName] = {
                revenue: 0,
                expenses: 0,
                profit: 0,
                studentPayments: 0,
                facultySalaries: 0
            };
        }

        // Calculate student fee revenue
        this.students.forEach(student => {
            if (student.feeDetails.monthlyPayments) {
                student.feeDetails.monthlyPayments
                    .filter(payment => payment.year === currentYear)
                    .forEach(payment => {
                        if (monthlyData[payment.month]) {
                            monthlyData[payment.month].revenue += payment.amount;
                            monthlyData[payment.month].studentPayments += payment.amount;
                        }
                    });
            }
        });

        // Calculate faculty salary expenses
        this.faculty.forEach(faculty => {
            if (faculty.salaryDetails.salaryHistory) {
                faculty.salaryDetails.salaryHistory
                    .filter(salary => {
                        const salaryYear = new Date(salary.paidDate).getFullYear();
                        return salaryYear === currentYear;
                    })
                    .forEach(salary => {
                        const salaryMonth = salary.month.split(' ')[0]; // Extract month name
                        if (monthlyData[salaryMonth]) {
                            monthlyData[salaryMonth].expenses += salary.netAmount;
                            monthlyData[salaryMonth].facultySalaries += salary.netAmount;
                        }
                    });
            }
        });

        // Calculate profit/loss
        Object.keys(monthlyData).forEach(month => {
            monthlyData[month].profit = monthlyData[month].revenue - monthlyData[month].expenses;
        });

        return monthlyData;
    }

    calculateQuarterlyAnalytics() {
        const monthlyData = this.calculateMonthlyAnalytics();
        const quarterlyData = {
            'Q1 (Jan-Mar)': { revenue: 0, expenses: 0, profit: 0 },
            'Q2 (Apr-Jun)': { revenue: 0, expenses: 0, profit: 0 },
            'Q3 (Jul-Sep)': { revenue: 0, expenses: 0, profit: 0 },
            'Q4 (Oct-Dec)': { revenue: 0, expenses: 0, profit: 0 }
        };

        const quarters = {
            'Q1 (Jan-Mar)': ['January', 'February', 'March'],
            'Q2 (Apr-Jun)': ['April', 'May', 'June'],
            'Q3 (Jul-Sep)': ['July', 'August', 'September'],
            'Q4 (Oct-Dec)': ['October', 'November', 'December']
        };

        Object.entries(quarters).forEach(([quarter, months]) => {
            months.forEach(month => {
                if (monthlyData[month]) {
                    quarterlyData[quarter].revenue += monthlyData[month].revenue;
                    quarterlyData[quarter].expenses += monthlyData[month].expenses;
                    quarterlyData[quarter].profit += monthlyData[month].profit;
                }
            });
        });

        return quarterlyData;
    }

    calculateYearlyAnalytics() {
        const currentYear = new Date().getFullYear();
        const yearlyData = {};
        
        for (let year = currentYear - 2; year <= currentYear; year++) {
            yearlyData[year] = {
                revenue: 0,
                expenses: 0,
                profit: 0,
                studentPayments: 0,
                facultySalaries: 0
            };
        }

        // Calculate student payments by year
        this.students.forEach(student => {
            if (student.feeDetails.monthlyPayments) {
                student.feeDetails.monthlyPayments.forEach(payment => {
                    if (yearlyData[payment.year]) {
                        yearlyData[payment.year].revenue += payment.amount;
                        yearlyData[payment.year].studentPayments += payment.amount;
                    }
                });
            }
        });

        // Calculate faculty salaries by year
        this.faculty.forEach(faculty => {
            if (faculty.salaryDetails.salaryHistory) {
                faculty.salaryDetails.salaryHistory.forEach(salary => {
                    const salaryYear = new Date(salary.paidDate).getFullYear();
                    if (yearlyData[salaryYear]) {
                        yearlyData[salaryYear].expenses += salary.netAmount;
                        yearlyData[salaryYear].facultySalaries += salary.netAmount;
                    }
                });
            }
        });

        // Calculate profit/loss
        Object.keys(yearlyData).forEach(year => {
            yearlyData[year].profit = yearlyData[year].revenue - yearlyData[year].expenses;
        });

        return yearlyData;
    }

    switchAnalyticsTab(period) {
        document.querySelectorAll('.analytics-tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tab="${period}"]`).classList.add('active');
        
        this.renderAnalytics(period);
    }

    renderAnalytics(period) {
        if (!this.analyticsData || !this.analyticsData[period]) return;
        
        const data = this.analyticsData[period];
        this.updateAnalyticsSummary(data);
        this.renderAnalyticsCharts(data, period);
        this.renderFinancialDetailsTable(data, period);
    }

    updateAnalyticsSummary(data) {
        const totalRevenue = Object.values(data).reduce((sum, item) => sum + (item.revenue || 0), 0);
        const totalExpenses = Object.values(data).reduce((sum, item) => sum + (item.expenses || 0), 0);
        const netProfit = totalRevenue - totalExpenses;
        const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;

        document.getElementById('totalRevenue').textContent = utils.formatCurrency(totalRevenue);
        document.getElementById('totalExpenses').textContent = utils.formatCurrency(totalExpenses);
        document.getElementById('netProfit').textContent = utils.formatCurrency(netProfit);
        document.getElementById('profitMargin').textContent = `${profitMargin}%`;

        // Update colors based on profit/loss
        const profitElement = document.getElementById('netProfit');
        const marginElement = document.getElementById('profitMargin');
        
        if (netProfit >= 0) {
            profitElement.style.color = '#28a745';
            marginElement.style.color = '#28a745';
        } else {
            profitElement.style.color = '#dc3545';
            marginElement.style.color = '#dc3545';
        }
    }

    renderAnalyticsCharts(data, period) {
        this.destroyExistingCharts();
        
        // Revenue vs Expenses Chart
        const revenueCtx = document.getElementById('revenueChart');
        if (revenueCtx) {
            this.charts.revenue = new Chart(revenueCtx, {
                type: 'bar',
                data: {
                    labels: Object.keys(data),
                    datasets: [
                        {
                            label: 'Revenue',
                            data: Object.values(data).map(item => item.revenue || 0),
                            backgroundColor: '#28a745',
                            borderColor: '#28a745',
                            borderWidth: 1
                        },
                        {
                            label: 'Expenses',
                            data: Object.values(data).map(item => item.expenses || 0),
                            backgroundColor: '#dc3545',
                            borderColor: '#dc3545',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return '₹' + value.toLocaleString();
                                }
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return context.dataset.label + ': ₹' + context.parsed.y.toLocaleString();
                                }
                            }
                        }
                    }
                }
            });
        }

        // Trends Chart (Profit/Loss)
        const trendsCtx = document.getElementById('trendsChart');
        if (trendsCtx) {
            this.charts.trends = new Chart(trendsCtx, {
                type: 'line',
                data: {
                    labels: Object.keys(data),
                    datasets: [{
                        label: 'Net Profit/Loss',
                        data: Object.values(data).map(item => item.profit || 0),
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: false,
                            ticks: {
                                callback: function(value) {
                                    return '₹' + value.toLocaleString();
                                }
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const value = context.parsed.y;
                                    const prefix = value >= 0 ? 'Profit: ₹' : 'Loss: ₹';
                                    return prefix + Math.abs(value).toLocaleString();
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    renderFinancialDetailsTable(data, period) {
        const tbody = document.getElementById('financialDetailsTableBody');
        if (!tbody) return;

        tbody.innerHTML = Object.entries(data).map(([periodName, values]) => {
            const profit = values.profit || 0;
            const profitClass = profit >= 0 ? 'profit' : 'loss';
            
            return `
                <tr>
                    <td><strong>${periodName}</strong></td>
                    <td>${utils.formatCurrency(values.revenue || 0)}</td>
                    <td>${utils.formatCurrency(values.expenses || 0)}</td>
                    <td>₹0</td>
                    <td class="${profitClass}" style="color: ${profit >= 0 ? '#28a745' : '#dc3545'};">
                        ${utils.formatCurrency(profit)}
                    </td>
                </tr>
            `;
        }).join('');
    }

    destroyExistingCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.charts = {};
    }

    closeAnalyticsModal() {
        const modal = document.getElementById('analyticsModal');
        if (modal) {
            modal.style.display = 'none';
        }
        this.destroyExistingCharts();
    }

    // ==================== PDF EXPORT FUNCTIONALITY ====================

   // ==================== FIXED PDF EXPORT FUNCTIONALITY ====================

// ==================== FIXED PDF EXPORT FUNCTIONALITY ====================

// ==================== WORKING PDF EXPORT FUNCTIONALITY ====================

// ==================== WORKING EXPORT FUNCTIONALITY ====================

async exportPDFReport() {
    try {
        // Show loading state
        const exportBtn = document.getElementById('exportPDFBtn');
        if (exportBtn) {
            exportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating Report...';
            exportBtn.disabled = true;
        }

        // Load analytics data if not already loaded
        if (!this.analyticsData) {
            await this.loadAnalyticsData();
        }

        // Use simple window.print() approach
        this.generatePrintableReport();
        
    } catch (error) {
        console.error('Error generating report:', error);
        utils.showAlert('Error generating report', 'error');
    } finally {
        // Reset button
        const exportBtn = document.getElementById('exportPDFBtn');
        if (exportBtn) {
            exportBtn.innerHTML = '<i class="fas fa-file-pdf"></i> Export PDF Report';
            exportBtn.disabled = false;
        }
    }
}

generatePrintableReport() {
    try {
        const currentYear = new Date().getFullYear();
        const currentYearData = this.analyticsData.yearly[currentYear] || { revenue: 0, expenses: 0, profit: 0 };
        
        // Calculate additional metrics
        const totalExpectedMonthlyRevenue = this.students.reduce((sum, student) => 
            sum + (student.feeDetails.monthlyFee || 0), 0
        );
        const totalCollectedRevenue = this.students.reduce((sum, student) => 
            sum + (student.feeDetails.totalPaidAmount || 0), 0
        );
        const studentsWithDues = this.students.filter(student => 
            (student.calculatedDue || 0) > 0
        ).length;
        const totalMonthlySalaryExpense = this.faculty.reduce((sum, faculty) => 
            sum + (faculty.salaryDetails.totalSalary || 0), 0
        );

        // Create the report HTML
        const reportHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Aadash Coaching Center - Financial Report</title>
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
                
                .section { 
                    margin: 25px 0; 
                    page-break-inside: avoid;
                }
                .section h3 { 
                    color: #2c3e50; 
                    font-size: 18px; 
                    margin-bottom: 15px; 
                    border-bottom: 2px solid #e9ecef; 
                    padding-bottom: 5px;
                }
                
                .summary-grid { 
                    display: grid; 
                    grid-template-columns: 1fr 1fr; 
                    gap: 20px; 
                    margin-bottom: 20px;
                }
                .summary-card { 
                    background: #f8f9fa; 
                    padding: 20px; 
                    border-radius: 8px; 
                    border-left: 4px solid #667eea;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .summary-card h4 { 
                    color: #2c3e50; 
                    margin-bottom: 15px; 
                    font-size: 16px;
                }
                .summary-card p { 
                    margin: 8px 0; 
                    font-size: 14px;
                }
                .summary-card strong { 
                    color: #495057; 
                }
                
                table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin: 15px 0; 
                    background: white;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }
                th, td { 
                    border: 1px solid #dee2e6; 
                    padding: 12px 8px; 
                    text-align: left; 
                    font-size: 12px;
                }
                th { 
                    background: #667eea; 
                    color: white; 
                    font-weight: bold;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                tr:nth-child(even) { 
                    background: #f8f9fa; 
                }
                
                .profit { 
                    color: #28a745; 
                    font-weight: bold; 
                }
                .loss { 
                    color: #dc3545; 
                    font-weight: bold; 
                }
                .neutral { 
                    color: #6c757d; 
                    font-weight: bold; 
                }
                
                .metric-list { 
                    background: #f8f9fa; 
                    padding: 15px; 
                    border-radius: 8px; 
                    margin: 10px 0;
                }
                .metric-list ul { 
                    list-style: none; 
                }
                .metric-list li { 
                    padding: 5px 0; 
                    border-bottom: 1px solid #e9ecef;
                    font-size: 14px;
                }
                .metric-list li:last-child { 
                    border-bottom: none; 
                }
                .metric-list strong { 
                    color: #495057; 
                }
                
                .recommendations { 
                    background: #e3f2fd; 
                    padding: 20px; 
                    border-radius: 8px; 
                    border-left: 4px solid #2196f3;
                }
                .recommendations ul { 
                    margin-left: 20px; 
                }
                .recommendations li { 
                    margin: 8px 0; 
                    font-size: 14px;
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
                .btn:hover { 
                    transform: translateY(-2px); 
                    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                }
                
                @media print {
                    .no-print { display: none !important; }
                    body { padding: 0; }
                    .section { page-break-inside: avoid; }
                    .summary-grid { grid-template-columns: 1fr; }
                }
                
                @media (max-width: 768px) {
                    .summary-grid { grid-template-columns: 1fr; }
                    table { font-size: 10px; }
                    th, td { padding: 6px 4px; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🎓 AADASH COACHING CENTER</h1>
                <h2>📊 Financial Report ${currentYear}</h2>
                <p>Generated on: ${new Date().toLocaleDateString('en-IN', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}</p>
            </div>

            <div class="section">
                <h3>📈 Executive Summary</h3>
                <div class="summary-grid">
                    <div class="summary-card">
                        <h4>💰 Financial Overview</h4>
                        <p><strong>Total Revenue:</strong> ${utils.formatCurrency(currentYearData.revenue)}</p>
                        <p><strong>Total Expenses:</strong> ${utils.formatCurrency(currentYearData.expenses)}</p>
                        <p><strong>Net Profit/Loss:</strong> 
                            <span class="${currentYearData.profit >= 0 ? 'profit' : 'loss'}">
                                ${utils.formatCurrency(currentYearData.profit)}
                            </span>
                        </p>
                        <p><strong>Profit Margin:</strong> 
                            ${currentYearData.revenue > 0 ? 
                                ((currentYearData.profit / currentYearData.revenue) * 100).toFixed(1) : 0}%
                        </p>
                    </div>
                    <div class="summary-card">
                        <h4>🏫 Organization Summary</h4>
                        <p><strong>Total Students:</strong> ${this.students.length}</p>
                        <p><strong>Total Faculty:</strong> ${this.faculty.length}</p>
                        <p><strong>Total Classes:</strong> ${this.classes.length}</p>
                        <p><strong>Students with Dues:</strong> ${studentsWithDues}</p>
                    </div>
                </div>
            </div>

            <div class="section">
                <h3>📅 Monthly Financial Breakdown</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Month</th>
                            <th>Revenue</th>
                            <th>Expenses</th>
                            <th>Profit/Loss</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.entries(this.analyticsData.monthly).map(([month, data]) => {
                            const profit = data.profit || 0;
                            const status = profit > 0 ? 'Profit' : profit < 0 ? 'Loss' : 'Break Even';
                            const statusClass = profit > 0 ? 'profit' : profit < 0 ? 'loss' : 'neutral';
                            
                            return `
                                <tr>
                                    <td><strong>${month}</strong></td>
                                    <td>${utils.formatCurrency(data.revenue || 0)}</td>
                                    <td>${utils.formatCurrency(data.expenses || 0)}</td>
                                    <td class="${statusClass}">${utils.formatCurrency(Math.abs(profit))}</td>
                                    <td class="${statusClass}">${status}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>

            <div class="section">
                <h3>🎓 Student Analysis</h3>
                <div class="metric-list">
                    <ul>
                        <li><strong>Total Students:</strong> ${this.students.length}</li>
                        <li><strong>Expected Monthly Revenue:</strong> ${utils.formatCurrency(totalExpectedMonthlyRevenue)}</li>
                        <li><strong>Total Collected Revenue:</strong> ${utils.formatCurrency(totalCollectedRevenue)}</li>
                        <li><strong>Students with Dues:</strong> ${studentsWithDues}</li>
                        <li><strong>Collection Efficiency:</strong> ${totalExpectedMonthlyRevenue > 0 ? 
                            ((totalCollectedRevenue / (totalExpectedMonthlyRevenue * 12)) * 100).toFixed(1) : 0}%</li>
                        <li><strong>Average Fee per Student:</strong> ${this.students.length > 0 ? 
                            utils.formatCurrency(totalExpectedMonthlyRevenue / this.students.length) : '₹0'}</li>
                    </ul>
                </div>
            </div>

            <div class="section">
                <h3>👨‍🏫 Faculty Analysis</h3>
                <div class="metric-list">
                    <ul>
                        <li><strong>Total Faculty:</strong> ${this.faculty.length}</li>
                        <li><strong>Monthly Salary Expense:</strong> ${utils.formatCurrency(totalMonthlySalaryExpense)}</li>
                        <li><strong>Average Faculty Salary:</strong> ${this.faculty.length > 0 ? 
                            utils.formatCurrency(totalMonthlySalaryExpense / this.faculty.length) : '₹0'}</li>
                        <li><strong>Salary to Revenue Ratio:</strong> ${totalExpectedMonthlyRevenue > 0 ? 
                            ((totalMonthlySalaryExpense / totalExpectedMonthlyRevenue) * 100).toFixed(1) : 0}%</li>
                        <li><strong>Faculty Efficiency:</strong> ${this.faculty.length > 0 ? 
                            (this.students.length / this.faculty.length).toFixed(1) : 0} students per faculty</li>
                    </ul>
                </div>
            </div>

            <div class="section">
                <h3>📊 Quarterly Summary</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Quarter</th>
                            <th>Revenue</th>
                            <th>Expenses</th>
                            <th>Profit/Loss</th>
                            <th>Margin %</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.entries(this.analyticsData.quarterly).map(([quarter, data]) => {
                            const profit = data.profit || 0;
                            const margin = data.revenue > 0 ? ((profit / data.revenue) * 100).toFixed(1) : '0';
                            const statusClass = profit > 0 ? 'profit' : profit < 0 ? 'loss' : 'neutral';
                            
                            return `
                                <tr>
                                    <td><strong>${quarter}</strong></td>
                                    <td>${utils.formatCurrency(data.revenue || 0)}</td>
                                    <td>${utils.formatCurrency(data.expenses || 0)}</td>
                                    <td class="${statusClass}">${utils.formatCurrency(profit)}</td>
                                    <td class="${statusClass}">${margin}%</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>

            <div class="section">
                <h3>💡 Recommendations</h3>
                <div class="recommendations">
                    <ul>
                        ${currentYearData.profit < 0 ? 
                            '<li>🚨 <strong>Critical:</strong> Review fee structure or reduce operational costs to achieve profitability</li>' : ''}
                        ${studentsWithDues > this.students.length * 0.2 ? 
                            '<li>⚠️ <strong>Important:</strong> Implement stricter fee collection policies - over 20% students have dues</li>' : ''}
                        ${totalMonthlySalaryExpense > totalExpectedMonthlyRevenue * 0.6 ? 
                            '<li>💰 <strong>Financial:</strong> Review faculty salary structure for long-term sustainability</li>' : ''}
                        ${currentYearData.profit > 0 ? 
                            '<li>✅ <strong>Growth:</strong> Consider investing profits in infrastructure or additional courses</li>' : ''}
                        <li>📋 <strong>Management:</strong> Conduct regular monthly financial reviews</li>
                        <li>📊 <strong>Records:</strong> Maintain detailed transaction records for better planning</li>
                        <li>🎯 <strong>Strategy:</strong> Monitor key metrics: collection efficiency, profit margins, and growth trends</li>
                    </ul>
                </div>
            </div>

            <div class="footer">
                <p>This report is confidential and intended for internal use only.</p>
                <p>© ${currentYear} Aadash Coaching Center. All rights reserved.</p>
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
                // Auto-focus print dialog after page loads
                window.addEventListener('load', function() {
                    setTimeout(function() {
                        // Uncomment the line below to auto-open print dialog
                        // window.print();
                    }, 1000);
                });
            </script>
        </body>
        </html>
        `;

        // Open in new window
        const printWindow = window.open('', '_blank', 'width=1000,height=800,scrollbars=yes,resizable=yes');
        printWindow.document.write(reportHTML);
        printWindow.document.close();
        
        utils.showAlert('📄 Report opened in new window! Click "Print/Save as PDF" to download.', 'success');
        
    } catch (error) {
        console.error('Error generating printable report:', error);
        utils.showAlert('Error generating report', 'error');
    }
}

// Also add a CSV export as backup
async exportCSVReport() {
    try {
        if (!this.analyticsData) {
            await this.loadAnalyticsData();
        }

        const currentYear = new Date().getFullYear();
        const currentYearData = this.analyticsData.yearly[currentYear] || { revenue: 0, expenses: 0, profit: 0 };
        
        let csvContent = 'AADASH COACHING CENTER - FINANCIAL REPORT\n';
        csvContent += `Generated: ${new Date().toLocaleString()}\n\n`;
        
        // Executive Summary
        csvContent += 'EXECUTIVE SUMMARY\n';
        csvContent += 'Metric,Value\n';
        csvContent += `Total Revenue,${currentYearData.revenue}\n`;
        csvContent += `Total Expenses,${currentYearData.expenses}\n`;
        csvContent += `Net Profit/Loss,${currentYearData.profit}\n`;
        csvContent += `Total Students,${this.students.length}\n`;
        csvContent += `Total Faculty,${this.faculty.length}\n`;
        csvContent += `Total Classes,${this.classes.length}\n\n`;
        
        // Monthly Breakdown
        csvContent += 'MONTHLY BREAKDOWN\n';
        csvContent += 'Month,Revenue,Expenses,Profit/Loss\n';
        Object.entries(this.analyticsData.monthly).forEach(([month, data]) => {
            csvContent += `${month},${data.revenue || 0},${data.expenses || 0},${data.profit || 0}\n`;
        });
        
        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Aadash_Financial_Report_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        utils.showAlert('📊 CSV report downloaded successfully!', 'success');
        
    } catch (error) {
        console.error('Error generating CSV:', error);
        utils.showAlert('Error generating CSV report', 'error');
    }
}


// Helper method to dynamically load jsPDF if not available
async loadJsPDFDynamically() {
    try {
        // Load jsPDF dynamically
        const jsPDFScript = document.createElement('script');
        jsPDFScript.src = 'https://unpkg.com/jspdf@latest/dist/jspdf.umd.min.js';
        
        const autoTableScript = document.createElement('script');
        autoTableScript.src = 'https://unpkg.com/jspdf-autotable@latest/dist/jspdf.plugin.autotable.min.js';
        
        // Load jsPDF first
        document.head.appendChild(jsPDFScript);
        
        await new Promise((resolve, reject) => {
            jsPDFScript.onload = resolve;
            jsPDFScript.onerror = reject;
        });
        
        // Then load autoTable
        document.head.appendChild(autoTableScript);
        
        await new Promise((resolve, reject) => {
            autoTableScript.onload = resolve;
            autoTableScript.onerror = reject;
        });
        
        console.log('jsPDF loaded dynamically');
        
    } catch (error) {
        console.error('Failed to load jsPDF dynamically:', error);
        throw error;
    }
}

    // ==================== PAYMENT FUNCTIONALITY ====================

    async addMonthlyPayment(studentId) {
        try {
            const student = this.students.find(s => s._id === studentId);
            if (!student) {
                utils.showAlert('Student not found', 'error');
                return;
            }
            
            this.currentStudent = student;
            
            const modal = document.getElementById('monthlyPaymentModal');
            const form = document.getElementById('monthlyPaymentForm');
            const studentNameField = document.getElementById('monthlyPaymentStudentName');
            const feeHint = document.getElementById('monthlyFeeHint');
            
            if (studentNameField) {
                studentNameField.value = student.personalDetails.fullName;
            }
            
            if (feeHint) {
                feeHint.textContent = `Monthly Fee: ${utils.formatCurrency(student.feeDetails.monthlyFee)}`;
            }
            
            if (form) {
                form.reset();
                
                const amountField = form.querySelector('input[name="amount"]');
                if (amountField) {
                    amountField.value = student.feeDetails.monthlyFee;
                }
                
                const currentDate = new Date();
                const monthSelect = form.querySelector('select[name="month"]');
                const yearSelect = form.querySelector('select[name="year"]');
                
                if (monthSelect) {
                    const currentMonth = currentDate.toLocaleDateString('en-US', { month: 'long' });
                    monthSelect.value = currentMonth;
                }
                
                if (yearSelect) {
                    yearSelect.value = currentDate.getFullYear();
                }
            }
            
            if (modal) {
                modal.style.display = 'block';
            }
            
        } catch (error) {
            console.error('Error opening payment modal:', error);
            utils.showAlert('Error loading payment form', 'error');
        }
    }

    closeMonthlyPaymentModal() {
        const modal = document.getElementById('monthlyPaymentModal');
        if (modal) {
            modal.style.display = 'none';
        }
        this.currentStudent = null;
    }

    async handleMonthlyPaymentSubmit(e) {
        e.preventDefault();
        
        try {
            const formData = new FormData(e.target);
            const month = formData.get('month');
            const year = parseInt(formData.get('year'));
            const amount = parseFloat(formData.get('amount'));
            
            if (!month || !year || !amount || amount <= 0) {
                utils.showAlert('Please fill all required fields with valid values', 'error');
                return;
            }

            const paymentData = {
                month: month,
                year: year,
                amount: amount,
                paymentMode: formData.get('paymentMode') || 'Cash',
                remarks: formData.get('remarks')?.trim() || ''
            };

            const submitBtn = e.target.querySelector('button[type="submit"]');
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            submitBtn.disabled = true;

            try {
                const response = await api.addMonthlyPayment(this.currentStudent._id, paymentData);
                
                utils.showAlert(
                    `Payment for ${month} ${year} recorded successfully! Receipt: ${response.receiptNumber}`, 
                    'success'
                );
                
                this.closeMonthlyPaymentModal();
                await this.loadData();
                this.renderStudentFees();
                
            } finally {
                submitBtn.innerHTML = 'Record Payment';
                submitBtn.disabled = false;
            }
            
        } catch (error) {
            console.error('Error recording payment:', error);
            utils.showAlert(error.message || 'Error recording payment', 'error');
        }
    }

    async paySalary(facultyId) {
        try {
            const faculty = this.faculty.find(f => f._id === facultyId);
            if (!faculty) {
                utils.showAlert('Faculty member not found', 'error');
                return;
            }
            
            this.currentFaculty = faculty;
            
            const modal = document.getElementById('salaryPaymentModal');
            const form = document.getElementById('salaryPaymentForm');
            const facultyNameField = document.getElementById('salaryPaymentFacultyName');
            
            if (facultyNameField) {
                facultyNameField.value = faculty.personalDetails.fullName;
            }
            
            if (form) {
                form.reset();
                
                const currentDate = new Date();
                const currentMonth = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                
                const monthField = form.querySelector('input[name="month"]');
                const amountField = form.querySelector('input[name="amount"]');
                
                if (monthField) monthField.value = currentMonth;
                if (amountField) amountField.value = faculty.salaryDetails.totalSalary;
            }
            
            if (modal) {
                modal.style.display = 'block';
            }
            
        } catch (error) {
            console.error('Error opening salary modal:', error);
            utils.showAlert('Error loading salary payment form', 'error');
        }
    }

    closeSalaryPaymentModal() {
        const modal = document.getElementById('salaryPaymentModal');
        if (modal) {
            modal.style.display = 'none';
        }
        this.currentFaculty = null;
    }

    async handleSalaryPaymentSubmit(e) {
        e.preventDefault();
        
        try {
            const formData = new FormData(e.target);
            const month = formData.get('month')?.trim();
            const amount = parseFloat(formData.get('amount'));
            const deductions = parseFloat(formData.get('deductions')) || 0;
            
            if (!month || !amount || amount <= 0) {
                utils.showAlert('Please fill all required fields with valid values', 'error');
                return;
            }

            const salaryData = {
                month: month,
                amount: amount,
                deductions: deductions,
                remarks: formData.get('remarks')?.trim() || ''
            };

            const submitBtn = e.target.querySelector('button[type="submit"]');
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            submitBtn.disabled = true;

            try {
                await api.addSalaryPayment(this.currentFaculty._id, salaryData);
                
                const netAmount = amount - deductions;
                utils.showAlert(
                    `Salary for ${month} paid successfully! Net Amount: ${utils.formatCurrency(netAmount)}`, 
                    'success'
                );
                
                this.closeSalaryPaymentModal();
                await this.loadData();
                this.renderTeacherSalary();
                
            } finally {
                submitBtn.innerHTML = 'Record Salary Payment';
                submitBtn.disabled = false;
            }
            
        } catch (error) {
            console.error('Error recording salary:', error);
            utils.showAlert(error.message || 'Error recording salary payment', 'error');
        }
    }

    async showDueReport() {
        try {
            const modal = document.getElementById('dueReportModal');
            if (modal) {
                modal.style.display = 'block';
            }
            
            const summaryDiv = document.getElementById('reportSummary');
            if (summaryDiv) {
                summaryDiv.innerHTML = `
                    <div class="loading-state">
                        <div class="spinner"></div>
                        <p>Loading due/overpaid report...</p>
                    </div>
                `;
            }
            
            const response = await api.getDueSummary();
            const summary = response.data;
            
            if (summaryDiv) {
                summaryDiv.innerHTML = `
                    <div class="summary-cards">
                        <div class="summary-card due">
                            <div class="summary-icon">
                                <i class="fas fa-exclamation-triangle"></i>
                            </div>
                            <div class="summary-content">
                                <h4>Students with Dues</h4>
                                <div class="summary-number">${summary.studentsWithDues}</div>
                                <div class="summary-amount">Total: ${utils.formatCurrency(summary.totalDueAmount)}</div>
                            </div>
                        </div>
                        
                        <div class="summary-card overpaid">
                            <div class="summary-icon">
                                <i class="fas fa-plus-circle"></i>
                            </div>
                            <div class="summary-content">
                                <h4>Students with Overpayment</h4>
                                <div class="summary-number">${summary.studentsWithOverpayment}</div>
                                <div class="summary-amount">Total: ${utils.formatCurrency(summary.totalOverpaidAmount)}</div>
                            </div>
                        </div>
                        
                        <div class="summary-card total">
                            <div class="summary-icon">
                                <i class="fas fa-users"></i>
                            </div>
                            <div class="summary-content">
                                <h4>Total Active Students</h4>
                                <div class="summary-number">${summary.totalStudents}</div>
                                <div class="summary-amount">In the system</div>
                            </div>
                        </div>
                    </div>
                `;
            }
            
            const tbody = document.getElementById('dueReportTableBody');
            if (tbody) {
                tbody.innerHTML = summary.details.map(student => {
                    const statusColor = student.status === 'Due' ? '#dc3545' : 
                                      student.status === 'Overpaid' ? '#17a2b8' : '#28a745';
                    
                    return `
                        <tr>
                            <td>${student.studentId}</td>
                            <td>${student.name}</td>
                            <td><span class="class-badge">${student.className}</span></td>
                            <td>${utils.formatCurrency(student.monthlyFee)}</td>
                            <td>${utils.formatCurrency(student.totalPaid)}</td>
                            <td style="color: ${statusColor}; font-weight: bold;">
                                ${utils.formatCurrency(Math.abs(student.dueAmount))}
                            </td>
                            <td>
                                <span class="report-status" style="background-color: ${statusColor};">
                                    ${student.status}
                                </span>
                            </td>
                        </tr>
                    `;
                }).join('');
            }
            
        } catch (error) {
            console.error('Error loading due report:', error);
            utils.showAlert('Error loading due report', 'error');
        }
    }

    closeDueReportModal() {
        const modal = document.getElementById('dueReportModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.feesManager = new FeesManager();
});

