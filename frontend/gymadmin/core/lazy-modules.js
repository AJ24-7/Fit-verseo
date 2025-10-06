// Lazy loading registry for heavy gym admin feature modules
// Production-focused: load only when user opens the corresponding tab.
(function(){
  const tabScripts = {
    memberDisplayTab: [], // Member functions are in main gymadmin.js
    equipmentTab: ['modules/equipment.js'],
    attendanceTab: ['modules/attendance.js','modules/attendance-stats.js'],
    supportReviewsTab: ['modules/support-reviews.js','modules/enhanced-support-integration.js'],
    settingsTab: ['modules/settings.js','modules/gym-profile.js','modules/enhanced-biometric-manager.js'],
    trainerTab: ['modules/trainer-management.js'],
    paymentTab: ['modules/payment.js','modules/cash-validation.js','modules/cash-validation-dialog.js'],
    offersTab: ['modules/offers-manager.js'],
    trialBookingsTab: ['modules/trial-bookings.js']
  };

  const basePath = ''; // relative from current directory
  const loaded = new Set();
  const loadingPromises = {};

  function loadScript(src){
    return new Promise((resolve,reject)=>{
      if (loaded.has(src)) return resolve();
      const s=document.createElement('script');
      s.src=basePath + src;
      s.defer=true;
      s.onload=()=>{ loaded.add(src); resolve(); };
      s.onerror=()=>reject(new Error('Failed loading '+src));
      document.head.appendChild(s);
    });
  }

  async function loadTabScripts(tabId){
    const list = tabScripts[tabId];
    if (!list) return;
    // Combine list into a composite key
    const key = tabId;
    if (loadingPromises[key]) return loadingPromises[key];
    loadingPromises[key] = (async()=>{
      for (const file of list) { await loadScript(file); }
    })();
    return loadingPromises[key];
  }

  window.__loadTabScripts = loadTabScripts;
})();
