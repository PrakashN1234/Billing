/**
 * Utility to clean up users from deleted stores
 */

import { subscribeToUsers, deleteUser } from '../services/firebaseService';
import { getStores } from '../services/firebaseService';

/**
 * Find and remove users from deleted stores
 */
export const cleanupOrphanedUsers = async () => {
  try {
    console.log('🧹 Cleaning up orphaned users...');
    
    // Get current stores
    const stores = await getStores();
    const activeStoreIds = stores.map(store => store.id);
    
    console.log('📍 Active stores:', activeStoreIds);
    
    return new Promise((resolve, reject) => {
      const unsubscribe = subscribeToUsers(
        async (users) => {
          try {
            // Find users with store IDs that no longer exist
            const orphanedUsers = users.filter(user => {
              // Skip super admins (they don't have specific store assignments)
              if (user.role === 'super_admin' || !user.storeId) {
                return false;
              }
              
              // Check if user's store still exists
              return !activeStoreIds.includes(user.storeId);
            });
            
            console.log('👻 Found orphaned users:', orphanedUsers);
            
            if (orphanedUsers.length === 0) {
              console.log('✅ No orphaned users found');
              unsubscribe();
              resolve({
                success: true,
                cleaned: 0,
                message: 'No orphaned users found'
              });
              return;
            }
            
            // Ask for confirmation
            const userList = orphanedUsers.map(u => `${u.name || u.email} (${u.storeId})`).join('\n');
            const confirmed = window.confirm(
              `Found ${orphanedUsers.length} users from deleted stores:\n\n${userList}\n\nDelete these users?`
            );
            
            if (!confirmed) {
              unsubscribe();
              resolve({
                success: false,
                cleaned: 0,
                message: 'Cleanup cancelled by user'
              });
              return;
            }
            
            // Delete orphaned users
            const results = [];
            for (const user of orphanedUsers) {
              try {
                await deleteUser(user.id);
                results.push({
                  success: true,
                  user: user.name || user.email,
                  storeId: user.storeId
                });
                console.log(`✅ Deleted user: ${user.name || user.email}`);
              } catch (error) {
                results.push({
                  success: false,
                  user: user.name || user.email,
                  error: error.message
                });
                console.error(`❌ Failed to delete user: ${user.name || user.email}`, error);
              }
            }
            
            const successCount = results.filter(r => r.success).length;
            
            unsubscribe();
            resolve({
              success: true,
              cleaned: successCount,
              total: orphanedUsers.length,
              results,
              message: `Cleaned up ${successCount} out of ${orphanedUsers.length} orphaned users`
            });
            
          } catch (error) {
            console.error('❌ Error during cleanup:', error);
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
    console.error('❌ Error cleaning up orphaned users:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Remove specific user by email
 */
export const removeUserByEmail = async (email) => {
  try {
    console.log(`🗑️ Removing user: ${email}`);
    
    return new Promise((resolve, reject) => {
      const unsubscribe = subscribeToUsers(
        async (users) => {
          try {
            const user = users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
            
            if (!user) {
              unsubscribe();
              resolve({
                success: false,
                message: `User with email ${email} not found`
              });
              return;
            }
            
            // Confirm deletion
            const confirmed = window.confirm(
              `Delete user ${user.name || user.email}?\n\nStore: ${user.storeName || user.storeId || 'N/A'}\nRole: ${user.role || 'Unknown'}`
            );
            
            if (!confirmed) {
              unsubscribe();
              resolve({
                success: false,
                message: 'Deletion cancelled by user'
              });
              return;
            }
            
            await deleteUser(user.id);
            
            console.log(`✅ User deleted: ${user.name || user.email}`);
            unsubscribe();
            resolve({
              success: true,
              user: user.name || user.email,
              message: 'User deleted successfully'
            });
            
          } catch (error) {
            console.error('❌ Error deleting user:', error);
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
    console.error('❌ Error removing user by email:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Export for console use
if (typeof window !== 'undefined') {
  window.cleanupOrphanedUsers = cleanupOrphanedUsers;
  window.removeUserByEmail = removeUserByEmail;
}

export {
  cleanupOrphanedUsers,
  removeUserByEmail
};