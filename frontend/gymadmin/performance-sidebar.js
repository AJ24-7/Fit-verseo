// 🚀 ULTRA-FAST SIDEBAR PERFORMANCE SYSTEM
class UltraFastSidebar {
  constructor() {
    this.activeTab = null;
    this.isTransitioning = false;
    this.clickDebounce = null;
    this.animationFrame = null;
    
    // Cache DOM elements for ultra-fast access
    this.cache = new Map();
    this.setupCaching();
    this.bindEvents();
    
    console.log('⚡ Ultra-Fast Sidebar System initialized');
  }

  setupCaching() {
    // Cache all menu links
    const menuLinks = document.querySelectorAll('.menu-link');
    menuLinks.forEach(link => {
      const tabId = link.getAttribute('data-tab');
      if (tabId) {
        this.cache.set(`link_${tabId}`, link);
        this.cache.set(`tab_${tabId}`, document.getElementById(tabId));
      }
    });
    
    // Cache sidebar elements
    this.cache.set('sidebar', document.querySelector('.sidebar'));
    this.cache.set('mobileSidebar', document.querySelector('.mobile-sidebar-dropdown'));
    this.cache.set('backdrop', document.querySelector('.mobile-sidebar-backdrop'));
    this.cache.set('hamburger', document.querySelector('.hamburger-menu'));
    
    // Cache desktop sidebar toggle elements
    this.cache.set('toggleBtn', document.getElementById('toggleBtn'));
    this.cache.set('mainContent', document.getElementById('mainContent'));
    this.cache.set('topNav', document.getElementById('topNav'));
    
    console.log(`📋 Cached ${this.cache.size} DOM elements for instant access`);
  }

  bindEvents() {
    // Use event delegation for maximum performance
    const sidebar = this.cache.get('sidebar');
    const mobileSidebar = this.cache.get('mobileSidebar');
    
    if (sidebar) {
      sidebar.addEventListener('click', this.handleSidebarClick.bind(this), {
        passive: false,
        capture: true
      });
    }
    
    if (mobileSidebar) {
      mobileSidebar.addEventListener('click', this.handleSidebarClick.bind(this), {
        passive: false,
        capture: true
      });
    }
    
    // Desktop sidebar toggle button
    const toggleBtn = this.cache.get('toggleBtn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', this.toggleDesktopSidebar.bind(this), {
        passive: false
      });
    }
    
    // Mobile hamburger menu
    const hamburger = this.cache.get('hamburger');
    if (hamburger) {
      hamburger.addEventListener('click', this.toggleMobileSidebar.bind(this), {
        passive: false
      });
    }
    
    // Close mobile sidebar on backdrop click
    const backdrop = this.cache.get('backdrop');
    if (backdrop) {
      backdrop.addEventListener('click', this.closeMobileSidebar.bind(this), {
        passive: true
      });
    }
    
