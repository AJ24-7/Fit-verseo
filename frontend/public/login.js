
document.addEventListener("DOMContentLoaded", () => {
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");
const errorMsg = document.getElementById("error-message");
const showLoginBtn = document.getElementById("show-login");
const showSignupBtn = document.getElementById("show-signup");
const toggleButtons = document.querySelector('.toggle-buttons');
const googleBtn = document.getElementById("google-signin-btn-login") || document.getElementById("google-signin-btn-signup");  
const API_BASE_URL = "http://localhost:5000/api/users"; // Update with your actual API base URL

 // Function to switch to login form
  function showLoginForm() {
    // Add/remove active class from buttons
    showLoginBtn.classList.add('active');
    showSignupBtn.classList.remove('active');
    
    // Show login form and hide signup form
    loginForm.classList.add('active');
    signupForm.classList.remove('active');
    
    // Hide any error messages
    errorMsg.style.display = 'none'; // Fixed variable name
  }

  // Function to switch to signup form
  function showSignupForm() {
    // Add/remove active class from buttons
    showSignupBtn.classList.add('active');
    showLoginBtn.classList.remove('active');
    
    // Show signup form and hide login form
    signupForm.classList.add('active');
    loginForm.classList.remove('active');
    
    // Hide any error messages
    errorMsg.style.display = 'none'; // Fixed variable name
  }

  // Add event listeners to toggle buttons
 showLoginBtn.addEventListener('click', function(e) {
  e.preventDefault();
  showLoginForm();
});
showSignupBtn.addEventListener('click', function(e) {
  e.preventDefault();
  showSignupForm();
});
  // Initialize the form states
  showLoginForm(); 
   // === Forgot Password Logic ===
  const forgotPasswordLink = document.getElementById('forgotPasswordLink');
  const requestOtpModal = document.getElementById('requestOtpModal');
  const resetPasswordModal = document.getElementById('resetPasswordModal');
  const closeRequestOtp = document.getElementById('closeRequestOtp');
  const closeResetPassword = document.getElementById('closeResetPassword');
  const requestOtpForm = document.getElementById('requestOtpForm');
  const otpEmailInput = document.getElementById('otpEmailInput');
  const requestOtpMessage = document.getElementById('requestOtpMessage');
  const resetPasswordForm = document.getElementById('resetPasswordForm');
  const otpCodeInput = document.getElementById('otpCodeInput');
  const newPasswordInput = document.getElementById('newPasswordInput');
  const confirmNewPasswordInput = document.getElementById('confirmNewPasswordInput');
  const resetPasswordMessage = document.getElementById('resetPasswordMessage');
  let forgotEmail = '';

  function openModal(modal) {
    modal.style.display = 'block';
  }
  function closeModal(modal) {
    modal.style.display = 'none';
  }

  if (forgotPasswordLink && requestOtpModal) {
    forgotPasswordLink.addEventListener('click', (e) => {
      e.preventDefault();
      openModal(requestOtpModal);
      requestOtpMessage.textContent = '';
      otpEmailInput.value = '';
    });
  }
  if (closeRequestOtp) {
    closeRequestOtp.addEventListener('click', () => closeModal(requestOtpModal));
  }
  if (closeResetPassword) {
    closeResetPassword.addEventListener('click', () => closeModal(resetPasswordModal));
  }
  window.addEventListener('click', (e) => {
    if (e.target === requestOtpModal) closeModal(requestOtpModal);
    if (e.target === resetPasswordModal) closeModal(resetPasswordModal);
  });

  if (requestOtpForm) {
    requestOtpForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = otpEmailInput.value.trim();
      if (!email) {
        requestOtpMessage.textContent = 'Please enter your email.';
        requestOtpMessage.style.color = 'red';
        return;
      }
      requestOtpMessage.textContent = 'Sending OTP...';
      requestOtpMessage.style.color = '#333';
      try {
        const res = await fetch(`${API_BASE_URL}/request-password-reset-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (data.success) {
          requestOtpMessage.textContent = 'OTP sent! Check your email.';
          requestOtpMessage.style.color = 'green';
          forgotEmail = email;
          setTimeout(() => {
            closeModal(requestOtpModal);
            openModal(resetPasswordModal);
            resetPasswordMessage.textContent = '';
            otpCodeInput.value = '';
            newPasswordInput.value = '';
            confirmNewPasswordInput.value = '';
          }, 1200);
        } else {
          requestOtpMessage.textContent = data.message || 'Failed to send OTP.';
          requestOtpMessage.style.color = 'red';
        }
      } catch (err) {
        requestOtpMessage.textContent = 'Server error. Try again.';
        requestOtpMessage.style.color = 'red';
      }
    });
  }

  if (resetPasswordForm) {
    resetPasswordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const otp = otpCodeInput.value.trim();
      const newPassword = newPasswordInput.value.trim();
      const confirmNewPassword = confirmNewPasswordInput.value.trim();
      if (!otp || !newPassword || !confirmNewPassword) {
        resetPasswordMessage.textContent = 'All fields are required.';
        resetPasswordMessage.style.color = 'red';
        return;
      }
      if (newPassword !== confirmNewPassword) {
        resetPasswordMessage.textContent = 'Passwords do not match.';
        resetPasswordMessage.style.color = 'red';
        return;
      }
      resetPasswordMessage.textContent = 'Resetting password...';
      resetPasswordMessage.style.color = '#333';
      try {
        const res = await fetch(`${API_BASE_URL}/verify-password-reset-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: forgotEmail, otp, newPassword })
        });
        const data = await res.json();
        if (data.success) {
          resetPasswordMessage.textContent = 'Password reset successful! You can now login.';
          resetPasswordMessage.style.color = 'green';
          setTimeout(() => {
            closeModal(resetPasswordModal);
          }, 1500);
        } else {
          resetPasswordMessage.textContent = data.message || 'Failed to reset password.';
          resetPasswordMessage.style.color = 'red';
        }
      } catch (err) {
        resetPasswordMessage.textContent = 'Server error. Try again.';
        resetPasswordMessage.style.color = 'red';
      }
    });
  }

  // Enhanced Login Handler with Animations
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value.trim();
    const submitBtn = loginForm.querySelector('button[type="submit"]');

    if (!email || !password) {
      return showError("Please fill in both email and password.");
    }

    // Add loading animation
    submitBtn.disabled = true;
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';

    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // Success animation
        submitBtn.innerHTML = '<i class="fas fa-check"></i> Success!';
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", data.user.name);
        
        // Delay redirect to show success state
        setTimeout(() => {
          window.location.href = "./userprofile.html";
        }, 1000);
      } else {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        showError(data.message || "Login failed.");
      }
    } catch (err) {
      console.error("Login error:", err);
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
      showError("⚠️ Network error. Make sure the server is running.");
    }
  });

  // 📝 Enhanced Signup Handler with Animations
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("signup-email").value.trim();
    const phone = document.getElementById("signup-phone").value.trim();
    const password = document.getElementById("signup-password").value.trim();
    const submitBtn = signupForm.querySelector('button[type="submit"]');

    if (!username || !email || !phone || !password) {
      return showError("Please fill in all signup fields.");
    }

    // Add loading animation
    submitBtn.disabled = true;
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';

    try {
      const res = await fetch(`${API_BASE_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, phone, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // Success animation
        submitBtn.innerHTML = '<i class="fas fa-check"></i> Account created!';
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", data.user.name);
        
        // Delay redirect to show success state
        setTimeout(() => {
          window.location.href = "./userprofile.html";
        }, 1000);
      } else {
        console.log("Signup Error:", data);
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        showError(data.message || "Signup failed.");
      }
    } catch (error) {
      console.error("Signup error:", error);
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
      showError("⚠️ Network error. Make sure the server is running.");
    }
  });

  // Google login button effect (if button exists)
  if (googleBtn) {
    googleBtn.addEventListener('click', function(e) {
      e.preventDefault();
      const originalText = this.innerHTML;
      this.innerHTML = '<i class="fab fa-google"></i> Redirecting...';
      
      // Simulate Google auth process (replace with actual implementation)
      setTimeout(() => {
        alert('Google authentication would be implemented here');
        this.innerHTML = originalText;
      }, 1500);
    });
  }
  const GOOGLE_CLIENT_ID = "905615420032-7lun3p0t94s3f9sah5a3v5tbhgm4r485.apps.googleusercontent.com"; // Replace with your actual client ID

function renderGoogleButton(targetId) {
  if (window.google && window.google.accounts && window.google.accounts.id) {
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredentialResponse
    });
    google.accounts.id.renderButton(
      document.getElementById(targetId),
      { theme: "outline", size: "large", width: "100%",  }
    );
  } else {
    setTimeout(() => renderGoogleButton(targetId), 100);
  }
}
renderGoogleButton("google-signin-btn-login");
renderGoogleButton("google-signin-btn-signup");
async function handleGoogleCredentialResponse(response) {
  // Send the ID token to your backend for verification and login/signup
  try {
    const res = await fetch("http://localhost:5000/api/users/google-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential: response.credential })
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("username", data.user.name || data.user.username);
       localStorage.setItem("profileImage", data.user.profileImage || "");
      window.location.href = "./userprofile.html";
    } else {
      alert(data.message || "Google authentication failed.");
    }
  } catch (err) {
    alert("Network error during Google authentication.");
  }
}
});