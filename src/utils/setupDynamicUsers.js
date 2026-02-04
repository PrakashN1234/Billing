/**
 * Setup script for dynamic user management system
 * Run this once to initialize the authorized_users collection in Firebase
 */

import { initializeDefaultUsers, addUserToDB, USER_ROLES } from './dynamicRoleManager';

/**
 * Initialize the complete user system with all stores and users
 */
export const setupCompleteUserSystem = async () => {
  try {
    console.log('🚀 Setting up complete user management system...');
    
    // Initialize default users first
    await initializeDefaultUsers();
    
    // Add additional store users
    const additionalUsers = [
      // XYZ Store Users
      {
        name: 'XYZ Store Admin',
        email: 'admin@branch1.com',
        role: USER_ROLES.ADMIN,
        storeId: 'store_002',
        storeName: 'XYZ Store',
        phone: '+91 9876543220'
      },
      {
        name: 'XYZ Store Manager',
        email: 'manager@branch1.com',
        role: USER_ROLES.ADMIN,
        storeId: 'store_002',
        storeName: 'XYZ Store',
        phone: '+91 9876543221'
      },
      {
        name: 'XYZ Store Cashier',
        email: 'cashier@xyzstore.com',
        role: USER_ROLES.CASHIER,
        storeId: 'store_002',
        storeName: 'XYZ Store',
        phone: '+91 9876543222'
      },
      {
        name: 'XYZ Store Cashier 2',
        email: 'cashier1@xyzstore.com',
        role: USER_ROLES.CASHIER,
        storeId: 'store_002',
        storeName: 'XYZ Store',
        phone: '+91 9876543223'
      },
      
      // PQR Store Users
      {
        name: 'PQR Store Admin',
        email: 'admin@branch2.com',
        role: USER_ROLES.ADMIN,
        storeId: 'store_003',
        storeName: 'PQR Store',
        phone: '+91 9876543230'
      },
      {
        name: 'PQR Store Manager',
        email: 'manager@branch2.com',
        role: USER_ROLES.ADMIN,
        storeId: 'store_003',
        storeName: 'PQR Store',
        phone: '+91 9876543231'
      },
      {
        name: 'PQR Store Cashier',
        email: 'cashier@pqrstore.com',
        role: USER_ROLES.CASHIER,
        storeId: 'store_003',
        storeName: 'PQR Store',
        phone: '+91 9876543232'
      },
      {
        name: 'PQR Store Cashier 2',
        email: 'cashier1@pqrstore.com',
        role: USER_ROLES.CASHIER,
        storeId: 'store_003',
        storeName: 'PQR Store',
        phone: '+91 9876543233'
      }
    ];
    
    // Add all additional users
    for (const user of additionalUsers) {
      try {
        await addUserToDB(user);
        console.log(`✅ Added user: ${user.email}`);
      } catch (error) {
        console.log(`⚠️ User ${user.email} might already exist, skipping...`);
      }
    }
    
    console.log('🎉 Complete user system setup finished!');
    return {
      success: true,
      message: 'All users and stores have been set up successfully'
    };
    
  } catch (error) {
    console.error('❌ Error setting up user system:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * Test function to verify the user system is working
 */
export const testUserSystem = async () => {
  try {
    console.log('🧪 Testing user management system...');
    
    const { getUserInfoFromDB } = await import('./dynamicRoleManager');
    
    // Test users
    const testEmails = [
      'admin@mystore.com',
      'cashier@mystore.com',
      'admin@branch1.com',
      'cashier@xyzstore.com',
      'nprakash315349@gmail.com' // Super admin
    ];
    
    for (const email of testEmails) {
      const userInfo = await getUserInfoFromDB(email);
      if (userInfo) {
        console.log(`✅ ${email}: ${userInfo.role} at ${userInfo.storeName}`);
      } else {
        console.log(`❌ ${email}: Not found`);
      }
    }
    
    console.log('🎉 User system test completed!');
    
  } catch (error) {
    console.error('❌ Error testing user system:', error);
  }
};

// Export for use in console
if (typeof window !== 'undefined') {
  window.setupCompleteUserSystem = setupCompleteUserSystem;
  window.testUserSystem = testUserSystem;
}