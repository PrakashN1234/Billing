/**
 * Test script to verify dynamic authentication is working
 */

import { 
  getUserInfoFromDB, 
  isUserAuthorized, 
  addUserToDB, 
  USER_ROLES 
} from './dynamicRoleManager';

/**
 * Test the dynamic authentication system
 */
export const testDynamicAuth = async () => {
  console.log('🧪 Testing Dynamic Authentication System...');
  
  try {
    // Test 1: Check existing super admin
    console.log('\n1. Testing existing super admin...');
    const superAdminInfo = await getUserInfoFromDB('nprakash315349@gmail.com');
    console.log('Super Admin Info:', superAdminInfo);
    
    // Test 2: Check if user is authorized
    console.log('\n2. Testing authorization check...');
    const isAuthorized = await isUserAuthorized('nprakash315349@gmail.com');
    console.log('Is Authorized:', isAuthorized);
    
    // Test 3: Check non-existent user
    console.log('\n3. Testing non-existent user...');
    const nonExistentUser = await getUserInfoFromDB('nonexistent@example.com');
    console.log('Non-existent User:', nonExistentUser);
    
    // Test 4: Add test user to database
    console.log('\n4. Adding test user to database...');
    try {
      const testUserId = await addUserToDB({
        name: 'Test User',
        email: 'test@example.com',
        role: USER_ROLES.CASHIER,
        storeId: 'store_001',
        storeName: 'ABC',
        phone: '+91 9999999999'
      });
      console.log('✅ Test user added with ID:', testUserId);
      
      // Test 5: Verify test user can be retrieved
      console.log('\n5. Verifying test user...');
      const testUserInfo = await getUserInfoFromDB('test@example.com');
      console.log('Test User Info:', testUserInfo);
      
    } catch (error) {
      console.log('⚠️ Test user might already exist:', error.message);
    }
    
    console.log('\n🎉 Dynamic authentication test completed!');
    
  } catch (error) {
    console.error('❌ Error testing dynamic auth:', error);
  }
};

/**
 * Quick test for a specific email
 */
export const testUserEmail = async (email) => {
  console.log(`🔍 Testing email: ${email}`);
  
  try {
    const userInfo = await getUserInfoFromDB(email);
    const isAuth = await isUserAuthorized(email);
    
    console.log('User Info:', userInfo);
    console.log('Is Authorized:', isAuth);
    
    if (userInfo) {
      console.log(`✅ ${email} is a ${userInfo.displayName} with access to ${userInfo.storeName}`);
    } else {
      console.log(`❌ ${email} is not found in the system`);
    }
    
  } catch (error) {
    console.error('❌ Error testing email:', error);
  }
};

// Export for console use
if (typeof window !== 'undefined') {
  window.testDynamicAuth = testDynamicAuth;
  window.testUserEmail = testUserEmail;
}