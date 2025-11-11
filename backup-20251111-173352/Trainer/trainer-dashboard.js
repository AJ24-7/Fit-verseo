(function(){
  const apiBase = (function(){
    const loc = window.location;
    if (loc.port === '5500') return `${loc.protocol}//${loc.hostname}:5000`;
    return '';
  })();
  const token = localStorage.getItem('trainer_token');
  const yearSpan = document.getElementById('year'); if (yearSpan) yearSpan.textContent = new Date().getFullYear();
  const tabs = document.querySelectorAll('nav button');
  const sections = document.querySelectorAll('.tab');
  const logoutBtn = document.getElementById('logoutBtn');
  const refreshBtn = document.getElementById('refreshBtn');
  const editProfileBtn = document.getElementById('editProfileBtn');
  const profileForm = document.getElementById('profileForm');
  const cancelEditBtn = document.getElementById('cancelEditBtn');
  const saveStatus = document.getElementById('profileSaveStatus');

  if (!token) {
    window.location.replace('../public/trainer-login.html');
    return;
  }

  tabs.forEach(btn => btn.addEventListener('click', () => {
    tabs.forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.getAttribute('data-tab');
    sections.forEach(s => s.style.display = s.id.startsWith(tab) ? '' : 'none');
  }));

  logoutBtn?.addEventListener('click', () => {
    localStorage.removeItem('trainer_token');
    window.location.replace('../public/trainer-login.html');
  });

  function gradientText(str){return str;}

  function formatRate(t){
    const parts=[]; if(t.hourlyRate) parts.push('₹'+t.hourlyRate+'/hr'); if(t.monthlyRate) parts.push('₹'+t.monthlyRate+'/mo'); return parts.join(' • ')||'—';
  }

  async function loadProfile(){
    try {
  const res = await fetch(`${apiBase}/api/trainers/me`,{headers:{Authorization:'Bearer '+token}});
      const data = await res.json();
      if(!res.ok){ throw new Error(data.message||'Failed to load profile'); }
      const t = data.trainer;
      document.getElementById('trainerName').textContent = (t.firstName||'')+' '+(t.lastName||'');
      const tagsEl = document.getElementById('trainerTags');
      tagsEl.innerHTML = '';
      const tagData = [t.specialty, t.trainerType==='gym'?'Gym Trainer':'Independent', t.status];
      tagData.filter(Boolean).forEach(val=>{
        const d=document.createElement('div');d.className='pill';d.textContent=val;tagsEl.appendChild(d);
      });
      document.getElementById('rateDisplay').textContent = formatRate(t);
      document.getElementById('bioText').textContent = t.bio||'No bio yet.';
      const avatarArea = document.getElementById('avatarArea');
      avatarArea.classList.remove('skeleton');
      if (t.photo) {
        avatarArea.innerHTML = '<img src="'+t.photo+'" alt="Trainer" />';
      } else {
        const initials = ((t.firstName||'')[0]||'T') + ((t.lastName||'')[0]||'');
        avatarArea.textContent = initials.toUpperCase();
      }
      // Pre-fill form
      ['firstName','lastName','specialty','bio','hourlyRate','monthlyRate'].forEach(f=>{
        if (profileForm.elements[f]) profileForm.elements[f].value = t[f]||'';
      });
    } catch(err){
      console.error(err);
      document.getElementById('trainerName').textContent = 'Load failed';
    }
  }

  refreshBtn?.addEventListener('click', loadProfile);
  editProfileBtn?.addEventListener('click', ()=>{
    tabs.forEach(b=>b.classList.remove('active'));
    document.querySelector('nav button[data-tab="profile"]').classList.add('active');
    sections.forEach(s => s.style.display = s.id.startsWith('profile') ? '' : 'none');
  });
  cancelEditBtn?.addEventListener('click', ()=>{
    tabs.forEach(b=>b.classList.remove('active'));
    document.querySelector('nav button[data-tab="overview"]').classList.add('active');
    sections.forEach(s => s.style.display = s.id.startsWith('overview') ? '' : 'none');
  });

  profileForm?.addEventListener('submit', async e=>{
    e.preventDefault();
    saveStatus.textContent = 'Saving...';
    try {
      const formData = new FormData(profileForm);
      const body = {};
      formData.forEach((v,k)=>{ if(v!==undefined && v!==null) body[k]=v;});
  const res = await fetch(`${apiBase}/api/trainers/me`,{
        method:'PATCH',
        headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if(!res.ok) throw new Error(data.message||'Update failed');
      saveStatus.textContent = 'Saved successfully';
      loadProfile();
      setTimeout(()=>{saveStatus.textContent='';},1500);
    } catch(err){
      console.error(err);
      saveStatus.textContent = 'Error: '+err.message;
    }
  });

  loadProfile();
})();