    // ESC key to close mobile sidebar
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.cache.get('mobileSidebar')?.classList.contains('show')) {
        this.closeMobileSidebar();
      }
    }, { passive: true });
  }

  handleSidebarClick(e) {
    // Immediate debounce check
    if (this.clickDebounce) {
      clearTimeout(this.clickDebounce);
    }
    
    const link = e.target.closest('.menu-link');
    if (!link) return;
    
    const tabId = link.getAttribute('data-tab');
    if (!tabId || this.isTransitioning) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Immediate visual feedback (no delays)
    this.setActiveState(link, tabId);
    
    // Ultra-fast tab switch
    this.switchTab(tabId);
    
    // Close mobile sidebar instantly
    this.closeMobileSidebar();
    
    // Set debounce to prevent rapid clicks
    this.clickDebounce = setTimeout(() => {
      this.clickDebounce = null;
    }, 50);
  }

  setActiveState(activeLink, tabId) {
    // Cancel any pending animation frame
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    
    this.animationFrame = requestAnimationFrame(() => {
      // Remove active class from all links instantly
      const allLinks = document.querySelectorAll('.menu-link');
      for (let i = 0; i < allLinks.length; i++) {
        if (allLinks[i].classList.contains('active')) {
          allLinks[i].classList.remove('active');
        }
      }
      
      // Set active state instantly
      activeLink.classList.add('active');
      
      // Find and activate corresponding mobile/desktop link
      const correspondingLink = this.cache.get(`link_${tabId}`);
      if (correspondingLink && correspondingLink !== activeLink) {
        correspondingLink.classList.add('active');
      }
      
      this.animationFrame = null;
    });
  }

  switchTab(tabId) {
    if (this.isTransitioning) return;
    
    this.isTransitioning = true;
    const startTime = performance.now();
    
    // Get target tab from cache
    const targetTab = this.cache.get(`tab_${tabId}`);
    
    if (!targetTab) {
      console.warn(`❌ Tab ${tabId} not found in cache`);
      this.isTransitioning = false;
      return;
    }
    
    // Hide all tabs in a single batch operation
    const allTabs = document.querySelectorAll('.tab-content, [id$="Tab"]');
    const fragment = document.createDocumentFragment();
    
    // Use Web API for fastest DOM manipulation
    allTabs.forEach(tab => {
      if (tab.style.display !== 'none') {
        tab.style.display = 'none';
        tab.classList.remove('active', 'show', 'visible');
      }
    });
    
    // Show target tab immediately
    targetTab.style.display = 'block';
    targetTab.classList.add('active');
    targetTab.scrollTop = 0;
    
    // Update active tab reference
    this.activeTab = tabId;
    this.isTransitioning = false;
    
    // Performance logging
    const endTime = performance.now();
    console.log(`⚡ Tab switch completed in ${(endTime - startTime).toFixed(2)}ms`);
    
    // Trigger tab initialization (non-blocking)
    this.initializeTab(tabId);
  }

  initializeTab(tabId) {
    // Use idle callback for non-critical initialization
    (window.requestIdleCallback || setTimeout)(() => {
      const initMap = {
        'dashboardTab': () => window.initializeDashboard?.(),
        'membersTab': () => window.initializeMembersTab?.(),
        'trainerTab': () => window.showTrainerTab?.(),
        'attendanceTab': () => window.initializeAttendanceTab?.(),
        'paymentTab': () => window.ensurePaymentManager?.(),
        'equipmentTab': () => window.initializeEquipmentTab?.(),
        'settingsTab': () => window.updatePasskeySettingsUI?.(),
        'supportReviewsTab': () => window.initializeSupportTab?.()
      };
      
      const initFunction = initMap[tabId];
      if (initFunction && typeof initFunction === 'function') {
        try {
          initFunction();
        } catch (error) {
          console.warn(`⚠️ Tab ${tabId} initialization error:`, error);
        }
      }
    });
  }

  toggleMobileSidebar() {
    const mobileSidebar = this.cache.get('mobileSidebar');
    const backdrop = this.cache.get('backdrop');
    
    if (!mobileSidebar) return;
    
    if (mobileSidebar.classList.contains('show')) {
      this.closeMobileSidebar();
    } else {
      this.openMobileSidebar();
    }
  }

  openMobileSidebar() {
    const mobileSidebar = this.cache.get('mobileSidebar');
    const backdrop = this.cache.get('backdrop');
    
    if (mobileSidebar && backdrop) {
      mobileSidebar.classList.add('show');
      backdrop.classList.add('show', 'active');
      document.body.style.overflow = 'hidden';
    }
  }

  closeMobileSidebar() {
    const mobileSidebar = this.cache.get('mobileSidebar');
    const backdrop = this.cache.get('backdrop');
    
    if (mobileSidebar && backdrop) {
      mobileSidebar.classList.remove('show');
      backdrop.classList.remove('show', 'active');
      document.body.style.overflow = '';
    }
  }

  // Desktop sidebar toggle (collapse/expand with proper main content adjustment)
  toggleDesktopSidebar() {
    if (window.innerWidth <= 900) return; // Only work on desktop
    
    const sidebar = this.cache.get('sidebar');
    const mainContent = this.cache.get('mainContent');
    const topNav = this.cache.get('topNav');
    const toggleBtn = this.cache.get('toggleBtn');
    
    if (!sidebar || !mainContent || !topNav || !toggleBtn) return;
    
    // Toggle classes with hardware acceleration
    const isCollapsed = sidebar.classList.toggle('sidebar-collapsed');
    document.body.classList.toggle('sidebar-collapsed', isCollapsed);
    
    // Animate the toggle icon
    const icon = toggleBtn.querySelector('i');
    if (icon) {
      requestAnimationFrame(() => {
        if (isCollapsed) {
          icon.classList.remove('fa-chevron-left');
          icon.classList.add('fa-chevron-right');
        } else {
          icon.classList.remove('fa-chevron-right');
          icon.classList.add('fa-chevron-left');
        }
      });
    }
    
    // Smooth content adjustment with hardware acceleration
    requestAnimationFrame(() => {
      if (isCollapsed) {
        // Collapsed state: full width content
        mainContent.style.marginLeft = '0';
        topNav.style.left = '0';
        topNav.style.width = '100vw';
      } else {
        // Expanded state: normal sidebar width
        mainContent.style.marginLeft = '270px';
        topNav.style.left = '270px';
        topNav.style.width = 'calc(100vw - 270px)';
      }
    });
    
    console.log(`⚡ Desktop sidebar ${isCollapsed ? 'collapsed' : 'expanded'}`);
  }

  // Public API method to switch tabs programmatically
  switchToTab(tabId) {
    if (this.cache.has(`tab_${tabId}`)) {
      const link = this.cache.get(`link_${tabId}`);
      if (link) {
        this.setActiveState(link, tabId);
        this.switchTab(tabId);
      }
    }
  }
}

