/**
 * Dynamic Role-based access control system
 * Users and roles are managed through Firebase database
 */

import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase';

// Define user roles and their permissions (static)
const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  CASHIER: 'cashier'
};

// Define permissions for each role (static)
const ROLE_PERMISSIONS = {
  [USER_ROLES.SUPER_ADMIN]: [
    'view_dashboard',
    'manage_users',
    'manage_stores',
    'system_settings'
  ],
  [USER_ROLES.ADMIN]: [
    'view_dashboard',
    'manage_inventory',
    'view_inventory',
    'view_reports',
    'manage_barcodes',
    'view_activity',
    'export_data',
    'manage_store_users'
  ],
  [USER_ROLES.CASHIER]: [
    'view_dashboard',
    'manage_billing',
    'view_inventory'
  ]
};

// Cache for user data to avoid repeated database calls
let userCache = new Map();
let cacheExpiry = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get user info from Firebase database
 * @param {string} email - User email
 * @returns {Promise<Object|null>} - User info object or null if not found
 */
const getUserInfoFromDB = async (email) => {
  if (!email) return null;
  
  try {
    // Check cache first
    const now = Date.now();
    if (userCache.has(email.toLowerCase()) && now < cacheExpiry) {
      return userCache.get(email.toLowerCase());
    }
    
    // Query Firebase for user
    const usersRef = collection(db, 'authorized_users');
    const q = query(usersRef, where('email', '==', email.toLowerCase()));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      // Check if it's a hardcoded super admin
      const hardcodedSuperAdmins = {
        'nprakash315349@gmail.com': 'Prakash N',
        'draupathiitsolutions@gmail.com': 'Draupathi IT Solutions',
        'ututhay@gmail.com': 'Ututhay'
      };
      
      if (hardcodedSuperAdmins[email.toLowerCase()]) {
        const superAdminInfo = {
          email: email.toLowerCase(),
          role: USER_ROLES.SUPER_ADMIN,
          storeId: null,
          storeName: 'Company Admin',
          permissions: ROLE_PERMISSIONS[USER_ROLES.SUPER_ADMIN],
          isSuperAdmin: true,
          displayName: 'Super Administrator',
          isActive: true,
          name: hardcodedSuperAdmins[email.toLowerCase()],
          phone: '',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // Cache the result
        userCache.set(email.toLowerCase(), superAdminInfo);
        cacheExpiry = now + CACHE_DURATION;
        
        return superAdminInfo;
      }
      
      return null;
    }
    
    const userData = snapshot.docs[0].data();
    const userInfo = {
      id: snapshot.docs[0].id,
      email: userData.email,
      role: userData.role,
      storeId: userData.storeId,
      storeName: userData.storeName,
      permissions: ROLE_PERMISSIONS[userData.role] || [],
      isSuperAdmin: userData.role === USER_ROLES.SUPER_ADMIN,
      displayName: getRoleDisplayName(userData.role),
      isActive: userData.isActive !== false, // Default to true if not specified
      name: userData.name || email.split('@')[0],
      phone: userData.phone || '',
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt
    };
    
    // Cache the result
    userCache.set(email.toLowerCase(), userInfo);
    cacheExpiry = now + CACHE_DURATION;
    
    return userInfo;
  } catch (error) {
    console.error('Error fetching user info from database:', error);
    return null;
  }
};

/**
 * Add a new user to the database
 * @param {Object} userData - User data
 * @returns {Promise<string>} - Document ID
 */
const addUserToDB = async (userData) => {
  try {
    const usersRef = collection(db, 'authorized_users');
    const docRef = await addDoc(usersRef, {
      ...userData,
      email: userData.email.toLowerCase(),
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    });
    
    // Clear cache to force refresh
    clearUserCache();
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding user to database:', error);
    throw error;
  }
};

/**
 * Update user in the database
 * @param {string} userId - User document ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<void>}
 */
const updateUserInDB = async (userId, updates) => {
  try {
    const userRef = doc(db, 'authorized_users', userId);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: new Date()
    });
    
    // Clear cache to force refresh
    clearUserCache();
  } catch (error) {
    console.error('Error updating user in database:', error);
    throw error;
  }
};

/**
 * Get all users from database
 * @returns {Promise<Array>} - Array of users
 */
