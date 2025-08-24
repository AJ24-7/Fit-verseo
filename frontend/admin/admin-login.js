// Professional Admin Login System
// Simplified and secure authentication for Gym-Wale Admin Portal

class AdminLogin {
    constructor() {
        this.baseURL = 'http://localhost:5000/api/admin/auth';
        this.deviceFingerprint = this.generateDeviceFingerprint();
        this.initializeEventListeners();
        this.checkExistingSession();
    }

    initializeEventListeners() {
        // Login form submission
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Enter key support for 2FA
        const twoFactorCode = document.getElementById('twoFactorCode');
        if (twoFactorCode) {
            twoFactorCode.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.verify2FA();
                }
            });

            // Auto-format 2FA input
            twoFactorCode.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/\D/g, '');
            });
        }

        // Modal close on backdrop click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.hideAllModals();
            }
        });
    }

    generateDeviceFingerprint() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Device fingerprint', 2, 2);
        
        const fingerprint = [
            navigator.userAgent,
            navigator.language,
            screen.width + 'x' + screen.height,
            new Date().getTimezoneOffset(),
            canvas.toDataURL()
        ].join('|');
        
        return btoa(fingerprint).slice(0, 32);
    }

    async checkExistingSession() {
        // First check if any admin exists
        try {
            const adminExistsResponse = await fetch('http://localhost:5000/api/admin/check-admin-exists');
            const adminExistsResult = await adminExistsResponse.json();
            
            if (!adminExistsResult.adminExists) {
                window.location.href = 'admin-setup.html';
                return;
            }
        } catch (error) {
            console.log('Could not check admin existence');
        }

        const token = localStorage.getItem('adminToken');
        if (token) {
            try {
                const response = await fetch('http://localhost:5000/api/admin/profile', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    // Valid session exists, redirect to dashboard
                    window.location.href = '/frontend/admin/admin.html';
                }
            } catch (error) {
                // Token invalid, continue with login
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminInfo');
                localStorage.removeItem('loginTimestamp');
            }
        }
    }

    async handleLogin() {
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const trustDevice = document.getElementById('trustDevice').checked;

        if (!email || !password) {
            this.showAlert('loginAlert', 'Please enter both email and password', 'error');
            return;
        }

        this.setLoading(true);

        try {
            const response = await fetch(`${this.baseURL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password,
                    deviceFingerprint: this.deviceFingerprint,
                    trustDevice,
                    deviceInfo: {
                        userAgent: navigator.userAgent,
                        platform: navigator.platform,
                        language: navigator.language
                    }
                })
            });

            const result = await response.json();

            if (response.ok) {
                if (result.requiresTwoFactor) {
                    this.currentLoginData = result;
                    this.showTwoFactorModal();
                } else {
                    this.handleLoginSuccess(result);
                }
            } else {
                this.showAlert('loginAlert', result.message || 'Login failed', 'error');
                
                // Handle account lockout
                if (result.lockoutTime) {
                    const lockoutEnd = new Date(result.lockoutTime);
                    const lockoutMinutes = Math.ceil((lockoutEnd - new Date()) / 60000);
                    this.showAlert('loginAlert', `Account locked for ${lockoutMinutes} minutes due to too many failed attempts`, 'warning');
                }
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showAlert('loginAlert', 'Network error. Please check your connection and try again.', 'error');
        } finally {
            this.setLoading(false);
        }
    }

    async verify2FA() {
        const code = document.getElementById('twoFactorCode').value.trim();
        
        if (!code || code.length !== 6) {
            this.showAlert('twoFactorAlert', 'Please enter a valid 6-digit code', 'error');
            return;
        }

        this.setLoading(true, 'verify2FA');

        try {
            const response = await fetch(`${this.baseURL}/verify-2fa`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    tempToken: this.currentLoginData.tempToken,
                    code,
                    deviceFingerprint: this.deviceFingerprint
                })
            });

            const result = await response.json();

            if (response.ok) {
                this.handleLoginSuccess(result);
            } else {
                this.showAlert('twoFactorAlert', result.message || '2FA verification failed', 'error');
            }
        } catch (error) {
            console.error('2FA verification error:', error);
            this.showAlert('twoFactorAlert', 'Network error. Please try again.', 'error');
        } finally {
            this.setLoading(false, 'verify2FA');
        }
    }

    handleLoginSuccess(result) {
        // Store authentication data
        localStorage.setItem('adminToken', result.token);
        localStorage.setItem('adminInfo', JSON.stringify(result.admin));
        localStorage.setItem('loginTimestamp', new Date().toISOString());
        
        if (result.sessionTimeout) {
            localStorage.setItem('sessionTimeout', result.sessionTimeout);
        }

        this.showAlert('loginAlert', 'Login successful! Redirecting...', 'success');
        
        // Redirect to admin dashboard
        setTimeout(() => {
            window.location.href = 'admin.html';
        }, 1000);
    }

    async sendResetEmail() {
        const email = document.getElementById('resetEmail').value.trim();
        
        if (!email) {
            this.showAlert('resetAlert', 'Please enter your email address', 'error');
            return;
        }

        this.setLoading(true, 'reset');

        try {
            const response = await fetch(`${this.baseURL}/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email })
            });

            const result = await response.json();

            if (response.ok) {
                this.showAlert('resetAlert', 'Password reset link sent to your email', 'success');
                setTimeout(() => {
                    this.hideForgotPassword();
                }, 2000);
            } else {
                this.showAlert('resetAlert', result.message || 'Failed to send reset email', 'error');
            }
        } catch (error) {
            console.error('Password reset error:', error);
            this.showAlert('resetAlert', 'Network error. Please try again.', 'error');
        } finally {
            this.setLoading(false, 'reset');
        }
    }

    showTwoFactorModal() {
        document.getElementById('twoFactorModal').classList.remove('hidden');
        document.getElementById('twoFactorCode').focus();
        this.hideAlert('loginAlert');
    }

    showForgotPassword() {
        document.getElementById('forgotPasswordModal').classList.remove('hidden');
        document.getElementById('resetEmail').focus();
    }

    hideForgotPassword() {
        document.getElementById('forgotPasswordModal').classList.add('hidden');
        this.hideAlert('resetAlert');
        document.getElementById('resetEmail').value = '';
    }

    hideAllModals() {
        document.getElementById('twoFactorModal').classList.add('hidden');
        document.getElementById('forgotPasswordModal').classList.add('hidden');
        this.hideAlert('twoFactorAlert');
        this.hideAlert('resetAlert');
    }

    showAlert(alertId, message, type = 'error') {
        const alert = document.getElementById(alertId);
        const alertText = document.getElementById(alertId.replace('Alert', 'AlertText'));
        
        if (alert && alertText) {
            alert.className = `alert alert-${type}`;
            alertText.textContent = message;
            alert.classList.remove('hidden');
            
            // Auto-hide success alerts
            if (type === 'success') {
                setTimeout(() => {
                    this.hideAlert(alertId);
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

    setLoading(isLoading, context = 'login') {
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
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.getElementById('passwordToggleIcon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.className = 'fas fa-eye-slash';
    } else {
        passwordInput.type = 'password';
        toggleIcon.className = 'fas fa-eye';
    }
}

function showForgotPassword() {
    adminLogin.showForgotPassword();
}

function hideForgotPassword() {
    adminLogin.hideForgotPassword();
}

function verify2FA() {
    adminLogin.verify2FA();
}

function sendResetEmail() {
    adminLogin.sendResetEmail();
}

// Initialize login system when DOM is loaded
let adminLogin;
document.addEventListener('DOMContentLoaded', () => {
    adminLogin = new AdminLogin();
});

// Auto-fill default credentials for testing (remove in production)
document.addEventListener('DOMContentLoaded', () => {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    if (emailInput && !emailInput.value) {
        emailInput.value = 'admin@gym-wale.com';
    }
    if (passwordInput && !passwordInput.value) {
        passwordInput.value = 'SecureAdmin@2024';
    }
});