// Advanced Multi-Language System
class AdvancedLanguageSystem {
  constructor() {
    this.currentLanguage = localStorage.getItem('gymAdminLanguage') || 'en';
    this.translations = new Map();
    this.observers = new Set();
    this.isInitialized = false;
    
    this.initialize();
  }

  async initialize() {
    console.log('🌐 Initializing Advanced Language System...');
    
    // Load translation data
    await this.loadTranslations();
    
    // Setup language switcher
    this.setupLanguageSwitcher();
    
    // Apply current language
    this.applyLanguage(this.currentLanguage);
    
    // Setup mutation observer for dynamic content
    this.setupMutationObserver();
    
    this.isInitialized = true;
    console.log(`✅ Language System ready. Current: ${this.currentLanguage}`);
  }

  async loadTranslations() {
    // Define translation data inline for performance
    const translations = {
      en: {
        // Navigation
        'dashboard': 'Dashboard',
        'members': 'Members',
        'trainers': 'Trainers',
        'attendance': 'Attendance', 
        'payments': 'Payments',
        'equipment': 'Equipment',
        'settings': 'Settings',
        'support': 'Support & Reviews',
        
        // Dashboard
        'dashboard_overview': 'Dashboard Overview',
        'welcome': 'Welcome to Gym Admin',
        'total_members': 'Total Members',
        'active_trainers': 'Active Trainers',
        'monthly_revenue': 'Monthly Revenue',
        'equipment_status': 'Equipment Status',
        'recent_payments': 'Recent Payments',
        'member_activity': 'Member Activity',
        'new_members': 'New Members',
        'trial_bookings': 'Trial Bookings',
        'attendance_trend': 'Attendance Trend',
        'recent_activity': 'Recent Activity',
        'equipment_gallery': 'Equipment Gallery',
        
        // Members
        'add_member': 'Add Member',
        'member_list': 'Member List',
        'active_members': 'Active Members',
        'expired_memberships': 'Expired Memberships',
        
        // Common
        'search': 'Search',
        'filter': 'Filter',
        'save': 'Save',
        'cancel': 'Cancel',
        'delete': 'Delete',
        'edit': 'Edit',
        'view': 'View',
        'status': 'Status',
        'date': 'Date',
        'amount': 'Amount',
        'name': 'Name',
        'language': 'Language',
        'english': 'English',
        'hindi': 'Hindi'
      },
      hi: {
        // Navigation
        'dashboard': 'डैशबोर्ड',
        'members': 'सदस्य',
        'trainers': 'प्रशिक्षक',
        'attendance': 'उपस्थिति',
        'payments': 'भुगतान',
        'equipment': 'उपकरण',
        'settings': 'सेटिंग्स',
        'support': 'सहायता और समीक्षा',
        
        // Dashboard
        'dashboard_overview': 'डैशबोर्ड अवलोकन',
        'welcome': 'जिम एडमिन में आपका स्वागत है',
        'total_members': 'कुल सदस्य',
        'active_trainers': 'सक्रिय प्रशिक्षक',
        'monthly_revenue': 'मासिक आय',
        'equipment_status': 'उपकरण स्थिति',
        'recent_payments': 'हाल की भुगतान',
        'member_activity': 'सदस्य गतिविधि',
        'new_members': 'नए सदस्य',
        'trial_bookings': 'ट्रायल बुकिंग',
        'attendance_trend': 'उपस्थिति प्रवृत्ति',
        'recent_activity': 'हाल की गतिविधि',
        'equipment_gallery': 'उपकरण गैलरी',
        
        // Members
        'add_member': 'सदस्य जोड़ें',
        'member_list': 'सदस्य सूची',
        'active_members': 'सक्रिय सदस्य',
        'expired_memberships': 'समाप्त सदस्यताएं',
        
        // Common
        'search': 'खोजें',
        'filter': 'फ़िल्टर',
        'save': 'सहेजें',
        'cancel': 'रद्द करें',
        'delete': 'हटाएं',
        'edit': 'संपादित करें',
        'view': 'देखें',
        'status': 'स्थिति',
        'date': 'दिनांक',
        'amount': 'राशि',
        'name': 'नाम',
        'language': 'भाषा',
        'english': 'अंग्रेजी',
        'hindi': 'हिंदी'
      }
    };
    
    // Store translations
    for (const [lang, data] of Object.entries(translations)) {
      this.translations.set(lang, data);
    }
  }

