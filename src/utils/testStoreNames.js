/**
 * Test script to verify store names are working correctly
 */

import { getUserInfo, getUserStoreName } from './roleManager';

// Test function to verify store names
export const testStoreNames = () => {
  console.log('🧪 Testing Store Names...');
  
  // Test ABC Store
  const abcAdmin = getUserInfo('admin@mystore.com');
  console.log('ABC Store Admin:', abcAdmin);
  console.log('ABC Store Name:', getUserStoreName('admin@mystore.com'));
  
  // Test XYZ Store
  const xyzAdmin = getUserInfo('admin@branch1.com');
  console.log('XYZ Store Admin:', xyzAdmin);
  console.log('XYZ Store Name:', getUserStoreName('admin@branch1.com'));
  
  // Test PQR Store
  const pqrAdmin = getUserInfo('admin@branch2.com');
  console.log('PQR Store Admin:', pqrAdmin);
  console.log('PQR Store Name:', getUserStoreName('admin@branch2.com'));
  
  // Verify expected results
  const tests = [
    { email: 'admin@mystore.com', expectedStore: 'ABC' },
    { email: 'admin@branch1.com', expectedStore: 'XYZ Store' },
    { email: 'admin@branch2.com', expectedStore: 'PQR Store' }
  ];
  
  tests.forEach(test => {
    const actualStore = getUserStoreName(test.email);
    const passed = actualStore === test.expectedStore;
    console.log(`✅ ${test.email}: ${passed ? 'PASS' : 'FAIL'} (Expected: ${test.expectedStore}, Got: ${actualStore})`);
  });
  
  console.log('🎉 Store name testing complete!');
};

// Export for use in console
if (typeof window !== 'undefined') {
  window.testStoreNames = testStoreNames;
}