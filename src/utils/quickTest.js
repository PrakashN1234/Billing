/**
 * Quick test to verify user authentication
 */

// Test function that can be run in browser console
window.testUserAuth = async (email) => {
  try {
    console.log(`🔍 Testing authentication for: ${email}`);
    
    // Import the dynamic role manager
    const { getUserInfoFromDB, isUserAuthorized } = await import('./dynamicRoleManager.js');
    
    // Test 1: Get user info
    console.log('\n1. Getting user info...');
    const userInfo = await getUserInfoFromDB(email);
    console.log('User Info:', userInfo);
    
    // Test 2: Check authorization
    console.log('\n2. Checking authorization...');
    const isAuth = await isUserAuthorized(email);
    console.log('Is Authorized:', isAuth);
    
    // Test 3: Summary
    console.log('\n📋 Summary:');
    if (userInfo && isAuth) {
      console.log(`✅ ${email} is authorized as ${userInfo.displayName}`);
      console.log(`✅ Store Access: ${userInfo.storeName}`);
      console.log(`✅ Permissions: ${userInfo.permissions.join(', ')}`);
    } else {
      console.log(`❌ ${email} is not authorized or not found`);
    }
    
  } catch (error) {
    console.error('❌ Error testing user auth:', error);
  }
};

// Auto-test the praba email
console.log('🚀 Quick test function loaded. Run: testUserAuth("praba182589@gmail.com")');