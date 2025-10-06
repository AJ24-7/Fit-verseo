// 🚀 ULTRA-FAST SIDEBAR PERFORMANCE SYSTEM
class UltraFastSidebar {
  constructor() {
    console.log('🚀 UltraFastSidebar constructor started');
    
    this.activeTab = null;
    this.isTransitioning = false;
    this.clickDebounce = null;
    this.animationFrame = null;
    this.tabStateMonitor = null;
    
    // Cache DOM elements for ultra-fast access
    this.cache = new Map();
    this.setupCaching();
    this.bindEvents();
    
    console.log('🚀 UltraFastSidebar constructor completed');
  }

  setupCaching() {
    console.log('🚀 Setting up caching...');
    
    // Cache all menu links
    const menuLinks = document.querySelectorAll('.menu-link');
    console.log('🔍 Found menu links:', menuLinks);
    
    menuLinks.forEach(link => {
      const tabId = link.getAttribute('data-tab');
      if (tabId) {
        this.cache.set(`link_${tabId}`, link);
        // Cache tab content using correct selector
        const tabContent = document.getElementById(tabId);
        if (tabContent) {
            this.cache.set(`tab_${tabId}`, tabContent);
            console.log(`✅ Cached tab: ${tabId}`, { link, tabContent });
        } else {
            console.warn(`❌ Tab content not found for: ${tabId}`);
        }
      }
    });
    
    console.log('📦 Cache contents:', this.cache);
    
    // Cache sidebar elements
    this.cache.set('sidebar', document.querySelector('.sidebar'));
    this.cache.set('mobileMenuBar', document.querySelector('.mobile-menu-bar'));
    this.cache.set('backdrop', document.querySelector('.mobile-menu-backdrop'));
    this.cache.set('hamburger', document.querySelector('.hamburger-menu'));
    
    // Cache desktop sidebar toggle elements
    this.cache.set('toggleBtn', document.getElementById('toggleBtn'));
    this.cache.set('topNav', document.getElementById('topNav'));
    
    // Ensure mobile menu bar is initially hidden
    this.ensureMobileMenuBarClosed();
  }

  ensureMobileMenuBarClosed() {
    const mobileMenuBar = this.cache.get('mobileMenuBar');
    const backdrop = this.cache.get('backdrop');
    
    if (mobileMenuBar) {
      mobileMenuBar.classList.remove('show');
      mobileMenuBar.style.display = 'none';
    }
    
    if (backdrop) {
      backdrop.classList.remove('show', 'active');
    }
    
    document.body.style.overflow = '';
  }

  bindEvents() {
    console.log('🚀 Binding events...');
    
    // Use event delegation for maximum performance
    const sidebar = this.cache.get('sidebar');
    const mobileMenuBar = this.cache.get('mobileMenuBar');
    
    console.log('🔍 Sidebar elements:', { sidebar, mobileMenuBar });
    
    if (sidebar) {
      sidebar.addEventListener('click', this.handleSidebarClick.bind(this), {
        passive: false,
        capture: true
      });
      console.log('✅ Desktop sidebar click listener attached');
    } else {
      console.warn('❌ Desktop sidebar not found');
    }
    
    if (mobileMenuBar) {
      mobileMenuBar.addEventListener('click', this.handleSidebarClick.bind(this), {
        passive: false,
        capture: true
      });
      console.log('✅ Mobile menu click listener attached');
    } else {
      console.warn('❌ Mobile menu bar not found');
    }
    
    // Desktop sidebar toggle button
    const toggleBtn = this.cache.get('toggleBtn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', this.toggleDesktopSidebar.bind(this), {
        passive: false
      });
    }
    
    // Mobile hamburger menu for menu bar
    const hamburger = this.cache.get('hamburger');
    if (hamburger) {
      hamburger.addEventListener('click', this.toggleMobileMenuBar.bind(this), {
        passive: false
      });
    }
    
    // Close mobile menu bar on backdrop click
    const backdrop = this.cache.get('backdrop');
    if (backdrop) {
      backdrop.addEventListener('click', this.closeMobileMenuBar.bind(this), {
        passive: true
      });
    }
    
