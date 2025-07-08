document.addEventListener('DOMContentLoaded', function() {
    // Form elements
    const loginForm = document.getElementById('adminLoginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const emailError = document.getElementById('email-error');
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
    // Password visibility toggle
    const togglePassword = document.getElementById('togglePassword');
    let passwordVisible = false;
    
    // Toggle password visibility
    togglePassword.addEventListener('click', function() {
      passwordVisible = !passwordVisible;
      passwordInput.type = passwordVisible ? 'text' : 'password';
      togglePassword.textContent = passwordVisible ? '🙈' : '👁️';
    });
    
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
        const formData = new FormData(loginForm);
        const response = await fetch('http://localhost:5000/api/gyms/login', { 
          method: 'POST',
          body: JSON.stringify(Object.fromEntries(formData)),
          headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await response.json();
        
        if (response.ok) {
          // Successful login
          showSuccessMessage('Login successful! Redirecting...');
          // Store JWT token in localStorage or cookies
          localStorage.setItem('gymAdminToken', data.token);
          // Ensure token is set before redirecting
          let tries = 0;
          function redirectIfTokenSet() {
            if (localStorage.getItem('gymAdminToken')) {
              window.location.replace('http://localhost:5000/gymadmin/gymadmin.html');
            } else if (tries < 10) {
              tries++;
              setTimeout(redirectIfTokenSet, 100);
            } else {
              showErrorMessage('Login failed to set token. Please try again.');
            }
          }
          setTimeout(redirectIfTokenSet, 200); // Short delay to ensure storage
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
    
    function showSuccessMessage(message) {
      const successDiv = document.createElement('div');
      successDiv.className = 'success-message';
      successDiv.textContent = message;
      successDiv.style.display = 'block';
      successDiv.style.textAlign = 'center';
      successDiv.style.marginTop = '15px';
      
      const existingSuccess = loginForm.querySelector('.submit-success');
      if (existingSuccess) {
        existingSuccess.remove();
      }
      
      successDiv.classList.add('submit-success');
      loginForm.appendChild(successDiv);
    }
  });
