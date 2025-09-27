(function(){
  // Dynamically resolve API base: if page is served from file:// or static 5500, point to likely backend (5000)
  const apiBase = (function(){
    const loc = window.location;
    // If running via Live Server on 5500, assume backend on 5000 same host
    if (loc.port === '5500') return `${loc.protocol}//${loc.hostname}:5000`;
    return '';
  })();
  const form = document.getElementById('trainerLoginForm');
  const statusArea = document.getElementById('statusArea');
  const loginBtn = document.getElementById('loginBtn');
  const goDashboardBtn = document.getElementById('goDashboardBtn');
  const toggleEmail = document.getElementById('toggleEmail');
  const togglePhone = document.getElementById('togglePhone');
  const emailField = document.getElementById('emailField');
  const phoneField = document.getElementById('phoneField');
  const yearSpan = document.getElementById('year');
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();

  function setMode(mode){
    if(mode==='email') { emailField.style.display='block'; phoneField.style.display='none'; toggleEmail.classList.add('active'); togglePhone.classList.remove('active'); }
    else { phoneField.style.display='block'; emailField.style.display='none'; togglePhone.classList.add('active'); toggleEmail.classList.remove('active'); }
  }
  toggleEmail.addEventListener('click',()=>setMode('email'));
  togglePhone.addEventListener('click',()=>setMode('phone'));

  function showStatus(msg,type){
    statusArea.textContent = msg;
    statusArea.className = 'status ' + (type||'');
  }

  function saveToken(token){
    localStorage.setItem('trainer_token', token);
  }

  function redirectDashboard(){
    // Dashboard moved under Trainer/ folder
    window.location.href = 'Trainer/trainer-dashboard.html';
  }

  if (localStorage.getItem('trainer_token')) {
    goDashboardBtn.style.display='block';
    goDashboardBtn.addEventListener('click', redirectDashboard);
  }

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    showStatus('Authenticating...');
    loginBtn.disabled = true;
    try {
      const email = document.getElementById('email').value.trim();
      const phone = document.getElementById('phone').value.trim();
      const password = document.getElementById('password').value;
      const body = { password };
      if (emailField.style.display !== 'none') body.email = email;
      else body.phone = phone;
      const res = await fetch(`${apiBase}/api/trainers/login`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(body)
      });
      const data = await safeJson(res);
      if (!res.ok || !data.success) {
        if (data && data.code === 'TRAINER_NOT_APPROVED') {
          const extended = data.detail ? `${data.message} (${data.detail})` : data.message;
          throw new Error(extended || 'Approval pending');
        }
        throw new Error(data.message || 'Login failed');
      }
      saveToken(data.token);
      showStatus('Login successful. Redirecting...', 'success');
      setTimeout(redirectDashboard, 800);
    } catch(err){
      console.error(err);
      showStatus(err.message || 'Error during login', 'error');
      loginBtn.disabled = false;
    }
  });

  /* ------------------ Forgot Password / OTP Flow ------------------ */
  const forgotTrigger = document.getElementById('forgotPasswordTrigger');
  const modal = document.getElementById('forgotPasswordModal');
  const closeModalBtn = document.getElementById('closeForgotModal');
  const fpIdentifier = document.getElementById('fpIdentifier');
  const fpSendBtn = document.getElementById('fpSendBtn');
  const fpVerifyBtn = document.getElementById('fpVerifyBtn');
  const fpResendBtn = document.getElementById('fpResendBtn');
  const fpResetBtn = document.getElementById('fpResetBtn');
  const fpOTPInput = document.getElementById('fpOTP');
  const fpNewPassword = document.getElementById('fpNewPassword');
  const fpStatus = document.getElementById('fpStatus');
  const stepSend = document.getElementById('fpStepSend');
  const stepVerify = document.getElementById('fpStepVerify');
  const stepReset = document.getElementById('fpStepReset');
  const backToLoginBtn = document.getElementById('fpBackToLogin');

  let resetToken = null; // JWT returned after OTP verify
  let currentIdentifier = null; // email or phone used

  function openModal(){ modal.style.display='flex'; fpStatus.textContent=''; fpStatus.className=''; document.body.style.overflow='hidden'; fpIdentifier.focus(); }
  function closeModal(){ modal.style.display='none'; document.body.style.overflow='auto'; resetForgotFlow(); }
  function showFpStatus(msg,type){ fpStatus.textContent = msg; fpStatus.style.color = type==='error'? 'var(--danger,#d9534f)' : type==='success'? 'var(--success,#1b7f3b)' : 'var(--text-secondary,#555)'; }
  function switchStep(step){
    stepSend.style.display = step==='send'? 'block':'none';
    stepVerify.style.display = step==='verify'? 'block':'none';
    stepReset.style.display = step==='reset'? 'block':'none';
    backToLoginBtn.style.display = step==='reset'? 'inline-block':'none';
  }
  function resetForgotFlow(){
    resetToken = null; currentIdentifier=null; fpIdentifier.value=''; fpOTPInput.value=''; fpNewPassword.value=''; switchStep('send');
  }

  async function safeJson(res){
    // Defensive JSON parsing to prevent unexpected end of JSON errors
    let text;
    try { text = await res.text(); } catch(e){ return {}; }
    if(!text) return {};
    try { return JSON.parse(text); } catch(e){
      console.warn('Malformed JSON response', e, text);
      return { success:false, message:'Malformed server response' };
    }
  }

  forgotTrigger?.addEventListener('click', openModal);
  closeModalBtn?.addEventListener('click', closeModal);
  modal?.addEventListener('click', (e)=>{ if(e.target===modal) closeModal(); });

  fpSendBtn?.addEventListener('click', async ()=>{
    const identifier = fpIdentifier.value.trim();
    if(!identifier){ showFpStatus('Enter email or phone first','error'); return; }
    showFpStatus('Sending OTP...');
    fpSendBtn.disabled = true;
    try {
      const payload = identifier.includes('@') ? { email: identifier } : { phone: identifier };
  const res = await fetch(`${apiBase}/api/trainers/forgot-password`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)});
      const data = await safeJson(res);
      if(!res.ok || !data.success) throw new Error(data.message||'Failed to send OTP');
      currentIdentifier = identifier; switchStep('verify'); showFpStatus('OTP sent. Check your email/SMS.','success'); fpOTPInput.focus();
    } catch(err){ showFpStatus(err.message,'error'); }
    finally { fpSendBtn.disabled=false; }
  });

  fpResendBtn?.addEventListener('click', ()=>{
    if(fpSendBtn.disabled) return; // avoid rapid resend
    switchStep('send'); showFpStatus('You can request a new OTP.','');
  });

  fpVerifyBtn?.addEventListener('click', async ()=>{
    const code = fpOTPInput.value.trim(); if(code.length<4){ showFpStatus('Enter the OTP sent to you.','error'); return; }
    showFpStatus('Verifying OTP...'); fpVerifyBtn.disabled=true;
    try {
      const payload = currentIdentifier.includes('@') ? { email: currentIdentifier, otp: code } : { phone: currentIdentifier, otp: code };
  const res = await fetch(`${apiBase}/api/trainers/verify-otp`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)});
      const data = await safeJson(res);
      if(!res.ok || !data.success) throw new Error(data.message||'Invalid OTP');
      resetToken = data.resetToken; switchStep('reset'); showFpStatus('OTP verified. Set your new password.','success'); fpNewPassword.focus();
    } catch(err){ showFpStatus(err.message,'error'); }
    finally { fpVerifyBtn.disabled=false; }
  });

  fpResetBtn?.addEventListener('click', async ()=>{
    const pwd = fpNewPassword.value.trim(); if(pwd.length<6){ showFpStatus('Password must be at least 6 chars','error'); return; }
    if(!resetToken){ showFpStatus('Reset token missing. Restart process.','error'); return; }
    showFpStatus('Updating password...'); fpResetBtn.disabled=true;
    try {
  const res = await fetch(`${apiBase}/api/trainers/reset-password`, { method:'POST', headers:{'Content-Type':'application/json', 'Authorization':'Bearer '+resetToken}, body: JSON.stringify({ newPassword: pwd }) });
      const data = await safeJson(res);
      if(!res.ok || !data.success) throw new Error(data.message||'Password reset failed');
      showFpStatus('Password updated. You can now login.','success'); switchStep('reset'); backToLoginBtn.style.display='inline-block';
    } catch(err){ showFpStatus(err.message,'error'); }
    finally { fpResetBtn.disabled=false; }
  });

  backToLoginBtn?.addEventListener('click', ()=>{ closeModal(); showStatus('You can login with your new password.','success'); });

  // Expose safeJson for login path earlier (moved above usage)
  // (Already defined earlier; ensure no duplicate definitions.)
})();