    // ESC key to close mobile menu bar
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.cache.get('mobileMenuBar')?.classList.contains('show')) {
        this.closeMobileMenuBar();
      }
    }, { passive: true });
    
    // Close button for mobile menu bar
    const closeMobileMenuBtn = document.getElementById('closeMobileMenu');
    if (closeMobileMenuBtn) {
      closeMobileMenuBtn.addEventListener('click', this.closeMobileMenuBar.bind(this), {
        passive: false
      });
    }
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
    
    // Ultra-fast tab switch
    this.switchTab(tabId);
    
    // Close mobile menu bar instantly
    this.closeMobileMenuBar();
    
    // Set debounce to prevent rapid clicks
    this.clickDebounce = setTimeout(() => {
      this.clickDebounce = null;
    }, 25);
  }

  setActiveState(activeLink, tabId) {
    // Cancel any pending animation frame
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    
    // Immediate DOM updates for better responsiveness
    const allLinks = document.querySelectorAll('.menu-link');
    for (let i = 0; i < allLinks.length; i++) {
      if (allLinks[i].classList.contains('active')) {
        allLinks[i].classList.remove('active');
      }
    }
    
    // Set active state instantly
    activeLink.classList.add('active');
    
    // Find and activate corresponding mobile/desktop link
    const correspondingLinks = document.querySelectorAll(`[data-tab="${tabId}"]`);
    correspondingLinks.forEach(link => {
      if (link !== activeLink && !link.classList.contains('active')) {
        link.classList.add('active');
      }
    });
  }

  switchTab(tabId) {
    if (this.isTransitioning || this.activeTab === tabId) {
      return;
    }
    
    this.isTransitioning = true;

    // Get active link and target tab from cache
    const activeLink = this.cache.get(`link_${tabId}`);
    const targetTab = this.cache.get(`tab_${tabId}`);
    
    if (!targetTab || !activeLink) {
      console.warn(`Tab ${tabId} or its link not found in cache`);
      this.isTransitioning = false;
      return;
    }

    // 1. Set active class on the link immediately
    this.setActiveState(activeLink, tabId);

    // 2. Aggressively hide all tabs first with multiple approaches
    const allTabs = document.querySelectorAll('.content.tab-content');
    allTabs.forEach(tab => {
      if (tab.id !== tabId) {
        // Force hide with multiple methods to overcome any conflicting styles
        tab.style.setProperty('display', 'none', 'important');
        tab.style.setProperty('visibility', 'hidden', 'important');
        tab.style.setProperty('opacity', '0', 'important');
        tab.classList.remove('active');
      }
    });

    // 3. Show the target tab with multiple reinforcements using !important
    targetTab.style.setProperty('display', 'block', 'important');
    targetTab.style.setProperty('visibility', 'visible', 'important');
    targetTab.style.setProperty('opacity', '1', 'important');
    targetTab.style.setProperty('position', 'relative', 'important');
    targetTab.style.setProperty('z-index', '1', 'important');
    targetTab.classList.add('active');
    targetTab.scrollTop = 0;
    
    // Also ensure parent containers are visible
    let parent = targetTab.parentElement;
    while (parent && parent !== document.body) {
      if (window.getComputedStyle(parent).display === 'none') {
        parent.style.display = 'block';
      }
      parent = parent.parentElement;
    }

    // 4. Force a reflow to ensure changes take effect immediately
    targetTab.offsetHeight;

    // 5. Use a micro-task to ensure any competing systems don't interfere
    Promise.resolve().then(() => {
      // Double-check and re-enforce the visibility state
      if (targetTab.style.display !== 'block') {
        targetTab.style.display = 'block';
      }
      if (!targetTab.classList.contains('active')) {
        targetTab.classList.add('active');
      }
      
      // Hide any other tabs that might have been re-shown by competing logic
      document.querySelectorAll('.content.tab-content').forEach(tab => {
        if (tab.id !== tabId && (tab.style.display === 'block' || tab.classList.contains('active'))) {
          tab.style.display = 'none';
          tab.classList.remove('active');
        }
      });
    });
    
    // Update active tab reference
    this.activeTab = tabId;
    this.isTransitioning = false;
    
    // 6. Defer heavy initialization to TabIsolationManager
    if (window.tabIsolationManager && typeof window.tabIsolationManager.switchToTab === 'function') {
      window.tabIsolationManager.switchToTab(tabId, false).catch(error => {
        console.warn('TabIsolationManager failed to initialize tab:', error);
      });
    }
    
    // 7. Notify optimized module loader about tab switch
    const tabSwitchedEvent = new CustomEvent('tabSwitched', {
      detail: { tabId: tabId }
    });
    document.dispatchEvent(tabSwitchedEvent);
    
    // 8. Also trigger module loading directly if available
    if (window.optimizedModuleLoader && typeof window.optimizedModuleLoader.loadTabModules === 'function') {
      window.optimizedModuleLoader.loadTabModules(tabId).catch(error => {
        console.warn('Module loader failed for tab:', error);
      });
    }
    
    // 9. Set up a defensive monitor to prevent competing systems from interfering
    this.setupTabStateMonitor(tabId);
  }

  // Defensive mechanism to monitor and maintain correct tab state
  setupTabStateMonitor(activeTabId) {
    // Clear any existing monitor
    if (this.tabStateMonitor) {
      clearInterval(this.tabStateMonitor);
    }

    // Set up a brief monitoring period to catch and fix any interference
    let checkCount = 0;
    this.tabStateMonitor = setInterval(() => {
      checkCount++;
      
      // Monitor for 2 seconds max (20 checks at 100ms intervals)
      if (checkCount > 20) {
        clearInterval(this.tabStateMonitor);
        this.tabStateMonitor = null;
        return;
      }

      const targetTab = this.cache.get(`tab_${activeTabId}`);
      if (!targetTab) return;

      // Check if the target tab got hidden by competing logic
      const computedDisplay = window.getComputedStyle(targetTab).display;
      const hasActiveClass = targetTab.classList.contains('active');
      
      if (computedDisplay === 'none' || !hasActiveClass) {
        console.warn(`🛡️ Tab state interference detected for ${activeTabId}, restoring...`);
        
        // Re-hide all other tabs
        document.querySelectorAll('.content.tab-content').forEach(tab => {
          if (tab.id !== activeTabId) {
            tab.style.display = 'none';
            tab.classList.remove('active');
          }
        });
        
        // Re-show the target tab
        targetTab.style.display = 'block';
        targetTab.classList.add('active');
      }
    }, 100);
  }

  toggleMobileMenuBar() {
    const mobileMenuBar = this.cache.get('mobileMenuBar');
    
    if (!mobileMenuBar) return;
    
    if (mobileMenuBar.classList.contains('show')) {
      this.closeMobileMenuBar();
    } else {
      this.openMobileMenuBar();
    }
  }

  openMobileMenuBar() {
    const mobileMenuBar = this.cache.get('mobileMenuBar');
    const backdrop = this.cache.get('backdrop');
    
    if (mobileMenuBar && backdrop) {
      mobileMenuBar.style.display = 'block';
      mobileMenuBar.classList.add('show');
      backdrop.classList.add('show', 'active');
      document.body.style.overflow = 'hidden';
    }
  }

  closeMobileMenuBar() {
    const mobileMenuBar = this.cache.get('mobileMenuBar');
    const backdrop = this.cache.get('backdrop');
    
    if (mobileMenuBar && backdrop && mobileMenuBar.classList.contains('show')) {
      mobileMenuBar.classList.remove('show');
      backdrop.classList.remove('show', 'active');
      document.body.style.overflow = '';
      
      // Hide the menu bar after animation completes
      setTimeout(() => {
        if (!mobileMenuBar.classList.contains('show')) {
          mobileMenuBar.style.display = 'none';
        }
      }, 300);
      
      console.log('✅ Mobile menu bar closed successfully');
    }
  }

  // Desktop sidebar toggle (collapse/expand with CSS-only positioning)
  toggleDesktopSidebar() {
    if (window.innerWidth <= 900) return; // Only work on desktop
    
    const sidebar = this.cache.get('sidebar');
    const toggleBtn = this.cache.get('toggleBtn');
    
    if (!sidebar || !toggleBtn) return;
    
    // Toggle classes - let CSS handle all positioning
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
    
    console.log(`⚡ Desktop sidebar ${isCollapsed ? 'collapsed' : 'expanded'} - CSS handles positioning`);
  }

  // Public API method to switch tabs programmatically
  switchToTabProgrammatically(tabId) {
    if (this.cache.has(`tab_${tabId}`)) {
      this.switchTab(tabId);
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
    const h2Elements = document.querySelectorAll('h2');
    let dashboardTitle = null;
    
    // Find h2 element with Hindi text or fallback to first h2
    for (const h2 of h2Elements) {
      if (h2.textContent.includes('डैशबोर्ड अवलोकन') || h2.textContent.includes('Dashboard Overview')) {
        dashboardTitle = h2;
        break;
      }
    }
    
    // Fallback to first h2 if no specific match found
    if (!dashboardTitle && h2Elements.length > 0) {
      dashboardTitle = h2Elements[0];
    }
    
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
  console.log('🚀 Performance Sidebar: DOM Content Loaded');
  
  // Initialize ultra-fast sidebar
  window.ultraFastSidebar = new UltraFastSidebar();
  console.log('🚀 UltraFastSidebar initialized:', window.ultraFastSidebar);
  
  // Initialize advanced language system
  window.advancedLanguageSystem = new AdvancedLanguageSystem();
  
  // Global API exposure
  window.switchTab = (tabId) => window.ultraFastSidebar.switchToTabProgrammatically(tabId);
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
  
  // Settings tab language integration functions
  window.applyLanguageSettings = () => {
    const activeOption = document.querySelector('.language-option.active');
    if (activeOption) {
      const lang = activeOption.getAttribute('data-lang');
      window.advancedLanguageSystem.changeLanguage(lang);
      
      // Show success message
      window.showNotification(`Language changed to ${lang === 'hi' ? 'Hindi' : 'English'}`, 'success');
    }
  };
  
  window.resetLanguageSettings = () => {
    window.advancedLanguageSystem.changeLanguage('en');
    
    // Update UI
    document.querySelectorAll('.language-option').forEach(option => {
      option.classList.toggle('active', option.getAttribute('data-lang') === 'en');
    });
    
    window.showNotification('Language reset to English', 'info');
  };
  
  window.showLanguageInfo = () => {
    window.showNotification('Select your preferred language for the dashboard interface. Changes apply immediately.', 'info');
  };
  
  // Setup language settings when settings tab is opened
  document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-tab="settingsTab"]');
    if (link) {
      setTimeout(window.setupLanguageSettings, 100);
    }
  });
});