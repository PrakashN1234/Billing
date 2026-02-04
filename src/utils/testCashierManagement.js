/**
 * Test utility for cashier management features
 * Run in browser console to test the new functionality
 */

import { addUser, updateUser, subscribeToUsers } from '../services/firebaseService';

/**
 * Add sample cashiers for testing
 */
export const addSampleCashiers = async (storeId = 'store_001', storeName = 'ABC') => {
  try {
    console.log('🧪 Adding sample cashiers for testing...');
    
    const sampleCashiers = [
      {
        name: 'John Doe',
        email: 'john.cashier@mystore.com',
        phone: '+91 9876543210',
        role: 'Cashier',
        status: 'Active',
        password: 'cashier123',
        storeId,
        storeName
      },
      {
        name: 'Jane Smith',
        email: 'jane.cashier@mystore.com',
        phone: '+91 9876543211',
        role: 'Cashier',
        status: 'Active',
        password: 'cashier456',
        storeId,
        storeName
      },
      {
        name: 'Mike Johnson',
        email: 'mike.cashier@mystore.com',
        phone: '+91 9876543212',
        role: 'Cashier',
        status: 'Inactive',
        password: 'cashier789',
        storeId,
        storeName
      }
    ];
    
    const results = [];
    for (const cashier of sampleCashiers) {
      try {
        const userId = await addUser(cashier);
        results.push({ success: true, userId, name: cashier.name });
        console.log(`✅ Added cashier: ${cashier.name}`);
      } catch (error) {
        results.push({ success: false, error: error.message, name: cashier.name });
        console.log(`❌ Failed to add cashier: ${cashier.name} - ${error.message}`);
      }
    }
    
    return {
      success: true,
      results,
      message: `Added ${results.filter(r => r.success).length} out of ${sampleCashiers.length} cashiers`
    };
    
  } catch (error) {
    console.error('❌ Error adding sample cashiers:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Test password change functionality
 */
export const testPasswordChange = async (userEmail, newPassword = 'newpassword123') => {
  try {
    console.log('🔐 Testing password change...');
    
    // First, get all users to find the one with matching email
    return new Promise((resolve, reject) => {
      const unsubscribe = subscribeToUsers(
        async (users) => {
          try {
            const user = users.find(u => u.email === userEmail);
            if (!user) {
              reject(new Error(`User with email ${userEmail} not found`));
              return;
            }
            
            await updateUser(user.id, {
              password: newPassword,
              passwordChangedAt: new Date().toISOString(),
              passwordChangedBy: 'test@admin.com'
            });
            
            console.log(`✅ Password changed for ${user.name}`);
            unsubscribe();
            resolve({
              success: true,
              userId: user.id,
              userName: user.name,
              message: 'Password changed successfully'
            });
          } catch (error) {
            console.error('❌ Error changing password:', error);
            unsubscribe();
            reject(error);
          }
        },
        (error) => {
          console.error('❌ Error subscribing to users:', error);
          reject(error);
        }
      );
    });
    
  } catch (error) {
    console.error('❌ Error testing password change:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Test account enable/disable functionality
 */
export const testAccountToggle = async (userEmail) => {
  try {
    console.log('🔄 Testing account toggle...');
    
    return new Promise((resolve, reject) => {
      const unsubscribe = subscribeToUsers(
        async (users) => {
          try {
            const user = users.find(u => u.email === userEmail);
            if (!user) {
              reject(new Error(`User with email ${userEmail} not found`));
              return;
            }
            
            const currentStatus = user.status || 'Active';
            const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
            
            await updateUser(user.id, { status: newStatus });
            
            console.log(`✅ Account status changed for ${user.name}: ${currentStatus} → ${newStatus}`);
            unsubscribe();
            resolve({
              success: true,
              userId: user.id,
              userName: user.name,
              oldStatus: currentStatus,
              newStatus,
              message: `Account ${newStatus.toLowerCase()} successfully`
            });
          } catch (error) {
            console.error('❌ Error toggling account status:', error);
            unsubscribe();
            reject(error);
          }
        },
        (error) => {
          console.error('❌ Error subscribing to users:', error);
          reject(error);
        }
      );
    });
    
  } catch (error) {
    console.error('❌ Error testing account toggle:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get cashier statistics for a store
 */
export const getCashierStats = async (storeId = 'store_001') => {
  try {
    console.log('📊 Getting cashier statistics...');
    
    return new Promise((resolve, reject) => {
      const unsubscribe = subscribeToUsers(
        (users) => {
          try {
            // Filter users for the specific store
            const storeUsers = users.filter(user => 
              user.storeId === storeId || 
              (user.email && user.email.includes('@mystore.com'))
            );
            
            // Filter cashiers
            const cashiers = storeUsers.filter(user => 
              user.role && user.role.toLowerCase() === 'cashier'
            );
            
            const activeCashiers = cashiers.filter(user => 
              user.status && user.status.toLowerCase() === 'active'
            );
            
            const inactiveCashiers = cashiers.filter(user => 
              user.status && user.status.toLowerCase() === 'inactive'
            );
            
            const stats = {
              totalUsers: storeUsers.length,
              totalCashiers: cashiers.length,
              activeCashiers: activeCashiers.length,
              inactiveCashiers: inactiveCashiers.length,
              cashierList: cashiers.map(c => ({
                name: c.name,
                email: c.email,
                status: c.status,
                role: c.role
              }))
            };
            
            console.log('📈 Cashier Statistics:', stats);
            unsubscribe();
            resolve(stats);
          } catch (error) {
            console.error('❌ Error calculating stats:', error);
            unsubscribe();
            reject(error);
          }
        },
        (error) => {
          console.error('❌ Error subscribing to users:', error);
          reject(error);
        }
      );
    });
    
  } catch (error) {
    console.error('❌ Error getting cashier stats:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Run all tests
 */
export const runAllTests = async (storeId = 'store_001', storeName = 'ABC') => {
  try {
    console.log('🚀 Running all cashier management tests...');
    
    // 1. Add sample cashiers
    console.log('\n1. Adding sample cashiers...');
    const addResult = await addSampleCashiers(storeId, storeName);
    console.log('Add Result:', addResult);
    
    // Wait a bit for data to sync
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 2. Get statistics
    console.log('\n2. Getting cashier statistics...');
    const stats = await getCashierStats(storeId);
    console.log('Statistics:', stats);
    
    // 3. Test password change (if we have cashiers)
    if (stats.cashierList && stats.cashierList.length > 0) {
      console.log('\n3. Testing password change...');
      const firstCashier = stats.cashierList[0];
      const passwordResult = await testPasswordChange(firstCashier.email);
      console.log('Password Change Result:', passwordResult);
      
      // 4. Test account toggle
      console.log('\n4. Testing account toggle...');
      const toggleResult = await testAccountToggle(firstCashier.email);
      console.log('Account Toggle Result:', toggleResult);
    }
    
    console.log('\n🎉 All tests completed!');
    return {
      success: true,
      message: 'All cashier management tests completed successfully'
    };
    
  } catch (error) {
    console.error('❌ Error running tests:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Export for console use
if (typeof window !== 'undefined') {
  window.addSampleCashiers = addSampleCashiers;
  window.testPasswordChange = testPasswordChange;
  window.testAccountToggle = testAccountToggle;
  window.getCashierStats = getCashierStats;
  window.runAllTests = runAllTests;
}

export {
  addSampleCashiers,
  testPasswordChange,
  testAccountToggle,
  getCashierStats,
  runAllTests
};