  setupLanguageSwitcher() {
    // Don't create automatic switcher - integrate with Settings tab instead
    console.log('🌐 Language system ready - integrated with Settings tab');
  }

  createLanguageSwitcher() {
    // Language switcher will be handled by Settings tab
    return null;
  }

  addLanguageSwitcherStyles() {
    // No automatic language switcher styles needed
  }

  async changeLanguage(lang) {
    if (!this.translations.has(lang)) {
      console.warn(`Language ${lang} not available`);
      return;
    }
    
    this.currentLanguage = lang;
    localStorage.setItem('gymAdminLanguage', lang);
    
    // Update switcher buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });
    
    // Apply translations
    await this.applyLanguage(lang);
    
    console.log(`🌐 Language changed to: ${lang}`);
  }

  applyLanguage(lang) {
    const translations = this.translations.get(lang);
    if (!translations) return;
    
    // Prevent duplicate translations by tracking what's been translated
    const translatedElements = new Set();
    
    // Translate elements with data-translate attribute
    document.querySelectorAll('[data-translate]').forEach(element => {
      const key = element.getAttribute('data-translate');
      
      // Skip if already translated or no translation available
      if (translatedElements.has(element) || !translations[key]) return;
      
      // Mark as translated
      translatedElements.add(element);
      element.setAttribute('data-translated', 'true');
      
      if (element.tagName === 'INPUT' && element.type === 'text') {
        element.placeholder = translations[key];
      } else {
        // Store original text if not already stored
        if (!element.getAttribute('data-original-text')) {
          element.setAttribute('data-original-text', element.textContent.trim());
        }
        element.textContent = translations[key];
      }
    });
    
    // Translate dashboard headers and stats specifically
    this.translateDashboardContent(lang, translations);
    
    // Notify observers
    this.notifyObservers(lang, translations);
  }

