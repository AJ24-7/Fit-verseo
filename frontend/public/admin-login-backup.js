document.addEventListener('DOMContentLoaded', function() {
    // Form elements
    const loginForm = document.getElementById('adminLoginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const emailError = document.getElementById('email-error');
        const data = await response.json();
        console.log('📦 Login response data:', { success: data.success, message: data.message, hasToken: !!data.token, gymId: data.gymId });

        if (response.ok && data.success) {
          // Check if 2FA is required
          if (data.requires2FA) {
            // Show 2FA modal
            show2FAModal(data.tempToken, loginPayload.email);
            return;
          }
          
          // Normal login success
          if (data.token && data.gymId) {
            // Successful login
            showAnimatedSuccess();
            console.log('🔑 About to store token:', data.token.substring(0, 20) + '...');
            console.log('🆔 About to store gymId:', data.gymId);
            console.log('🌐 Current origin:', window.location.origin);
            console.log('🌐 Current pathname:', window.location.pathname);ElementById('email-error');
    const passwordError = document.getElementById('password-error');
    const loginButton = document.getElementById('loginButton');
    const buttonText = document.getElementById('buttonText');
    const spinner = document.getElementById('spinner');
    
    // Forgot password elements
    const forgotPasswordLink = document.getElementById('forgotPassword');
    const forgotPasswordModal = document.getElementById('forgotPasswordModal');
    const closeModal = document.getElementById('closeModal');
    const resetEmailInput = document.getElementById('resetEmail');
    const resetEmailError = document.getElementById('reset-email-error');
    const resetSuccess = document.getElementById('reset-success');
    const resetButton = document.getElementById('resetButton');
    const submitNewPasswordButton = document.getElementById('submitNewPassword');
    const otpGroup = document.getElementById('otp-group');
    const newpassGroup = document.getElementById('newpass-group');
    const resetOtpInput = document.getElementById('resetOtp');
    const resetOtpError = document.getElementById('reset-otp-error');
    const resetNewPasswordInput = document.getElementById('resetNewPassword');
    const resetNewPassError = document.getElementById('reset-newpass-error');

    // Forgot Password Modal Logic
    if (forgotPasswordLink && forgotPasswordModal) {
      forgotPasswordLink.addEventListener('click', function(e) {
        e.preventDefault();
        forgotPasswordModal.classList.add('active');
      });
    }
    if (closeModal && forgotPasswordModal) {
      closeModal.addEventListener('click', function() {
        forgotPasswordModal.classList.remove('active');
      });
    }
    resetButton.addEventListener('click', async function() {
      // Validate email
      const email = resetEmailInput.value.trim();
      if (!email) {
        resetEmailError.textContent = "Please enter your email";
        resetEmailError.style.display = "block";
        return;
      }
      resetEmailError.style.display = "none";
      // Send OTP
      resetButton.disabled = true;
      resetButton.textContent = "Sending...";
      try {
        const res = await fetch('http://localhost:5000/api/gyms/request-password-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (data.success) {
          resetSuccess.textContent = "OTP sent to your email!";
          resetSuccess.style.display = "block";
          otpGroup.style.display = "block";
          newpassGroup.style.display = "block";
          resetButton.style.display = "none";
          submitNewPasswordButton.style.display = "block";
          // Hide email input group
          resetEmailInput.parentElement.style.display = "none";
          // Hide email instruction
          const emailInstruction = document.getElementById('email-instruction');
          if (emailInstruction) {
            emailInstruction.style.display = "none";
          }
          // Show OTP instruction with email
          const otpInstruction = document.getElementById('otp-instruction');
          if (otpInstruction) {
            otpInstruction.textContent = `Enter the OTP sent to ${email} `;
          }
        } else {
          resetEmailError.textContent = data.message || "Failed to send OTP";
          resetEmailError.style.display = "block";
        }
      } catch (err) {
        resetEmailError.textContent = "Network error";
        resetEmailError.style.display = "block";
        console.error('Error sending OTP:', err);
      }
      resetButton.disabled = false;
      resetButton.textContent = "Send OTP";
    });
    
    submitNewPasswordButton.addEventListener('click', async function() {
      // Validate all fields
      const email = resetEmailInput.value.trim();
      const otp = resetOtpInput.value.trim();
      const newPassword = resetNewPasswordInput.value.trim();
      resetOtpError.style.display = "none";
      resetNewPassError.style.display = "none";
      if (!otp) {
        resetOtpError.textContent = "Enter the OTP";
        resetOtpError.style.display = "block";
        return;
      }
      if (!newPassword || newPassword.length < 8) {
        resetNewPassError.textContent = "Password must be at least 8 characters";
        resetNewPassError.style.display = "block";
        return;
      }
      submitNewPasswordButton.disabled = true;
      submitNewPasswordButton.textContent = "Resetting...";
      try {
        const res = await fetch('http://localhost:5000/api/gyms/verify-password-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp, newPassword })
        });
        const data = await res.json();
        if (data.success) {
          resetSuccess.textContent = "Password changed successfully!";
          resetSuccess.style.display = "block";
          resetSuccess.classList.add('success-message');
          resetSuccess.classList.remove('error-message');
          // Close modal after short delay and reset fields
          setTimeout(() => {
            forgotPasswordModal.classList.remove('active');
            // Reset modal fields for next use
            resetEmailInput.value = '';
            resetOtpInput.value = '';
            resetNewPasswordInput.value = '';
            resetSuccess.textContent = '';
            resetEmailError.textContent = '';
            resetOtpError.textContent = '';
            resetNewPassError.textContent = '';
            resetEmailInput.parentElement.style.display = "block";
            // Show email instruction again
            const emailInstruction = document.getElementById('email-instruction');
            if (emailInstruction) {
              emailInstruction.style.display = "block";
            }
            otpGroup.style.display = "none";
            newpassGroup.style.display = "none";
            resetButton.style.display = "block";
            submitNewPasswordButton.style.display = "none";
            // Clear OTP instruction
            const otpInstruction = document.getElementById('otp-instruction');
            if (otpInstruction) {
              otpInstruction.textContent = '';
            }
          }, 1200);
          // Close modal before showing global message
          setTimeout(() => {
            forgotPasswordModal.classList.remove('active');
            // Reset modal fields for next use
            resetEmailInput.value = '';
            resetOtpInput.value = '';
            resetNewPasswordInput.value = '';
            resetSuccess.textContent = '';
            resetEmailError.textContent = '';
            resetOtpError.textContent = '';
            resetNewPassError.textContent = '';
            resetEmailInput.parentElement.style.display = "block";
            // Show email instruction again
            const emailInstruction = document.getElementById('email-instruction');
            if (emailInstruction) {
              emailInstruction.style.display = "block";
            }
            otpGroup.style.display = "none";
            newpassGroup.style.display = "none";
            resetButton.style.display = "block";
            submitNewPasswordButton.style.display = "none";
            // Clear OTP instruction
            const otpInstruction = document.getElementById('otp-instruction');
            if (otpInstruction) {
              otpInstruction.textContent = '';
            }
            // Now show persistent global success message
            const globalSuccess = document.getElementById('global-success-message');
            if(globalSuccess) {
              globalSuccess.textContent = 'Password changed successfully!';
              globalSuccess.style.display = 'block';
              globalSuccess.classList.add('success-message');
              setTimeout(() => {
                globalSuccess.style.display = 'none';
                globalSuccess.textContent = '';
                globalSuccess.classList.remove('success-message');
              }, 5000);
            }
          }, 1200);
        } else {
          resetOtpError.textContent = data.message || "Failed to reset password";
          resetOtpError.style.display = "block";
        }
      } catch (err) {
        resetOtpError.textContent = "Network error";
        resetOtpError.style.display = "block";
        console.error('Error resetting password:', err);
      }
      submitNewPasswordButton.disabled = false;
      submitNewPasswordButton.textContent = "Reset Password";
    });

    // Password visibility toggle (FontAwesome icon)
    const togglePassword = document.getElementById('togglePassword');
    const toggleIcon = document.getElementById('togglePasswordIcon');
    if (togglePassword && passwordInput && toggleIcon) {
      togglePassword.addEventListener('click', function() {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
        toggleIcon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
      });
      togglePassword.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          togglePassword.click();
        }
      });
    }
    
    // Form validation
    emailInput.addEventListener('input', validateEmail);
    passwordInput.addEventListener('input', validatePassword);
    
    function validateEmail() {
      const email = emailInput.value.trim();
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      
      if (!isValid && email.length > 0) {
        emailError.style.display = 'block';
        emailInput.style.borderColor = 'var(--error-color)';
        return false;
      } else {
        emailError.style.display = 'none';
        emailInput.style.borderColor = email.length > 0 ? 'var(--primary-color)' : '#e9ecef';
        return true;
      }
    }
    
    function validatePassword() {
      const password = passwordInput.value;
      const isValid = password.length >= 8;
      
      if (!isValid && password.length > 0) {
        passwordError.style.display = 'block';
        passwordInput.style.borderColor = 'var(--error-color)';
        return false;
      } else {
        passwordError.style.display = 'none';
        passwordInput.style.borderColor = password.length > 0 ? 'var(--primary-color)' : '#e9ecef';
        return true;
      }
    }
    
    // Form submission
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();

      // Clear any previous tokens to avoid stale state
      console.log('🧹 Clearing previous tokens');
      localStorage.removeItem('gymAdminToken');
      
      console.log('📊 Current localStorage state before login:', Object.keys(localStorage));

      const isEmailValid = validateEmail();
      const isPasswordValid = validatePassword();

      if (!isEmailValid || !isPasswordValid) {
        loginForm.classList.add('shake');
        setTimeout(() => loginForm.classList.remove('shake'), 500);
        return;
      }

      // Show loading state
      buttonText.style.display = 'none';
      spinner.style.display = 'block';
      loginButton.disabled = true;

      try {
        // Use JSON for login. Backend must use express.json() middleware.
        const formData = new FormData(loginForm);
        const loginPayload = Object.fromEntries(formData);
        
        console.log('🚀 Sending login request to backend');
        console.log('📧 Login email:', loginPayload.email);
        
        const response = await fetch('http://localhost:5000/api/gyms/login', {
          method: 'POST',
          body: JSON.stringify(loginPayload),
          headers: { 'Content-Type': 'application/json' }
        });

        console.log('📡 Login response received:', response.status, response.statusText);
        const data = await response.json();
        console.log('📦 Login response data:', { success: data.success, message: data.message, hasToken: !!data.token, gymId: data.gymId });

        if (response.ok && data.success) {
          // Check if 2FA is required
          if (data.requires2FA) {
            // Show 2FA modal
            show2FAModal(data.tempToken, loginPayload.email);
            return;
          }
          
          // Normal login success
          if (data.token && data.gymId) {
            // Successful login
            showAnimatedSuccess();
            console.log('🔑 About to store token:', data.token.substring(0, 20) + '...');
            console.log('🆔 About to store gymId:', data.gymId);
            console.log('🌐 Current origin:', window.location.origin);
            console.log('🌐 Current pathname:', window.location.pathname);
          // Store JWT token and gymId in localStorage with verification
          try {
            // Clear ALL potential old tokens and gymId first
            const oldTokenKeys = ['gymAdminToken', 'token', 'authToken', 'gymAuthToken', 'adminToken'];
            const oldGymKeys = ['gymId', 'currentGymId', 'gym_id'];
            
            oldTokenKeys.forEach(key => {
              if (localStorage.getItem(key)) {
                console.log(`🧹 Removing old token: ${key}`);
                localStorage.removeItem(key);
              }
            });
            
            oldGymKeys.forEach(key => {
              if (localStorage.getItem(key)) {
                console.log(`🧹 Removing old gymId: ${key}`);
                localStorage.removeItem(key);
              }
            });
            
            // Store the new token in BOTH localStorage and sessionStorage for redundancy
            localStorage.setItem('gymAdminToken', data.token);
            sessionStorage.setItem('gymAdminToken', data.token);
            
            // Store the gymId in multiple keys for compatibility
            localStorage.setItem('gymId', data.gymId);
            localStorage.setItem('currentGymId', data.gymId);
            sessionStorage.setItem('gymId', data.gymId);
            
            // Also store it with alternative keys as backup
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('token', data.token);
            
            // Verify token and gymId were actually stored
            const storedToken = localStorage.getItem('gymAdminToken');
            const sessionToken = sessionStorage.getItem('gymAdminToken');
            const storedGymId = localStorage.getItem('gymId');
            const sessionGymId = sessionStorage.getItem('gymId');
            
            console.log('🔍 Token and GymId verification:', {
              localStorage: !!storedToken,
              sessionStorage: !!sessionToken,
              tokenMatches: storedToken === data.token,
              sessionMatches: sessionToken === data.token,
              tokenLength: storedToken?.length || 0,
              gymId: storedGymId,
              sessionGymId: sessionGymId,
              gymIdMatches: storedGymId === data.gymId
            });
            
            if (storedToken === data.token && storedGymId === data.gymId) {
              console.log('✅ Token and GymId successfully stored in localStorage');
              console.log('📊 Final localStorage state:', Object.keys(localStorage).map(key => ({
                key, 
                value: key.includes('gymId') || key.includes('Id') ? localStorage.getItem(key) : localStorage.getItem(key)?.substring(0, 20) + '...',
                length: localStorage.getItem(key)?.length
              })));
              
              // Use a longer delay to ensure localStorage has fully committed
              setTimeout(() => {
                console.log('🚀 Redirecting to dashboard...');
                // Pass token and gymId as URL parameters as backup
                const dashboardUrl = `http://localhost:5000/gymadmin/gymadmin.html?token=${encodeURIComponent(data.token)}&gymId=${encodeURIComponent(data.gymId)}`;
                window.location.replace(dashboardUrl);
              }, 1000); // Increased to 1 second
            } else {
              throw new Error('Token or GymId verification failed');
            }
          } catch (storageError) {
            console.error('❌ localStorage error:', storageError);
            showErrorMessage('Failed to store authentication token. Please try again.');
          }
          }
        } else {
          // Login failed
          showErrorMessage(data.message || 'Login failed. Please try again.');
          loginForm.classList.add('shake');
          setTimeout(() => loginForm.classList.remove('shake'), 500);
        }
      } catch (error) {
        showErrorMessage('Network error. Please try again.');
        console.error('Login error:', error);
      } finally {
        // Reset button state
        buttonText.style.display = 'block';
        spinner.style.display = 'none';
        loginButton.disabled = false;
      }
    });
  
    // Error and success messages
    function showErrorMessage(message) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error-message';
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
      errorDiv.style.textAlign = 'center';
      errorDiv.style.marginTop = '15px';
      
      const existingError = loginForm.querySelector('.submit-error');
      if (existingError) {
        existingError.remove();
      }
      
      errorDiv.classList.add('submit-error');
      loginForm.appendChild(errorDiv);
    }
    
    function showAnimatedSuccess() {
      // Remove any previous success message
      const existingSuccess = loginForm.querySelector('.submit-success');
      if (existingSuccess) existingSuccess.remove();
      // Create animated success message
      const successDiv = document.createElement('div');
      successDiv.className = 'success-message submit-success';
      successDiv.style.display = 'flex';
      successDiv.style.flexDirection = 'column';
      successDiv.style.alignItems = 'center';
      successDiv.style.justifyContent = 'center';
      successDiv.style.gap = '10px';
      successDiv.style.textAlign = 'center';
      successDiv.style.marginTop = '15px';
      successDiv.innerHTML = `
        <div style="font-size:2.2rem;animation:bounceIn 0.7s;"><i class="fas fa-check-circle" style="color:#22c55e;"></i></div>
        <div style="font-size:1.2rem;font-weight:600;letter-spacing:0.5px;">Login Successful!</div>
        <div style="font-size:1rem;color:#1976d2;animation:fadeIn 1.2s;">Redirecting to dashboard...</div>
      `;
      // Add keyframes for bounceIn and fadeIn
      const style = document.createElement('style');
      style.innerHTML = `
        @keyframes bounceIn {
          0% { transform: scale(0.7); opacity: 0; }
          60% { transform: scale(1.15); opacity: 1; }
          80% { transform: scale(0.95); }
          100% { transform: scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `;
      document.head.appendChild(style);
      loginForm.appendChild(successDiv);
    }
    
    // 2FA Modal Functions
    function show2FAModal(tempToken, email) {
      // Create 2FA modal HTML
      const modal2FA = document.createElement('div');
      modal2FA.id = 'twoFAModal';
      modal2FA.className = 'forgot-password-modal active';
      modal2FA.innerHTML = `
        <div class="modal-content">
          <span class="close-modal" onclick="close2FAModal()">&times;</span>
          <h2>Two-Factor Authentication</h2>
          <p>Enter the 6-digit code from your authenticator app:</p>
          <div class="form-group">
            <input type="text" id="twoFACode" placeholder="000000" maxlength="6" 
                   style="text-align: center; font-size: 1.2em; letter-spacing: 0.5em;" />
            <div class="error-message" id="twoFA-error"></div>
          </div>
          <button type="button" id="verify2FAButton" class="login-btn">Verify</button>
        </div>
      `;
      
      document.body.appendChild(modal2FA);
      
      // Focus on input
      const codeInput = document.getElementById('twoFACode');
      codeInput.focus();
      
      // Add event listeners
      document.getElementById('verify2FAButton').addEventListener('click', () => verify2FA(tempToken, email));
      
      // Allow Enter key to submit
      codeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          verify2FA(tempToken, email);
        }
      });
    }
    
    async function verify2FA(tempToken, email) {
      const code = document.getElementById('twoFACode').value.trim();
      const errorDiv = document.getElementById('twoFA-error');
      const verifyButton = document.getElementById('verify2FAButton');
      
      if (!code || code.length !== 6) {
        errorDiv.textContent = 'Please enter a 6-digit code';
        errorDiv.style.display = 'block';
        return;
      }
      
      verifyButton.disabled = true;
      verifyButton.textContent = 'Verifying...';
      
      try {
        const response = await fetch('http://localhost:5000/api/gyms/security/verify-2fa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tempToken, code, email })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
          // Successful 2FA verification
          close2FAModal();
          
          // Store tokens and redirect
          localStorage.setItem('gymAdminToken', data.token);
          localStorage.setItem('gymId', data.gymId);
          sessionStorage.setItem('gymAdminToken', data.token);
          sessionStorage.setItem('gymId', data.gymId);
          
          showAnimatedSuccess();
          setTimeout(() => {
            const dashboardUrl = `http://localhost:5000/gymadmin/gymadmin.html?token=${encodeURIComponent(data.token)}&gymId=${encodeURIComponent(data.gymId)}`;
            window.location.replace(dashboardUrl);
          }, 1000);
        } else {
          errorDiv.textContent = data.message || 'Invalid code. Please try again.';
          errorDiv.style.display = 'block';
        }
      } catch (error) {
        errorDiv.textContent = 'Network error. Please try again.';
        errorDiv.style.display = 'block';
        console.error('2FA verification error:', error);
      } finally {
        verifyButton.disabled = false;
        verifyButton.textContent = 'Verify';
      }
    }
    
    function close2FAModal() {
      const modal = document.getElementById('twoFAModal');
      if (modal) {
        modal.remove();
      }
      // Reset login button state
      buttonText.style.display = 'block';
      spinner.style.display = 'none';
      loginButton.disabled = false;
    }
    
    // Make close2FAModal globally available
    window.close2FAModal = close2FAModal;
  });
