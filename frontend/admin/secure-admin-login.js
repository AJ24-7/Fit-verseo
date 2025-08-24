/**
 * Secure Admin Login System for Gym-Wale
 * Features: JWT Authentication, 2FA, Rate Limiting, Session Management, Security Logging
 */

class SecureAdminAuth {
    constructor() {
        this.baseURL = '/api/admin';
        this.maxLoginAttempts = 5;
        this.lockoutDuration = 300000; // 5 minutes
        this.sessionTimeout = 1800000; // 30 minutes
        this.twofaTimeout = 300000; // 5 minutes for 2FA
        this.loginAttempts = this.getLoginAttempts();
        this.deviceFingerprint = this.generateDeviceFingerprint();
        
        this.initializeEventListeners();
        this.checkExistingSession();
        this.startSecurityMonitoring();
    }

    initializeEventListeners() {
        // Form submissions
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('verifyTwofaBtn').addEventListener('click', () => this.verifyTwoFA());
        document.getElementById('resendTwofaCode').addEventListener('click', (e) => this.resendTwoFACode(e));
        
        // Password visibility toggle
        document.getElementById('passwordToggle').addEventListener('click', () => this.togglePasswordVisibility());
        
        // Forgot password
        document.getElementById('forgotPasswordLink').addEventListener('click', (e) => this.handleForgotPassword(e));
        
        // Real-time validation
        document.getElementById('email').addEventListener('input', () => this.validateEmail());
        document.getElementById('password').addEventListener('input', () => this.validatePassword());
        document.getElementById('twofaCode').addEventListener('input', () => this.validateTwoFACode());
        
        // Auto-format 2FA code
        document.getElementById('twofaCode').addEventListener('input', (e) => this.formatTwoFAInput(e));
        
        // Security monitoring
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
        window.addEventListener('beforeunload', () => this.handlePageUnload());
        
        // Rate limiting check
        this.checkRateLimit();
    }

    async handleLogin(event) {
        event.preventDefault();
        
        if (this.isRateLimited()) {
            this.showRateLimitWarning();
            return;
        }

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        // Client-side validation
        if (!this.validateForm(email, password)) {
            return;
        }

        this.setLoading(true);
        this.hideAllAlerts();

        try {
            const loginData = {
                email,
                password,
                deviceFingerprint: this.deviceFingerprint,
                rememberMe,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            };

            const response = await fetch(`${this.baseURL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Device-Fingerprint': this.deviceFingerprint,
                    'X-Request-ID': this.generateRequestId()
                },
                body: JSON.stringify(loginData)
            });

            const result = await response.json();

            if (response.ok) {
                this.handleLoginSuccess(result);
            } else {
                this.handleLoginError(result);
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showAlert('error', 'Connection error. Please check your internet connection and try again.');
            this.recordFailedAttempt();
        } finally {
            this.setLoading(false);
        }
    }

    handleLoginSuccess(result) {
        this.clearLoginAttempts();
        
        if (result.requiresTwoFA) {
            this.showTwoFASection(result.tempToken, result.email);
            this.showAlert('info', 'A verification code has been sent to your email address.');
        } else {
            this.completeLogin(result);
        }
    }

    handleLoginError(result) {
        this.recordFailedAttempt();
        
        const remainingAttempts = this.maxLoginAttempts - this.loginAttempts;
        
        if (this.isRateLimited()) {
            this.showRateLimitWarning();
        } else if (remainingAttempts > 0) {
            this.showAlert('error', `${result.message} ${remainingAttempts} attempts remaining.`);
        } else {
            this.showAlert('error', result.message);
        }

        // Security logging
        this.logSecurityEvent('failed_login', {
            email: document.getElementById('email').value,
            reason: result.message,
            attempts: this.loginAttempts
        });
    }

    async verifyTwoFA() {
        const code = document.getElementById('twofaCode').value.trim();
        const tempToken = localStorage.getItem('tempAuthToken');

        if (!code || code.length !== 6) {
            this.showAlert('error', 'Please enter a valid 6-digit verification code.');
            return;
        }

        if (!tempToken) {
            this.showAlert('error', 'Session expired. Please login again.');
            this.resetToLoginForm();
            return;
        }

        this.setLoading(true, 'verifyTwofaBtn');

        try {
            const response = await fetch(`${this.baseURL}/auth/verify-2fa`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${tempToken}`,
                    'X-Device-Fingerprint': this.deviceFingerprint
                },
                body: JSON.stringify({
                    code,
                    deviceFingerprint: this.deviceFingerprint
                })
            });