  translateDashboardContent(lang, translations) {
    // Translate dashboard overview title
    const dashboardTitle = document.querySelector('h2:contains("डैशबोर्ड अवलोकन")') || 
                          document.querySelector('h2');
    if (dashboardTitle && !dashboardTitle.getAttribute('data-translated')) {
      dashboardTitle.setAttribute('data-translated', 'true');
      dashboardTitle.textContent = translations['dashboard_overview'] || 'Dashboard Overview';
    }
    
    // Translate specific dashboard elements
    const dashboardElements = {
      '.stat-card h3': ['total_members', 'active_trainers', 'monthly_revenue', 'equipment_status'],
      '.activity-item span': ['new_members', 'trial_bookings', 'attendance_trend', 'recent_activity', 'equipment_gallery']
    };
    
    Object.entries(dashboardElements).forEach(([selector, keys]) => {
      document.querySelectorAll(selector).forEach((element, index) => {
        if (keys[index] && translations[keys[index]] && !element.getAttribute('data-translated')) {
          element.setAttribute('data-translated', 'true');
          element.textContent = translations[keys[index]];
        }
      });
    });
  }

  setupMutationObserver() {
    // Disable automatic mutation observer to prevent duplicate translations
    // Language changes will be triggered manually only
    console.log('🔍 Mutation observer disabled to prevent duplicate translations');
  }

  // Public API
  addTranslations(lang, translations) {
    const existing = this.translations.get(lang) || {};
    this.translations.set(lang, { ...existing, ...translations });
  }

  translate(key, lang = this.currentLanguage) {
    const translations = this.translations.get(lang);
    return translations ? translations[key] || key : key;
  }

  onLanguageChange(callback) {
    this.observers.add(callback);
  }

  notifyObservers(lang, translations) {
    this.observers.forEach(callback => {
      try {
        callback(lang, translations);
      } catch (error) {
        console.warn('Language change observer error:', error);
      }
    });
  }
}

// Initialize systems when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Initialize ultra-fast sidebar
  window.ultraFastSidebar = new UltraFastSidebar();
  
  // Initialize advanced language system
  window.advancedLanguageSystem = new AdvancedLanguageSystem();
  
  // Global API exposure
  window.switchTab = (tabId) => window.ultraFastSidebar.switchToTab(tabId);
  window.changeLanguage = (lang) => window.advancedLanguageSystem.changeLanguage(lang);
  
  // Language settings integration
  window.setupLanguageSettings = () => {
    const currentLang = window.advancedLanguageSystem.currentLanguage;
    
    // Update language option active state
    document.querySelectorAll('.language-option').forEach(option => {
      const lang = option.getAttribute('data-lang');
      option.classList.toggle('active', lang === currentLang);
    });
    
    // Add click handlers
    document.querySelectorAll('.language-option').forEach(option => {
      option.addEventListener('click', () => {
        const lang = option.getAttribute('data-lang');
        
        // Update UI immediately
        document.querySelectorAll('.language-option').forEach(opt => opt.classList.remove('active'));
        option.classList.add('active');
        
        // Change language
        window.advancedLanguageSystem.changeLanguage(lang);
      });
    });
  };
  
  // Settings tab language integration functions
  window.applyLanguageSettings = () => {
    const activeOption = document.querySelector('.language-option.active');
    if (activeOption) {
      const lang = activeOption.getAttribute('data-lang');
      window.advancedLanguageSystem.changeLanguage(lang);
      
      // Show success message
      showNotification(`Language changed to ${lang === 'hi' ? 'Hindi' : 'English'}`, 'success');
    }
  };
  
  window.resetLanguageSettings = () => {
    window.advancedLanguageSystem.changeLanguage('en');
    
    // Update UI
    document.querySelectorAll('.language-option').forEach(option => {
      option.classList.toggle('active', option.getAttribute('data-lang') === 'en');
    });
    
    showNotification('Language reset to English', 'info');
  };
  
  window.showLanguageInfo = () => {
    showNotification('Select your preferred language for the dashboard interface. Changes apply immediately.', 'info');
  };
  
  // Helper function for notifications
  window.showNotification = (message, type = 'info') => {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'times' : 'info'}"></i>
        <span>${message}</span>
      </div>
    `;
    
    // Add styles
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      transform: translateX(100%);
      transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Hide notification
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  };
  
  // Setup language settings when settings tab is opened
  document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-tab="settingsTab"]');
    if (link) {
      setTimeout(window.setupLanguageSettings, 100);
    }
  });
  
  console.log('🚀 All performance systems initialized successfully!');
});