const getAllUsersFromDB = async () => {
  try {
    const usersRef = collection(db, 'authorized_users');
    const snapshot = await getDocs(usersRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching all users from database:', error);
    return [];
  }
};

/**
 * Delete user from the database
 * @param {string} userId - User document ID
 * @returns {Promise<void>}
 */
const deleteUserFromDB = async (userId) => {
  try {
    const userRef = doc(db, 'authorized_users', userId);
    await deleteDoc(userRef);
    
    // Clear cache to force refresh
    clearUserCache();
  } catch (error) {
    console.error('Error deleting user from database:', error);
    throw error;
  }
};

/**
 * Subscribe to user changes
 * @param {Function} callback - Callback function
 * @returns {Function} - Unsubscribe function
 */
const subscribeToUsers = (callback) => {
  const usersRef = collection(db, 'authorized_users');
  return onSnapshot(usersRef, (snapshot) => {
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(users);
  });
};

/**
 * Clear user cache
 */
const clearUserCache = () => {
  userCache.clear();
  cacheExpiry = 0;
};

/**
 * Get user role from email (dynamic)
 * @param {string} email - User email
 * @returns {Promise<string|null>} - User role or null if unauthorized
 */
const getUserRole = async (email) => {
  const userInfo = await getUserInfoFromDB(email);
  return userInfo ? userInfo.role : null;
};

/**
 * Get user store ID from email (dynamic)
 * @param {string} email - User email
 * @returns {Promise<string|null>} - Store ID or null if super admin or unauthorized
 */
const getUserStoreId = async (email) => {
  const userInfo = await getUserInfoFromDB(email);
  return userInfo ? userInfo.storeId : null;
};

/**
 * Get user store name from email (dynamic)
 * @param {string} email - User email
 * @returns {Promise<string|null>} - Store name or null if unauthorized
 */
const getUserStoreName = async (email) => {
  const userInfo = await getUserInfoFromDB(email);
  return userInfo ? userInfo.storeName : null;
};

/**
 * Check if user is super admin (dynamic)
 * @param {string} email - User email
 * @returns {Promise<boolean>} - Whether user is super admin
 */
const isSuperAdmin = async (email) => {
  const userInfo = await getUserInfoFromDB(email);
  return userInfo ? userInfo.isSuperAdmin : false;
};

/**
 * Check if user is authorized (dynamic)
 * @param {string} email - User email
 * @returns {Promise<boolean>} - Whether user is authorized
 */
const isUserAuthorized = async (email) => {
  const userInfo = await getUserInfoFromDB(email);
  return userInfo !== null && userInfo.isActive;
};

/**
 * Check if user has specific permission (dynamic)
 * @param {string} email - User email
 * @param {string} permission - Permission to check
 * @returns {Promise<boolean>} - Whether user has permission
 */
const hasPermission = async (email, permission) => {
  const userInfo = await getUserInfoFromDB(email);
  if (!userInfo) return false;
  
  return userInfo.permissions.includes(permission);
};

/**
 * Get role display name
 * @param {string} role - Role key
 * @returns {string} - Display name
 */
const getRoleDisplayName = (role) => {
  const roleNames = {
    [USER_ROLES.SUPER_ADMIN]: 'Super Administrator',
    [USER_ROLES.ADMIN]: 'Administrator',
    [USER_ROLES.CASHIER]: 'Cashier'
  };
  
  return roleNames[role] || 'Unknown Role';
};

/**
 * Initialize default users in database (run once)
 */
const initializeDefaultUsers = async () => {
  try {
    const users = await getAllUsersFromDB();
    if (users.length === 0) {
      console.log('Initializing default users in database...');
      
      // Add default ABC store admin
      await addUserToDB({
        name: 'ABC Store Admin',
        email: 'admin@mystore.com',
        role: USER_ROLES.ADMIN,
        storeId: 'store_001',
        storeName: 'ABC',
        phone: '+91 9876543210'
      });
      
      // Add default ABC store cashier
      await addUserToDB({
        name: 'ABC Store Cashier',
        email: 'cashier@mystore.com',
        role: USER_ROLES.CASHIER,
        storeId: 'store_001',
        storeName: 'ABC',
        phone: '+91 9876543211'
      });
      
      console.log('Default users initialized successfully');
    }
  } catch (error) {
    console.error('Error initializing default users:', error);
  }
};

/**
 * Check if user can access a specific view (dynamic)
 * @param {string} email - User email
 * @param {string} view - View name
 * @returns {Promise<boolean>} - Whether user can access the view
 */
const canAccessView = async (email, view) => {
  const viewPermissions = {
    'dashboard': 'view_dashboard',
    'billing': 'manage_billing',
    'inventory': 'view_inventory',
    'stores': 'manage_stores',
    'users': 'manage_users',
    'store-users': 'manage_store_users',
    'reports': 'view_reports',
    'barcode': 'manage_barcodes',
    'activity': 'view_activity',
    'lowstock': 'view_inventory',
    'settings': 'system_settings'
  };
  
  const requiredPermission = viewPermissions[view];
  if (!requiredPermission) return false;
  
  return await hasPermission(email, requiredPermission);
};

// Export all functions for backward compatibility
export {
  USER_ROLES,
  ROLE_PERMISSIONS,
  getUserInfoFromDB,
  getUserInfoFromDB as getUserInfo,
  addUserToDB,
  updateUserInDB,
  deleteUserFromDB,
  getAllUsersFromDB,
  subscribeToUsers,
  clearUserCache,
  getUserRole,
  getUserStoreId,
  getUserStoreName,
  isSuperAdmin,
  isUserAuthorized,
  hasPermission,
  getRoleDisplayName,
  initializeDefaultUsers,
  canAccessView
};