            const result = await response.json();

            if (response.ok) {
                localStorage.removeItem('tempAuthToken');
                this.completeLogin(result);
            } else {
                this.showAlert('error', result.message);
                
                if (result.attemptsRemaining === 0) {
                    this.showAlert('warning', 'Too many failed attempts. Please login again.');
                    setTimeout(() => this.resetToLoginForm(), 3000);
                }
            }
        } catch (error) {
            console.error('2FA verification error:', error);
            this.showAlert('error', 'Verification failed. Please try again.');
        } finally {
            this.setLoading(false, 'verifyTwofaBtn');
        }
    }

    completeLogin(result) {
        // Store authentication data securely
        localStorage.setItem('adminToken', result.token);
        localStorage.setItem('adminRefreshToken', result.refreshToken);
        localStorage.setItem('adminUser', JSON.stringify(result.admin));
        localStorage.setItem('loginTimestamp', new Date().toISOString());
        
        if (result.sessionTimeout) {
            localStorage.setItem('sessionTimeout', result.sessionTimeout.toString());
        }

        // Log successful login
        this.logSecurityEvent('successful_login', {
            adminId: result.admin.id,
            email: result.admin.email,
            deviceFingerprint: this.deviceFingerprint
        });

        this.showAlert('success', 'Login successful! Redirecting to dashboard...');
        
        // Redirect after brief delay
        setTimeout(() => {
            window.location.href = 'admin.html';
        }, 1500);
    }

    async resendTwoFACode(event) {
        event.preventDefault();
        const tempToken = localStorage.getItem('tempAuthToken');

        if (!tempToken) {
            this.showAlert('error', 'Session expired. Please login again.');
            this.resetToLoginForm();
            return;
        }

        try {
            const response = await fetch(`${this.baseURL}/auth/resend-2fa`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${tempToken}`,
                    'X-Device-Fingerprint': this.deviceFingerprint
                }
            });

            const result = await response.json();

            if (response.ok) {
                this.showAlert('success', 'New verification code sent to your email.');
            } else {
                this.showAlert('error', result.message);
            }
        } catch (error) {
            this.showAlert('error', 'Failed to resend code. Please try again.');
        }
    }

    async handleForgotPassword(event) {
        event.preventDefault();
        const email = document.getElementById('email').value.trim();

        if (!email) {
            this.showAlert('warning', 'Please enter your email address first.');
            document.getElementById('email').focus();
            return;
        }

        if (!this.isValidEmail(email)) {
            this.showAlert('error', 'Please enter a valid email address.');
            return;
        }

        try {
            const response = await fetch(`${this.baseURL}/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            const result = await response.json();
            
            if (response.ok) {
                this.showAlert('success', 'Password reset instructions have been sent to your email.');
            } else {
                this.showAlert('info', 'If this email is registered, you will receive reset instructions.');
            }
        } catch (error) {
            this.showAlert('error', 'Failed to process password reset. Please try again.');
        }
    }

    showTwoFASection(tempToken, email) {
        localStorage.setItem('tempAuthToken', tempToken);
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('twofaSection').style.display = 'block';
        document.getElementById('twofaCode').focus();

        // Start 2FA timeout countdown
        this.startTwoFATimeout();
    }

    resetToLoginForm() {
        localStorage.removeItem('tempAuthToken');
        document.getElementById('twofaSection').style.display = 'none';
        document.getElementById('loginForm').style.display = 'flex';
        document.getElementById('twofaCode').value = '';
        this.hideAllAlerts();
    }

    startTwoFATimeout() {
        let timeLeft = this.twofaTimeout / 1000; // Convert to seconds
        
        const timer = setInterval(() => {
            timeLeft--;
            
            if (timeLeft <= 0) {
                clearInterval(timer);
                this.showAlert('warning', '2FA session expired. Please login again.');
                setTimeout(() => this.resetToLoginForm(), 2000);
            }
        }, 1000);
    }

    validateForm(email, password) {
        let isValid = true;

        if (!email || !this.isValidEmail(email)) {
            this.showAlert('error', 'Please enter a valid email address.');
            isValid = false;
        }

        if (!password || password.length < 8) {
            this.showAlert('error', 'Password must be at least 8 characters long.');
            isValid = false;
        }

        return isValid;
    }

    validateEmail() {
        const email = document.getElementById('email').value;
        const isValid = this.isValidEmail(email);
        
        document.getElementById('email').style.borderColor = 
            isValid ? 'rgba(76, 175, 80, 0.5)' : 'rgba(244, 67, 54, 0.5)';
        
        return isValid;
    }

    validatePassword() {
        const password = document.getElementById('password').value;
        const isValid = password.length >= 8;
        
        document.getElementById('password').style.borderColor = 
            isValid ? 'rgba(76, 175, 80, 0.5)' : 'rgba(244, 67, 54, 0.5)';
        
        return isValid;
    }

    validateTwoFACode() {
        const code = document.getElementById('twofaCode').value;
        const isValid = /^\d{6}$/.test(code);
        
        document.getElementById('twofaCode').style.borderColor = 
            isValid ? 'rgba(76, 175, 80, 0.5)' : 'rgba(244, 67, 54, 0.5)';
        
        return isValid;
    }

    formatTwoFAInput(event) {
        let value = event.target.value.replace(/\D/g, ''); // Remove non-digits
        event.target.value = value;

        if (value.length === 6) {
            this.validateTwoFACode();
        }
    }

    togglePasswordVisibility() {
        const passwordInput = document.getElementById('password');
        const toggleIcon = document.getElementById('passwordToggle');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleIcon.classList.remove('fa-eye');
            toggleIcon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            toggleIcon.classList.remove('fa-eye-slash');
            toggleIcon.classList.add('fa-eye');
        }
    }

    setLoading(loading, buttonId = 'loginBtn') {
        const button = document.getElementById(buttonId);
        const textElement = button.querySelector('span:last-child');
        
        if (loading) {
            button.disabled = true;
            const originalText = textElement.textContent;
            textElement.setAttribute('data-original', originalText);
            textElement.innerHTML = '<div class="loading-spinner"></div>';
        } else {
            button.disabled = false;
            const originalText = textElement.getAttribute('data-original');
            if (originalText) {
                textElement.textContent = originalText;
                textElement.removeAttribute('data-original');
            }
        }
    }

    showAlert(type, message) {
        this.hideAllAlerts();
        
        const alertElement = document.getElementById(`${type}Alert`);
        const messageElement = document.getElementById(`${type}Message`);
        
        if (alertElement && messageElement) {
            messageElement.textContent = message;
            alertElement.classList.add('show');
            
            // Auto-hide after 5 seconds for non-error messages
            if (type !== 'error') {
                setTimeout(() => {
                    alertElement.classList.remove('show');
                }, 5000);
            }
        }
    }

    hideAllAlerts() {
        const alerts = document.querySelectorAll('.alert');
        alerts.forEach(alert => alert.classList.remove('show'));
    }

    // Rate Limiting
    recordFailedAttempt() {
        this.loginAttempts++;
        localStorage.setItem('loginAttempts', this.loginAttempts.toString());
        localStorage.setItem('lastFailedAttempt', new Date().toISOString());
    }

    clearLoginAttempts() {
        this.loginAttempts = 0;
        localStorage.removeItem('loginAttempts');
        localStorage.removeItem('lastFailedAttempt');
        this.hideRateLimitWarning();
    }

    getLoginAttempts() {
        const attempts = parseInt(localStorage.getItem('loginAttempts') || '0');
        const lastAttempt = localStorage.getItem('lastFailedAttempt');
        
        if (lastAttempt) {
            const timeSinceLastAttempt = Date.now() - new Date(lastAttempt).getTime();
            if (timeSinceLastAttempt > this.lockoutDuration) {
                this.clearLoginAttempts();
                return 0;
            }
        }
        
        return attempts;
    }

    isRateLimited() {
        return this.loginAttempts >= this.maxLoginAttempts;
    }

    checkRateLimit() {
        if (this.isRateLimited()) {
            this.showRateLimitWarning();
        }
    }

    showRateLimitWarning() {
        const lastAttempt = localStorage.getItem('lastFailedAttempt');
        if (!lastAttempt) return;

        const timeElapsed = Date.now() - new Date(lastAttempt).getTime();
        const timeRemaining = this.lockoutDuration - timeElapsed;

        if (timeRemaining > 0) {
            document.getElementById('rateLimitWarning').classList.add('show');
            this.startRateLimitTimer(timeRemaining);
            
            // Disable form
            document.getElementById('loginForm').style.opacity = '0.5';
            document.getElementById('loginForm').style.pointerEvents = 'none';
        }
    }

    hideRateLimitWarning() {
        document.getElementById('rateLimitWarning').classList.remove('show');
        document.getElementById('loginForm').style.opacity = '1';
        document.getElementById('loginForm').style.pointerEvents = 'auto';
    }

    startRateLimitTimer(duration) {
        let timeLeft = Math.ceil(duration / 1000);
        const timerElement = document.getElementById('rateLimitTimer');
        
        const timer = setInterval(() => {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            timeLeft--;
            
            if (timeLeft < 0) {
                clearInterval(timer);
                this.clearLoginAttempts();
            }
        }, 1000);
    }

    // Security Monitoring
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
        
        return btoa(fingerprint).substring(0, 32);
    }

    generateRequestId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    logSecurityEvent(event, details) {
        const logEntry = {
            event,
            details,
            timestamp: new Date().toISOString(),
            deviceFingerprint: this.deviceFingerprint,
            userAgent: navigator.userAgent,
            ip: 'client-side' // Will be logged on server side
        };
        
        // Store locally for audit trail
        const logs = JSON.parse(localStorage.getItem('securityLogs') || '[]');
        logs.push(logEntry);
        
        // Keep only last 50 logs
        if (logs.length > 50) {
            logs.splice(0, logs.length - 50);
        }
        
        localStorage.setItem('securityLogs', JSON.stringify(logs));
        
        // Send to server if possible
        this.sendSecurityLog(logEntry);
    }

    async sendSecurityLog(logEntry) {
        try {
            await fetch(`${this.baseURL}/auth/security-log`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(logEntry)
            });
        } catch (error) {
            console.debug('Security log not sent:', error);
        }
    }

    startSecurityMonitoring() {
        // Monitor for suspicious activity
        let keypressCount = 0;
        let lastActivity = Date.now();
        
        document.addEventListener('keypress', () => {
            keypressCount++;
            lastActivity = Date.now();
            
            // Reset counter every minute
            setTimeout(() => {
                keypressCount = Math.max(0, keypressCount - 1);
            }, 60000);
            
            // Detect potential bot activity
            if (keypressCount > 100) {
                this.logSecurityEvent('suspicious_activity', {
                    type: 'high_keypress_rate',
                    count: keypressCount
                });
            }
        });

        // Monitor tab visibility
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.logSecurityEvent('tab_hidden', { timestamp: Date.now() });
            } else {
                this.logSecurityEvent('tab_visible', { timestamp: Date.now() });
            }
        });
    }

    handleVisibilityChange() {
        if (document.hidden) {
            // Pause sensitive operations when tab is hidden
            this.pauseSensitiveOperations = true;
        } else {
            this.pauseSensitiveOperations = false;
        }
    }

    handlePageUnload() {
        // Clean up sensitive data
        localStorage.removeItem('tempAuthToken');
    }

    checkExistingSession() {
        const token = localStorage.getItem('adminToken');
        const loginTimestamp = localStorage.getItem('loginTimestamp');
        
        if (token && loginTimestamp) {
            const sessionAge = Date.now() - new Date(loginTimestamp).getTime();
            
            if (sessionAge < this.sessionTimeout) {
                // Valid session exists, redirect to dashboard
                window.location.href = 'admin.html';
            } else {
                // Session expired, clean up
                this.clearSession();
            }
        }
    }

    clearSession() {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminRefreshToken');
        localStorage.removeItem('adminUser');
        localStorage.removeItem('loginTimestamp');
        localStorage.removeItem('sessionTimeout');
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}

// Initialize the secure admin authentication system
document.addEventListener('DOMContentLoaded', () => {
    new SecureAdminAuth();
});

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    
    // Don't expose sensitive errors to user
    const safeMessage = 'An unexpected error occurred. Please refresh the page and try again.';
    document.getElementById('errorMessage').textContent = safeMessage;
    document.getElementById('errorAlert').classList.add('show');
});

// Prevent form submission on Enter in 2FA field
document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && e.target.id === 'twofaCode') {
        e.preventDefault();
        document.getElementById('verifyTwofaBtn').click();
    }
});
