class API {
    constructor() {
        this.baseURL = '/api';
    }

   async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        const data = await response.json();

        if (!response.ok) {
            // Show detailed validation errors
            console.error('API Error Details:', {
                status: response.status,
                url: url,
                method: options.method || 'GET',
                requestData: options.body,
                responseData: data
            });

            // Extract validation error details if available
            if (data.errors && Array.isArray(data.errors)) {
                const errorMessages = data.errors.map(err => `${err.field}: ${err.message}`).join(', ');
                throw new Error(`Validation failed: ${errorMessages}`);
            }

            throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        return data;
    } catch (error) {
        console.error('API Request Failed:', error);
        throw error;
    }
}



    // Class API methods
    async getClasses() {
        return this.request('/classes');
    }

    async createClass(classData) {
        return this.request('/classes', {
            method: 'POST',
            body: JSON.stringify(classData)
        });
    }

    async deleteClass(id) {
        return this.request(`/classes/${id}`, {
            method: 'DELETE'
        });
    }

    // Student API methods
    async getStudents(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/students?${queryString}` : '/students';
        return this.request(endpoint);
    }

    async getStudent(id) {
        return this.request(`/students/${id}`);
    }

    async createStudent(studentData) {
        return this.request('/students', {
            method: 'POST',
            body: JSON.stringify(studentData)
        });
    }

    async updateStudent(id, studentData) {
        return this.request(`/students/${id}`, {
            method: 'PUT',
            body: JSON.stringify(studentData)
        });
    }

    async deleteStudent(id) {
        return this.request(`/students/${id}`, {
            method: 'DELETE'
        });
    }

    // Monthly payment for students
    async addMonthlyPayment(studentId, paymentData) {
        return this.request(`/students/${studentId}/monthly-payment`, {
            method: 'POST',
            body: JSON.stringify(paymentData)
        });
    }

    // Get due/overpaid summary
    async getDueSummary() {
        return this.request('/students/reports/due-summary');
    }

    // Faculty API methods
   // In your api.js file, update the getFaculty method
async getFaculty(facultyId = null) {
    try {
        const endpoint = facultyId ? `/faculty/${facultyId}` : '/faculty';
        const response = await this.request(endpoint);
        return response;
    } catch (error) {
        console.error('API Error - getFaculty:', error);
        throw error;
    }
}


    async getFacultyMember(id) {
        return this.request(`/faculty/${id}`);
    }

    async createFaculty(facultyData) {
        return this.request('/faculty', {
            method: 'POST',
            body: JSON.stringify(facultyData)
        });
    }

    async updateFaculty(id, facultyData) {
        return this.request(`/faculty/${id}`, {
            method: 'PUT',
            body: JSON.stringify(facultyData)
        });
    }

    async deleteFaculty(id) {
        return this.request(`/faculty/${id}`, {
            method: 'DELETE'
        });
    }

    async addSalaryPayment(facultyId, salaryData) {
        return this.request(`/faculty/${facultyId}/salary`, {
            method: 'POST',
            body: JSON.stringify(salaryData)
        });
    }
}

// Global API instance
const api = new API();

// Utility functions
class Utils {
    static formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    }

    static formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-IN');
    }

    static showAlert(message, type = 'info', duration = 5000) {
        const alertContainer = document.getElementById('alertContainer');
        if (!alertContainer) return;

        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        
        const icon = type === 'success' ? 'fas fa-check-circle' : 
                    type === 'error' ? 'fas fa-exclamation-circle' : 
                    'fas fa-info-circle';
        
        alert.innerHTML = `
            <i class="${icon}"></i>
            <span>${message}</span>
        `;

        alertContainer.appendChild(alert);

        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, duration);

        alert.addEventListener('click', () => {
            alert.remove();
        });
    }

    static validatePhone(phone) {
        const phoneRegex = /^[6-9]\d{9}$/;
        return phoneRegex.test(phone);
    }

    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static showLoading(element, show = true) {
        if (show) {
            element.classList.add('loading');
        } else {
            element.classList.remove('loading');
        }
    }

    // Generate ID Card with photo upload option
    static generateIDCardWithPhoto(student, photoFile = null) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = 400;
        canvas.height = 280;
        
        // Background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Border
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 3;
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
        
        // Header
        ctx.fillStyle = '#667eea';
        ctx.fillRect(10, 10, canvas.width - 20, 60);
        
        // School name
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('AADASH COACHING CENTER', canvas.width / 2, 35);
        ctx.font = '12px Arial';
        ctx.fillText('Student ID Card', canvas.width / 2, 55);
        
        if (photoFile) {
            const img = new Image();
            img.onload = function() {
                // Draw photo (right side)
                ctx.drawImage(img, 250, 80, 120, 120);
                
                // Draw student details (left side)
                ctx.fillStyle = '#333333';
                ctx.textAlign = 'left';
                ctx.font = 'bold 16px Arial';
                ctx.fillText('ID: ' + student.personalDetails.studentId, 30, 100);
                
                ctx.font = '14px Arial';
                ctx.fillText('Name: ' + student.personalDetails.fullName, 30, 125);
                ctx.fillText('Father: ' + student.personalDetails.fatherName, 30, 145);
                ctx.fillText('Class: ' + student.personalDetails.className, 30, 165);
                ctx.fillText('Phone: ' + student.personalDetails.phone, 30, 185);
                
                // Generate and download
                canvas.toBlob((blob) => {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${student.personalDetails.studentId}_ID_Card_With_Photo.png`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                });
            };
            img.src = URL.createObjectURL(photoFile);
        } else {
            // Draw without photo
            ctx.fillStyle = '#333333';
            ctx.textAlign = 'left';
            ctx.font = 'bold 16px Arial';
            ctx.fillText('ID: ' + student.personalDetails.studentId, 30, 100);
            
            ctx.font = '14px Arial';
            ctx.fillText('Name: ' + student.personalDetails.fullName, 30, 125);
            ctx.fillText('Father: ' + student.personalDetails.fatherName, 30, 145);
            ctx.fillText('Class: ' + student.personalDetails.className, 30, 165);
            ctx.fillText('Phone: ' + student.personalDetails.phone, 30, 185);
            
            // No photo placeholder
            ctx.strokeStyle = '#ddd';
            ctx.lineWidth = 2;
            ctx.strokeRect(250, 80, 120, 120);
            ctx.fillStyle = '#999';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('No Photo', 310, 145);
            
            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${student.personalDetails.studentId}_ID_Card.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            });
        }
    }
}

const utils = Utils;
