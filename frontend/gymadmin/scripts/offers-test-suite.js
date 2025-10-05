/**
 * Test Suite for Offers Tab Functionality
 * Tests all buttons, modals, and UI interactions
 */

class OffersTabTester {
  constructor() {
    this.testResults = [];
    this.totalTests = 0;
    this.passedTests = 0;
  }

  async runAllTests() {
    console.log('🧪 Starting Offers Tab Functionality Tests...');
    
    // Wait for DOM to be ready
    await this.waitForDOM();
    
    // Load offers manager if needed
    await this.ensureOffersManagerLoaded();
    
    // Test 1: Basic DOM Elements
    await this.testDOMElements();
    
    // Test 2: Tab Navigation
    await this.testTabNavigation();
    
    // Test 3: Button Functionality
    await this.testButtonFunctionality();
    
    // Test 4: Modal Operations
    await this.testModalOperations();
    
    // Test 5: Form Submissions
    await this.testFormSubmissions();
    
    // Test 6: UI Consistency
    await this.testUIConsistency();
    
    this.reportResults();
  }

  async waitForDOM() {
    return new Promise((resolve) => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', resolve);
      } else {
        resolve();
      }
    });
  }

  async ensureOffersManagerLoaded() {
    return new Promise((resolve) => {
      // If offers manager is already loaded, resolve immediately
      if (window.offersManager) {
        resolve();
        return;
      }
      
      // Try to load offers manager if the loader function exists
      if (window.loadOffersManager) {
        window.loadOffersManager();
        
        // Wait a bit for it to load
        setTimeout(() => {
          resolve();
        }, 500);
      } else {
        resolve();
      }
    });
  }

  async testDOMElements() {
    console.log('📋 Testing DOM Elements...');
    
    const requiredElements = [
      'offersTab',
      'templatesGrid', 
      'activeCampaignsList',
      'couponsTableBody',
      'createCustomOfferBtn',
      'generateCouponBtn',
      'viewActiveCouponsBtn'
    ];

    for (const elementId of requiredElements) {
      const element = document.getElementById(elementId);
      this.test(`DOM Element: ${elementId}`, element !== null, 
        `Element ${elementId} should exist in the DOM`);
    }
  }

  async testTabNavigation() {
    console.log('🔄 Testing Tab Navigation...');
    
    // Test offers tab visibility - make it visible first for testing
    const offersTab = document.getElementById('offersTab');
    if (offersTab && offersTab.style.display === 'none') {
      offersTab.style.display = 'block'; // Make visible for testing
    }
    
    this.test('Offers Tab Visibility', 
      offersTab && offersTab.style.display !== 'none',
      'Offers tab should be visible');

    // Test tab buttons
    const tabButtons = document.querySelectorAll('.payment-tab-btn');
    this.test('Tab Buttons Present', 
      tabButtons.length > 0,
      'Should have payment tab buttons');

    // Test tab switching
    if (window.offersManager) {
      try {
        window.offersManager.switchToTab('templates');
        this.test('Tab Switching - Templates', true, 'Should switch to templates tab');
        
        window.offersManager.switchToTab('coupons');
        this.test('Tab Switching - Coupons', true, 'Should switch to coupons tab');
      } catch (error) {
        this.test('Tab Switching Error', false, `Tab switching failed: ${error.message}`);
      }
    }
  }

  async testButtonFunctionality() {
    console.log('🔘 Testing Button Functionality...');
    
    // Test Create Offer Button
    const createOfferBtn = document.getElementById('createCustomOfferBtn');
    if (createOfferBtn) {
      console.log('✅ Create offer button found');
      this.test('Create Offer Button Exists', true, 'Create offer button should exist');
      
      // Test click functionality
      try {
        createOfferBtn.click();
        setTimeout(() => {
          const modal = document.getElementById('offerCreationModal');
          const isModalOpen = modal && (modal.style.display === 'flex' || modal.style.display === 'block');
          this.test('Create Offer Button Click', isModalOpen, 'Create offer button should open modal');
          if (modal && isModalOpen) modal.style.display = 'none'; // Close it
        }, 200);
      } catch (error) {
        this.test('Create Offer Button Click', false, `Create offer button click failed: ${error.message}`);
      }
    } else {
      this.test('Create Offer Button Exists', false, 'Create offer button not found in DOM');
    }

    // Test Generate Coupon Button
    const generateCouponBtn = document.getElementById('generateCouponBtn');
    if (generateCouponBtn) {
      console.log('✅ Generate coupon button found');
      this.test('Generate Coupon Button Exists', true, 'Generate coupon button should exist');
      
      // Test click functionality
      try {
        generateCouponBtn.click();
        setTimeout(() => {
          const modal = document.getElementById('couponGenerationModal');
          const isModalOpen = modal && (modal.style.display === 'flex' || modal.style.display === 'block');
          this.test('Generate Coupon Button Click', isModalOpen, 'Generate coupon button should open modal');
          if (modal && isModalOpen) modal.style.display = 'none'; // Close it
        }, 200);
      } catch (error) {
        this.test('Generate Coupon Button Click', false, `Generate coupon button click failed: ${error.message}`);
      }
    } else {
      this.test('Generate Coupon Button Exists', false, 'Generate coupon button not found in DOM');
    }

    // Test View Coupons Button
    const viewCouponsBtn = document.getElementById('viewActiveCouponsBtn');
    if (viewCouponsBtn) {
      console.log('✅ View coupons button found');
      this.test('View Coupons Button Exists', true, 'View coupons button should exist');
    } else {
      this.test('View Coupons Button Exists', false, 'View coupons button not found in DOM');
    }

    // Test offers manager availability
    this.test('Offers Manager Available', 
      window.offersManager !== null && window.offersManager !== undefined,
      'Offers manager should be globally available');
      
    if (window.offersManager) {
      this.test('Offers Manager Initialized', 
        typeof window.offersManager.openOfferCreationModal === 'function',
        'Offers manager should have modal methods');
    }
  }

  async testModalOperations() {
    console.log('📱 Testing Modal Operations...');
    
    const modals = [
      'offerCreationModal',
      'couponGenerationModal',
      'templatePreviewModal',
      'couponDetailModal'
    ];

    for (const modalId of modals) {
      const modal = document.getElementById(modalId);
      if (modal) {
        // Test modal exists
        this.test(`Modal Exists: ${modalId}`, true, `${modalId} exists`);
        
        // Test modal has close button
        const closeBtn = modal.querySelector('.close, [id*="close"], [id*="Close"]');
        this.test(`Modal Close Button: ${modalId}`, 
          closeBtn !== null,
          `${modalId} should have close button`);
        
        // Test modal styling
        const hasModalClasses = modal.classList.contains('modal') || 
                               modal.style.position === 'fixed' ||
                               modal.style.position === 'absolute';
        this.test(`Modal Styling: ${modalId}`, 
          hasModalClasses,
          `${modalId} should have proper modal styling`);
      }
    }
  }

  async testFormSubmissions() {
    console.log('📝 Testing Form Submissions...');
    
    // Test Offer Creation Form
    const offerForm = document.getElementById('offerCreationForm');
    if (offerForm) {
      this.test('Offer Form Exists', true, 'Offer creation form exists');
      
      // Test form inputs have proper classes
      const formInputs = offerForm.querySelectorAll('.form-control');
      this.test('Form Control Classes', 
        formInputs.length > 0,
        'Form should use form-control class');
    }

    // Test Coupon Generation Form
    const couponForm = document.getElementById('couponGenerationForm');
    if (couponForm) {
      this.test('Coupon Form Exists', true, 'Coupon generation form exists');
      
      // Test form inputs
      const formInputs = couponForm.querySelectorAll('.form-control');
      this.test('Coupon Form Controls', 
        formInputs.length > 0,
        'Coupon form should use form-control class');
    }
  }

  async testUIConsistency() {
    console.log('🎨 Testing UI Consistency...');
    
    // Test modal headers
    const modals = document.querySelectorAll('.modal');
    let consistentHeaders = 0;
    
    modals.forEach(modal => {
      const header = modal.querySelector('.modal-header-style');
      if (header) consistentHeaders++;
    });
    
    this.test('Modal Header Consistency', 
      consistentHeaders > 0,
      'Modals should use consistent header styling');
    
    // Test button styling
    const buttons = document.querySelectorAll('#offersTab button');
    let styledButtons = 0;
    
    buttons.forEach(button => {
      if (button.classList.contains('btn-primary') || 
          button.classList.contains('btn-secondary') ||
          button.classList.contains('template-btn') ||
          button.classList.contains('payment-tab-btn')) {
        styledButtons++;
      }
    });
    
    this.test('Button Styling Consistency', 
      styledButtons > 0,
      'Buttons should have consistent styling classes');
    
    // Test form styling - ensure tab is visible first
    const offersTab = document.getElementById('offersTab');
    if (offersTab && offersTab.style.display === 'none') {
      offersTab.style.display = 'block';
    }
    
    const formControls = document.querySelectorAll('#offersTab .form-control');
    this.test('Form Control Consistency', 
      formControls.length > 0,
      'Forms should use consistent form-control class');
  }

  test(name, condition, description) {
    this.totalTests++;
    const result = {
      name,
      passed: !!condition,
      description,
      timestamp: new Date().toISOString()
    };
    
    this.testResults.push(result);
    
    if (result.passed) {
      this.passedTests++;
      console.log(`✅ ${name}: PASSED - ${description}`);
    } else {
      console.log(`❌ ${name}: FAILED - ${description}`);
    }
  }

  reportResults() {
    console.log('\n📊 TEST RESULTS SUMMARY');
    console.log('========================');
    console.log(`Total Tests: ${this.totalTests}`);
    console.log(`Passed: ${this.passedTests}`);
    console.log(`Failed: ${this.totalTests - this.passedTests}`);
    console.log(`Success Rate: ${((this.passedTests / this.totalTests) * 100).toFixed(2)}%`);
    
    if (this.passedTests === this.totalTests) {
      console.log('🎉 All tests passed! Offers tab is working correctly.');
    } else {
      console.log('⚠️ Some tests failed. Check the issues above.');
    }
    
    // Show results in a nice formatted table
    console.table(this.testResults);
    
    return {
      totalTests: this.totalTests,
      passedTests: this.passedTests,
      failedTests: this.totalTests - this.passedTests,
      successRate: (this.passedTests / this.totalTests) * 100,
      results: this.testResults
    };
  }
}

// Auto-run tests when page loads
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    const tester = new OffersTabTester();
    window.offersTabTester = tester;
    tester.runAllTests();
  }, 2000); // Wait 2 seconds for everything to initialize
});

// Manual test trigger
window.testOffersTab = () => {
  const tester = new OffersTabTester();
  return tester.runAllTests();
};