// Admin Setup System
// Handles first-time administrator configuration

class AdminSetup {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 4;
        this.adminData = {};
        this.baseURL = 'http://localhost:5000/api/admin';
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Password validation
        const passwordInput = document.getElementById('adminPassword');
        if (passwordInput) {
            passwordInput.addEventListener('input', this.validatePassword.bind(this));
        }

        // Confirm password validation
        const confirmPasswordInput = document.getElementById('confirmPassword');
        if (confirmPasswordInput) {
            confirmPasswordInput.addEventListener('input', this.validatePasswordMatch.bind(this));
        }

        // Form validation
        const adminDetailsForm = document.getElementById('adminDetailsForm');
        if (adminDetailsForm) {
            adminDetailsForm.addEventListener('input', this.validateAdminDetails.bind(this));
        }
    }

    async runSystemCheck() {
        this.setLoading(true, 'systemCheck');
        this.showAlert('systemCheckAlert', 'Running system diagnostics...', 'info');

        try {
            // Check database connectivity
            const dbResponse = await fetch(`${this.baseURL}/check-database`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            // Check if admin exists
            const adminResponse = await fetch(`${this.baseURL}/check-admin-exists`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            const adminResult = await adminResponse.json();

            if (adminResult.adminExists) {
                this.showAlert('systemCheckAlert', 'Admin account already exists. Please use the login page.', 'warning');
                setTimeout(() => {
                    window.location.href = '/frontend/admin/admin-login.html';
                }, 3000);
                return;
            }

            // Simulate additional checks
            await new Promise(resolve => setTimeout(resolve, 2000));

            this.showAlert('systemCheckAlert', 'System check completed successfully!', 'success');
            
            setTimeout(() => {
                this.nextStep();
            }, 1500);

        } catch (error) {
            console.error('System check error:', error);
            this.showAlert('systemCheckAlert', 'System check failed. Please ensure the server is running.', 'error');
        } finally {
            this.setLoading(false, 'systemCheck');
        }
    }

    validatePassword() {
        const password = document.getElementById('adminPassword').value;
        const requirements = {
            'req-length': password.length >= 8,
            'req-uppercase': /[A-Z]/.test(password),
            'req-lowercase': /[a-z]/.test(password),
            'req-number': /\d/.test(password),
            'req-special': /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
        };

        Object.keys(requirements).forEach(reqId => {
            const element = document.getElementById(reqId);
            const icon = element.querySelector('.icon');
            
            if (requirements[reqId]) {
                element.classList.add('valid');
                icon.textContent = '✓';
            } else {
                element.classList.remove('valid');
                icon.textContent = '✗';
            }
        });

        return Object.values(requirements).every(req => req);
    }

    validatePasswordMatch() {
        const password = document.getElementById('adminPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const confirmInput = document.getElementById('confirmPassword');

        if (confirmPassword && password !== confirmPassword) {
            confirmInput.classList.add('error');
            return false;
        } else {
            confirmInput.classList.remove('error');
            return true;
        }
    }

    validateAdminDetails() {
        const name = document.getElementById('adminName').value.trim();
        const email = document.getElementById('adminEmail').value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        return name.length >= 2 && emailRegex.test(email);
    }

    validateCurrentStep() {
        switch (this.currentStep) {
            case 1:
                return true; // System check is handled separately
            case 2:
                if (!this.validateAdminDetails()) {
                    this.showAlert('adminDetailsAlert', 'Please fill in all required fields with valid information.', 'error');
                    return false;
                }
                break;
            case 3:
                if (!this.validatePassword()) {
                    this.showAlert('securityAlert', 'Password does not meet the requirements.', 'error');
                    return false;
                }
                if (!this.validatePasswordMatch()) {
                    this.showAlert('securityAlert', 'Passwords do not match.', 'error');
                    return false;
                }
                break;
            case 4:
                return true; // Review step
        }
        return true;
    }

    nextStep() {
        if (!this.validateCurrentStep()) {
            return;
        }

        // Store current step data
        this.storeStepData();

        if (this.currentStep < this.totalSteps) {
            this.currentStep++;
            this.updateStepDisplay();
            
            if (this.currentStep === 4) {
                this.updateReviewData();
            }
        }
    }

    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateStepDisplay();
        }
    }

    storeStepData() {
        switch (this.currentStep) {
            case 2:
                this.adminData.name = document.getElementById('adminName').value.trim();
                this.adminData.email = document.getElementById('adminEmail').value.trim();
                this.adminData.phone = document.getElementById('adminPhone').value.trim();
                break;
            case 3:
                this.adminData.password = document.getElementById('adminPassword').value;
                break;
        }
    }

    updateStepDisplay() {
        // Update step indicators
        for (let i = 1; i <= this.totalSteps; i++) {
            const stepElement = document.getElementById(`step${i}`);
            const formStepElement = document.getElementById(`formStep${i}`);
            
            if (i < this.currentStep) {
                stepElement.classList.remove('active');
                stepElement.classList.add('completed');
                stepElement.innerHTML = '<i class="fas fa-check"></i>';
            } else if (i === this.currentStep) {
                stepElement.classList.add('active');
                stepElement.classList.remove('completed');
                stepElement.textContent = i;
            } else {
                stepElement.classList.remove('active', 'completed');
                stepElement.textContent = i;
            }
            
            // Show/hide form steps
            if (i === this.currentStep) {
                formStepElement.classList.add('active');
            } else {
                formStepElement.classList.remove('active');
            }
        }
    }

    updateReviewData() {
        document.getElementById('reviewName').textContent = this.adminData.name;
        document.getElementById('reviewEmail').textContent = this.adminData.email;
        document.getElementById('reviewPhone').textContent = this.adminData.phone || 'Not provided';
    }

    async completeSetup() {
        this.setLoading(true, 'completeSetup');

        try {
            const setupData = {
                name: this.adminData.name,
                email: this.adminData.email,
                phone: this.adminData.phone,
                password: this.adminData.password,
                role: 'super_admin',
                permissions: [
                    'manage_gyms',
                    'manage_users',
                    'manage_subscriptions',
                    'manage_payments',
                    'manage_support',
                    'manage_trainers',
                    'view_analytics',
                    'system_settings',
                    'security_logs'
                ]
            };

            const response = await fetch(`${this.baseURL}/setup-admin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(setupData)
            });

            const result = await response.json();

            if (response.ok) {
                this.showSetupComplete();
            } else {
                this.showAlert('setupAlert', result.message || 'Setup failed. Please try again.', 'error');
            }

        } catch (error) {
            console.error('Setup error:', error);
            this.showAlert('setupAlert', 'Network error. Please check your connection and try again.', 'error');
        } finally {
            this.setLoading(false, 'completeSetup');
        }
    }

    showSetupComplete() {
        // Hide current step
        document.getElementById(`formStep${this.currentStep}`).classList.remove('active');
        
        // Show completion step
        document.getElementById('setupCompleteStep').classList.add('active');
        
        // Update final email
        document.getElementById('finalEmail').textContent = this.adminData.email;
        
        // Update all step indicators to completed
        for (let i = 1; i <= this.totalSteps; i++) {
            const stepElement = document.getElementById(`step${i}`);
            stepElement.classList.remove('active');
            stepElement.classList.add('completed');
            stepElement.innerHTML = '<i class="fas fa-check"></i>';
        }
    }

    redirectToLogin() {
        window.location.href = '/frontend/admin/admin-login.html';
    }

    showAlert(alertId, message, type = 'info') {
        const alert = document.getElementById(alertId);
        const alertText = alertId.replace('Alert', 'AlertText');
        const alertTextElement = document.getElementById(alertText);
        
        if (alert) {
            alert.className = `alert alert-${type}`;
            
            // Update icon based on type
            const icon = alert.querySelector('i');
            if (icon) {
                icon.className = type === 'error' ? 'fas fa-exclamation-circle' :
                                type === 'warning' ? 'fas fa-exclamation-triangle' :
                                type === 'success' ? 'fas fa-check-circle' :
                                'fas fa-info-circle';
            }
            
            // Update text
            const textElement = alertTextElement || alert.querySelector('span');
            if (textElement) {
                textElement.textContent = message;
            }
            
            alert.classList.remove('hidden');
            
            // Auto-hide success alerts
            if (type === 'success') {
                setTimeout(() => {
                    alert.classList.add('hidden');
                }, 5000);
            }
        }
    }

    hideAlert(alertId) {
        const alert = document.getElementById(alertId);
        if (alert) {
            alert.classList.add('hidden');
        }
    }

    setLoading(isLoading, context) {
        const btn = document.getElementById(`${context}Btn`);
        const btnText = document.getElementById(`${context}BtnText`);
        const spinner = document.getElementById(`${context}Spinner`);
        
        if (btn && btnText && spinner) {
            btn.disabled = isLoading;
            
            if (isLoading) {
                btnText.style.opacity = '0';
                spinner.classList.remove('hidden');
            } else {
                btnText.style.opacity = '1';
                spinner.classList.add('hidden');
            }
        }
    }
}

// Global functions for UI interactions
function togglePassword(inputId, iconId) {
    const passwordInput = document.getElementById(inputId);
    const toggleIcon = document.getElementById(iconId);
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.className = 'fas fa-eye-slash';
    } else {
        passwordInput.type = 'password';
        toggleIcon.className = 'fas fa-eye';
    }
}

function runSystemCheck() {
    adminSetup.runSystemCheck();
}

function nextStep() {
    adminSetup.nextStep();
}

function prevStep() {
    adminSetup.prevStep();
}

function completeSetup() {
    adminSetup.completeSetup();
}

function redirectToLogin() {
    adminSetup.redirectToLogin();
}

// Initialize setup system when DOM is loaded
let adminSetup;
document.addEventListener('DOMContentLoaded', () => {
    adminSetup = new AdminSetup();
});
