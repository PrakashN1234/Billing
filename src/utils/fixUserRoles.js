/**
 * Utility to fix user roles in the database
 * This will update users with "USER" role to "Cashier" role
 */

import { subscribeToUsers, updateUser } from '../services/firebaseService';

/**
 * Fix user roles - convert "USER" to "Cashier" for non-admin users
 */
export const fixUserRoles = async (storeId = 'store_001') => {
  try {
    console.log('🔧 Fixing user roles...');
    
    return new Promise((resolve, reject) => {
      const unsubscribe = subscribeToUsers(
        async (users) => {
          try {
            // Filter users for the specific store
            const storeUsers = users.filter(user => 
              user.storeId === storeId || 
              (user.email && user.email.includes('@mystore.com'))
            );
            
            console.log('👥 Found store users:', storeUsers);
            
            // Find users with "USER" role that should be cashiers
            const usersToFix = storeUsers.filter(user => {
              const role = user.role ? user.role.toLowerCase() : '';
              const email = user.email ? user.email.toLowerCase() : '';
              
              // If role is "user" and email suggests they're a cashier
              return (role === 'user' || role === '') && 
                     (email.includes('cashier') || 
                      !email.includes('admin') && 
                      !email.includes('manager'));
            });
            
            console.log('🔄 Users to fix:', usersToFix);
            
            if (usersToFix.length === 0) {
              console.log('✅ No users need role fixing');
              unsubscribe();
              resolve({
                success: true,
                fixed: 0,
                message: 'No users needed role fixing'
              });
              return;
            }
            
            // Update each user's role
            const results = [];
            for (const user of usersToFix) {
              try {
                await updateUser(user.id, {
                  role: 'Cashier',
                  updatedAt: new Date().toISOString(),
                  roleFixedAt: new Date().toISOString()
                });
                
                results.push({
                  success: true,
                  userId: user.id,
                  name: user.name,
                  email: user.email,
                  oldRole: user.role,
                  newRole: 'Cashier'
                });
                
                console.log(`✅ Fixed role for ${user.name || user.email}: ${user.role} → Cashier`);
              } catch (error) {
                results.push({
                  success: false,
                  userId: user.id,
                  name: user.name,
                  email: user.email,
                  error: error.message
                });
                
                console.error(`❌ Failed to fix role for ${user.name || user.email}:`, error);
              }
            }
            
            const successCount = results.filter(r => r.success).length;
            
            unsubscribe();
            resolve({
              success: true,
              fixed: successCount,
              total: usersToFix.length,
              results,
              message: `Fixed ${successCount} out of ${usersToFix.length} user roles`
            });
            
          } catch (error) {
            console.error('❌ Error processing users:', error);
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
    console.error('❌ Error fixing user roles:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Set specific user role
 */
export const setUserRole = async (userEmail, newRole = 'Cashier') => {
  try {
    console.log(`🔧 Setting role for ${userEmail} to ${newRole}...`);
    
    return new Promise((resolve, reject) => {
      const unsubscribe = subscribeToUsers(
        async (users) => {
          try {
            const user = users.find(u => u.email && u.email.toLowerCase() === userEmail.toLowerCase());
            
            if (!user) {
              unsubscribe();
              reject(new Error(`User with email ${userEmail} not found`));
              return;
            }
            
            await updateUser(user.id, {
              role: newRole,
              updatedAt: new Date().toISOString(),
              roleUpdatedAt: new Date().toISOString()
            });
            
            console.log(`✅ Role updated for ${user.name || user.email}: ${user.role} → ${newRole}`);
            
            unsubscribe();
            resolve({
              success: true,
              userId: user.id,
              userName: user.name,
              userEmail: user.email,
              oldRole: user.role,
              newRole,
              message: `Role updated successfully`
            });
            
          } catch (error) {
            console.error('❌ Error updating user role:', error);
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
    console.error('❌ Error setting user role:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Check current user roles
 */
export const checkUserRoles = async (storeId = 'store_001') => {
  try {
    console.log('🔍 Checking current user roles...');
    
    return new Promise((resolve, reject) => {
      const unsubscribe = subscribeToUsers(
        (users) => {
          try {
            // Filter users for the specific store
            const storeUsers = users.filter(user => 
              user.storeId === storeId || 
              (user.email && user.email.includes('@mystore.com'))
            );
            
            const roleStats = {};
            storeUsers.forEach(user => {
              const role = user.role || 'undefined';
              roleStats[role] = (roleStats[role] || 0) + 1;
            });
            
            const userDetails = storeUsers.map(user => ({
              name: user.name,
              email: user.email,
              role: user.role,
              status: user.status
            }));
            
            console.log('📊 Role Statistics:', roleStats);
            console.log('👥 User Details:', userDetails);
            
            unsubscribe();
            resolve({
              success: true,
              totalUsers: storeUsers.length,
              roleStats,
              userDetails,
              message: `Found ${storeUsers.length} users in store`
            });
            
          } catch (error) {
            console.error('❌ Error checking roles:', error);
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
    console.error('❌ Error checking user roles:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Export for console use
if (typeof window !== 'undefined') {
  window.fixUserRoles = fixUserRoles;
  window.setUserRole = setUserRole;
  window.checkUserRoles = checkUserRoles;
}

export {
  fixUserRoles,
  setUserRole,
  checkUserRoles
};