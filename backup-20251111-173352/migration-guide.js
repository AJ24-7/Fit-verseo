// ============================================
// AUTOMATED BASE_URL MIGRATION SCRIPT
// Updates all frontend files to use centralized config
// ============================================

/**
 * USAGE:
 * 1. Ensure config.js is included in all HTML files: <script src="/config.js"></script>
 * 2. Run this in browser console on any page
 * 3. Or integrate into build process
 * 
 * This script provides patterns to search and replace across files
 */

const MIGRATION_PATTERNS = {
    // Pattern 1: Constructor with hardcoded BASE_URL
    pattern1: {
        search: /this\.BASE_URL\s*=\s*['"]http:\/\/localhost:5000['"]/g,
        replace: `this.BASE_URL = window.API_CONFIG.BASE_URL`,
        description: 'Replace hardcoded localhost in constructors'
    },
    
    // Pattern 2: Const BASE_URL declaration
    pattern2: {
        search: /const\s+BASE_URL\s*=\s*['"]http:\/\/localhost:5000['"]/g,
        replace: `const BASE_URL = window.API_CONFIG.BASE_URL`,
        description: 'Replace const BASE_URL declarations'
    },
    
    // Pattern 3: Let/Var BASE_URL declaration
    pattern3: {
        search: /(let|var)\s+BASE_URL\s*=\s*['"]http:\/\/localhost:5000['"]/g,
        replace: `$1 BASE_URL = window.API_CONFIG.BASE_URL`,
        description: 'Replace let/var BASE_URL declarations'
    },
    
    // Pattern 4: Direct fetch with localhost
    pattern4: {
        search: /fetch\s*\(\s*['"]http:\/\/localhost:5000/g,
        replace: `fetch(window.API_CONFIG.BASE_URL + '`,
        description: 'Replace direct fetch calls (MANUAL CHECK NEEDED for closing quote/parenthesis)'
    },
    
    // Pattern 5: Template literals with localhost
    pattern5: {
        search: /`http:\/\/localhost:5000/g,
        replace: '`${window.API_CONFIG.BASE_URL}',
        description: 'Replace template literal BASE_URLs'
    }
};

/**
 * FILES THAT NEED UPDATING (from grep search results)
 * Copy this list and update files manually or use find/replace
 */
const FILES_TO_UPDATE = [
    // Gym Admin Modules
    'frontend/gymadmin/modules/support-reviews.js',
    'frontend/gymadmin/modules/grievance-handler.js',
    'frontend/gymadmin/modules/communication-panel.js',
    'frontend/gymadmin/modules/dashboard.js',
    'frontend/gymadmin/modules/members.js',
    'frontend/gymadmin/modules/reviews.js',
    'frontend/gymadmin/modules/trainers.js',
    
    // Admin Files
    'frontend/admin/admin-login.js',
    'frontend/admin/admin-profile.js',
    'frontend/admin/admin-notification-system.js',
    'frontend/admin/admin-dashboard.js',
    'frontend/admin/admin-auth-guard.js',
    
    // Public Pages
    'frontend/contact.js',
    'frontend/dietplans.js',
    'frontend/coupon-integration.js',
    'frontend/script.js',
    'frontend/gymdetails.js',
    'frontend/personaltraining.js',
    'frontend/membership-plans.js',
    'frontend/edit-profile.js',
    'frontend/settings.js',
    
    // Other modules
    'frontend/modules/auth.js',
    'frontend/modules/booking.js',
    'frontend/modules/notifications.js',
    'frontend/modules/reviews.js',
    
    // Trainer
    'frontend/Trainer/trainer-login.js',
    'frontend/Trainer/trainer-dashboard.js',
    
    // Public modules
    'frontend/public/userprofile.js',
    'frontend/public/subscription-management.js'
];

/**
 * MANUAL REPLACEMENT GUIDE
 * Use your IDE's find and replace feature:
 */
console.log('=== MIGRATION GUIDE ===\n');
console.log('📋 Files to update:', FILES_TO_UPDATE.length);
console.log('\n🔍 Find and Replace Patterns:\n');

Object.entries(MIGRATION_PATTERNS).forEach(([key, pattern]) => {
    console.log(`\n${key}:`);
    console.log(`  Description: ${pattern.description}`);
    console.log(`  Find (Regex): ${pattern.search}`);
    console.log(`  Replace: ${pattern.replace}`);
});

console.log('\n\n📝 STEP-BY-STEP INSTRUCTIONS:\n');
console.log('1. Open VS Code');
console.log('2. Press Ctrl+Shift+H (Find and Replace in Files)');
console.log('3. Click regex button (.*)');
console.log('4. Scope to: frontend/**/*.js');
console.log('5. For each pattern above:');
console.log('   - Enter Find pattern');
console.log('   - Enter Replace pattern');
console.log('   - Click "Replace All"');
console.log('6. Review changes before committing\n');

console.log('⚠️ IMPORTANT NOTES:\n');
console.log('- Always include config.js in HTML files BEFORE other scripts');
console.log('- Test thoroughly after migration');
console.log('- Some files may need manual adjustment');
console.log('- Check browser console for errors');
console.log('- Verify API calls go to correct backend URL\n');

/**
 * HTML FILES THAT NEED config.js INCLUDED
 */
const HTML_FILES_NEEDING_CONFIG = [
    'frontend/index.html', // ✅ Already updated
    'frontend/admin/admin-dashboard.html',
    'frontend/admin/admin-login.html',
    'frontend/gymadmin/gym-admin-dashboard.html',
    'frontend/gymadmin/gym-admin-login.html',
    'frontend/gymdetails.html',
    'frontend/contact.html',
    'frontend/dietplans.html',
    'frontend/personaltraining.html',
    'frontend/membership-plans.html',
    'frontend/edit-profile.html',
    'frontend/settings.html',
    'frontend/payment-gateway.html',
    'frontend/registration-complete.html',
    'frontend/Trainer/trainer-login.html',
    'frontend/Trainer/trainer-dashboard.html',
    'frontend/public/userprofile.html',
    'frontend/public/subscription-management.html'
];

console.log('📄 HTML Files needing <script src="config.js"></script>:\n');
HTML_FILES_NEEDING_CONFIG.forEach((file, index) => {
    const status = file.includes('index.html') ? '✅' : '⬜';
    console.log(`${status} ${index + 1}. ${file}`);
});

console.log('\n\n🎯 RECOMMENDED APPROACH:\n');
console.log('Method 1: VS Code Find & Replace (Recommended)');
console.log('  - Fast for bulk updates');
console.log('  - Can preview all changes');
console.log('  - Undo if needed');
console.log('\nMethod 2: Manual File-by-File');
console.log('  - More control');
console.log('  - Better for understanding code');
console.log('  - Time consuming');

/**
 * Test function to verify config is loaded
 */
function testConfigLoaded() {
    if (typeof window.API_CONFIG === 'undefined') {
        console.error('❌ config.js not loaded!');
        console.log('Add <script src="config.js"></script> to HTML');
        return false;
    }
    
    console.log('✅ config.js loaded successfully');
    console.log('Environment:', window.API_CONFIG.ENVIRONMENT);
    console.log('Base URL:', window.API_CONFIG.BASE_URL);
    console.log('Is Production:', window.API_CONFIG.IS_PRODUCTION);
    return true;
}

// Export for use
if (typeof window !== 'undefined') {
    window.testConfigLoaded = testConfigLoaded;
    window.MIGRATION_PATTERNS = MIGRATION_PATTERNS;
    window.FILES_TO_UPDATE = FILES_TO_UPDATE;
}

console.log('\n\n🧪 TEST CONFIG:');
console.log('Run: testConfigLoaded()');
console.log('\n💡 TIP: After migration, search codebase for "localhost:5000" to find any missed instances\n');
