document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Admin login script loaded successfully');
    
    // Form elements
    const loginForm = document.getElementById('adminLoginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const emailError = document.getElementById('email-error');
    const passwordError = document.getElementById('password-error');
    const loginButton = document.getElementById('loginButton');
    const buttonText = document.getElementById('buttonText');
    const spinner = document.getElementById('spinner');
    
    console.log('🔍 Form elements found:', {
        loginForm: !!loginForm,
        emailInput: !!emailInput,
        passwordInput: !!passwordInput,
        loginButton: !!loginButton
    });
    
    if (!loginForm) {
        console.error('❌ Login form not found! Cannot attach event listener.');
        return;
    }
    
    console.log('✅ Attaching form submit event listener...');
    
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
        const res = await fetch('http://localhost:5000/api/gyms/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (data.success) {
          resetSuccess.textContent = `OTP sent to ${email}`;
          resetSuccess.style.display = "block";
          resetSuccess.classList.add('success-message');
          resetSuccess.classList.remove('error-message');
          // Hide email input, show OTP input
          resetEmailInput.parentElement.style.display = "none";
          otpGroup.style.display = "block";
          resetButton.style.display = "none";
          submitNewPasswordButton.style.display = "block";
          submitNewPasswordButton.textContent = "Verify OTP";
          // Update instructions
          const otpInstruction = document.getElementById('otp-instruction');
          if (otpInstruction) {
            otpInstruction.textContent = `We've sent a 6-digit verification code to ${email}. Please enter it below:`;
          }
        } else {
          resetEmailError.textContent = data.message || "Failed to send OTP";
          resetEmailError.style.display = "block";
        }
      } catch (error) {
        resetEmailError.textContent = "Network error. Please try again.";
        resetEmailError.style.display = "block";
      } finally {
        resetButton.disabled = false;
        resetButton.textContent = "Send OTP";
      }
    });
    
    submitNewPasswordButton.addEventListener('click', async function() {
      const email = resetEmailInput.value.trim();
      const otp = resetOtpInput.value.trim();
      const newPassword = resetNewPasswordInput.value.trim();
      // First check if we're in OTP verification phase
      if (newpassGroup.style.display === "none") {
        // OTP verification phase
        if (!otp || otp.length !== 6) {
          resetOtpError.textContent = "Please enter a valid 6-digit OTP";
          resetOtpError.style.display = "block";
          return;
        }
        submitNewPasswordButton.disabled = true;
        submitNewPasswordButton.textContent = "Verifying...";
        try {
          const res = await fetch('http://localhost:5000/api/gyms/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp })
          });
          const data = await res.json();
          if (data.success) {
            resetOtpError.style.display = "none";
            newpassGroup.style.display = "block";
            submitNewPasswordButton.textContent = "Reset Password";
            // Update instructions
            const otpInstruction = document.getElementById('otp-instruction');
            if (otpInstruction) {
              otpInstruction.textContent = "OTP verified! Now enter your new password:";
            }
          } else {
            resetOtpError.textContent = data.message || "Invalid OTP";
            resetOtpError.style.display = "block";
          }
        } catch (error) {
          resetOtpError.textContent = "Network error. Please try again.";
          resetOtpError.style.display = "block";
        } finally {
          submitNewPasswordButton.disabled = false;
          if (newpassGroup.style.display === "none") {
            submitNewPasswordButton.textContent = "Verify OTP";
          }
        }
        return;
      }
      // Password reset phase
      resetOtpError.style.display = "none";
      resetNewPassError.style.display = "none";
      if (!otp || otp.length !== 6) {
        resetOtpError.textContent = "Please enter a valid 6-digit OTP";
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
            const globalSuccess = document.getElementById('global-success-message');
            if (globalSuccess) {
              globalSuccess.textContent = "Password reset successful! You can now log in with your new password.";
              globalSuccess.style.display = "block";
              globalSuccess.style.color = "#28a745";
              globalSuccess.style.fontWeight = "600";
              globalSuccess.style.marginTop = "20px";
              globalSuccess.style.padding = "12px";
              globalSuccess.style.borderRadius = "8px";
              globalSuccess.style.backgroundColor = "#d4edda";
              globalSuccess.style.border = "1px solid #c3e6cb";
              setTimeout(() => {
                globalSuccess.style.display = "none";
              }, 5000);
            }
          }, 1500);
        } else {
          resetNewPassError.textContent = data.message || "Failed to reset password";
          resetNewPassError.style.display = "block";
        }
      } catch (error) {
        resetNewPassError.textContent = "Network error. Please try again.";
        resetNewPassError.style.display = "block";
      } finally {
        submitNewPasswordButton.disabled = false;
        submitNewPasswordButton.textContent = "Reset Password";
      }
    });

    // Password toggle functionality
    const togglePassword = document.getElementById('togglePassword');
    const togglePasswordIcon = document.getElementById('togglePasswordIcon');
    if (togglePassword && passwordInput && togglePasswordIcon) {
      togglePassword.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        togglePasswordIcon.classList.toggle('fa-eye');
        togglePasswordIcon.classList.toggle('fa-eye-slash');
      });
      togglePassword.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          togglePassword.click();
        }
      });
    }

    // Form validation functions
    function validateEmail() {
      const emailValue = emailInput.value.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      if (!emailValue) {
        emailError.textContent = 'Email is required';
        emailError.style.display = 'block';
        return false;
      } else if (!emailRegex.test(emailValue)) {
        emailError.textContent = 'Please enter a valid email address';
        emailError.style.display = 'block';
        return false;
      } else {
        emailError.style.display = 'none';
        return true;
      }
    }

    function validatePassword() {
      const passwordValue = passwordInput.value;
      
      if (!passwordValue) {
        passwordError.textContent = 'Password is required';
        passwordError.style.display = 'block';
        return false;
      } else if (passwordValue.length < 8) {
        passwordError.textContent = 'Password must be at least 8 characters';
        passwordError.style.display = 'block';
        return false;
      } else {
        passwordError.style.display = 'none';
        return true;
      }
    }
    
    // Login function
    async function handleLogin(e) {
      if (e) {
        console.log('🎯 Login event triggered from:', e.type);
        e.preventDefault();
      }
      console.log('✋ Login process started');

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
    }
    
    // Attach event listeners
    loginForm.addEventListener('submit', handleLogin);
    loginButton.addEventListener('click', handleLogin);
  
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
      
      setTimeout(() => {
        if (errorDiv.parentNode) {
          errorDiv.remove();
        }
      }, 5000);
    }

    function showAnimatedSuccess() {
      // Create animated success checkmark
      const successDiv = document.createElement('div');
      successDiv.innerHTML = `
        <div class="success-checkmark" style="text-align: center; margin: 20px 0;">
          <div class="check-icon">
            <span class="icon-line line-tip"></span>
            <span class="icon-line line-long"></span>
            <div class="icon-circle"></div>
            <div class="icon-fix"></div>
          </div>
        </div>
      `;
      
      // Add CSS for the checkmark animation
      const style = document.createElement('style');
      style.textContent = `
        .success-checkmark {
          width: 80px;
          height: 115px;
          margin: 0 auto;
        }
        
        .success-checkmark .check-icon {
          width: 80px;
          height: 80px;
          position: relative;
          border-radius: 50%;
          box-sizing: content-box;
          border: 4px solid #4CAF50;
        }
        
        .success-checkmark .check-icon::before {
          top: 3px;
          left: -2px;
          width: 30px;
          transform-origin: 100% 50%;
          border-radius: 100px 0 0 100px;
        }
        
        .success-checkmark .check-icon::after {
          top: 0;
          left: 30px;
          width: 60px;
          transform-origin: 0 50%;
          border-radius: 0 100px 100px 0;
          animation: rotate-circle 4.25s ease-in;
        }
        
        .success-checkmark .check-icon::before, .success-checkmark .check-icon::after {
          content: '';
          height: 100px;
          position: absolute;
          background: #FFFFFF;
          transform: rotate(-45deg);
        }
        
        .success-checkmark .check-icon .icon-line {
          height: 5px;
          background-color: #4CAF50;
          display: block;
          border-radius: 2px;
          position: absolute;
          z-index: 10;
        }
        
        .success-checkmark .check-icon .icon-line.line-tip {
          top: 46px;
          left: 14px;
          width: 25px;
          transform: rotate(45deg);
          animation: icon-line-tip 0.75s;
        }
        
        .success-checkmark .check-icon .icon-line.line-long {
          top: 38px;
          right: 8px;
          width: 47px;
          transform: rotate(-45deg);
          animation: icon-line-long 0.75s;
        }
        
        .success-checkmark .check-icon .icon-circle {
          top: -4px;
          left: -4px;
          z-index: 10;
          width: 80px;
          height: 80px;
          border-radius: 50%;
          position: absolute;
          box-sizing: content-box;
          border: 4px solid rgba(76, 175, 80, .5);
        }
        
        .success-checkmark .check-icon .icon-fix {
          top: 8px;
          width: 5px;
          left: 26px;
          z-index: 1;
          height: 85px;
          position: absolute;
          transform: rotate(-45deg);
          background-color: #FFFFFF;
        }
        
        @keyframes rotate-circle {
          0% {
            transform: rotate(-45deg);
          }
          5% {
            transform: rotate(-45deg);
          }
          12% {
            transform: rotate(-405deg);
          }
          100% {
            transform: rotate(-405deg);
          }
        }
        
        @keyframes icon-line-tip {
          0% {
            width: 0;
            left: 1px;
            top: 19px;
          }
          54% {
            width: 0;
            left: 1px;
            top: 19px;
          }
          70% {
            width: 50px;
            left: -8px;
            top: 37px;
          }
          84% {
            width: 17px;
            left: 21px;
            top: 48px;
          }
          100% {
            width: 25px;
            left: 14px;
            top: 45px;
          }
        }
        
        @keyframes icon-line-long {
          0% {
            width: 0;
            right: 46px;
            top: 54px;
          }
          65% {
            width: 0;
            right: 46px;
            top: 54px;
          }
          84% {
            width: 55px;
            right: 0px;
            top: 35px;
          }
          100% {
            width: 47px;
            right: 8px;
            top: 38px;
          }
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
          <h2><i class="fas fa-shield-alt"></i> Two-Factor Authentication</h2>
          <p style="margin-bottom: 20px; color: #666;">Enter the 6-digit code from your authenticator app:</p>
          <div class="form-group">
            <input type="text" id="twoFACode" placeholder="000000" maxlength="6" 
                   style="text-align: center; font-size: 1.4em; letter-spacing: 0.5em; width: 100%; padding: 15px; border: 2px solid #ddd; border-radius: 8px;" />
            <div class="error-message" id="twoFA-error" style="margin-top: 10px;"></div>
          </div>
          <button type="button" id="verify2FAButton" class="login-btn" style="width: 100%; margin-top: 15px;">
            <i class="fas fa-check-circle"></i> Verify Code
          </button>
        </div>
      `;
      
      document.body.appendChild(modal2FA);
      
      // Focus on input
      const codeInput = document.getElementById('twoFACode');
      setTimeout(() => codeInput.focus(), 100);
      
      // Add event listeners
      document.getElementById('verify2FAButton').addEventListener('click', () => verify2FA(tempToken, email));
      
      // Allow Enter key to submit
      codeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          verify2FA(tempToken, email);
        }
      });
      
      // Auto-format input (add spaces for readability)
      codeInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
        if (value.length > 6) value = value.slice(0, 6);
        e.target.value = value;
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
      verifyButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
      
      try {
        const response = await fetch('http://localhost:5000/api/gyms/security/verify-2fa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tempToken, code, email })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
          // Successful 2FA verification
          verifyButton.innerHTML = '<i class="fas fa-check"></i> Verified!';
          verifyButton.style.backgroundColor = '#28a745';
          
          setTimeout(() => {
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
          }, 500);
        } else {
          errorDiv.textContent = data.message || 'Invalid code. Please try again.';
          errorDiv.style.display = 'block';
          verifyButton.innerHTML = '<i class="fas fa-check-circle"></i> Verify Code';
          verifyButton.disabled = false;
        }
      } catch (error) {
        errorDiv.textContent = 'Network error. Please try again.';
        errorDiv.style.display = 'block';
        console.error('2FA verification error:', error);
        verifyButton.innerHTML = '<i class="fas fa-check-circle"></i> Verify Code';
        verifyButton.disabled = false;
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
