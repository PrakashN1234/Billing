/**
 * Role-based access control system
 */

// Define user roles and their permissions
export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  CASHIER: 'cashier'
};

// Define permissions for each role
export const ROLE_PERMISSIONS = {
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
    'manage_store_users' // New permission for managing users in their store
  ],
  [USER_ROLES.CASHIER]: [
    'view_dashboard',
    'manage_billing',
    'view_inventory'
  ]
};

// Authorized email addresses with their roles and store assignments
export const AUTHORIZED_USERS = {
  // Super Admin (Company Level - Access to all stores)
  'nprakash315349@gmail.com': { 
    role: USER_ROLES.SUPER_ADMIN, 
    storeId: null, // null means access to all stores
    storeName: 'Company Admin'
  },
  'draupathiitsolutions@gmail.com': { 
    role: USER_ROLES.SUPER_ADMIN, 
    storeId: null, // null means access to all stores
    storeName: 'Company Admin'
  },
 
  'ututhay@gmail.com': { 
    role: USER_ROLES.SUPER_ADMIN, 
    storeId: null, // null means access to all stores
    storeName: 'Company Admin'
  },
  
  
  // Store Admins (Store Level - Access to specific store only)
  'admin@mystore.com': { 
    role: USER_ROLES.ADMIN, 
    storeId: 'store_001', 
    storeName: 'Main Store'
  },
  'manager@mystore.com': { 
    role: USER_ROLES.ADMIN, 
    storeId: 'store_001', 
    storeName: 'Main Store'
  },
  
  // Cashiers (Store Level - Access to specific store only)
  'cashier@mystore.com': { 
    role: USER_ROLES.CASHIER, 
    storeId: 'store_001', 
    storeName: 'Main Store'
  },
  
};

/**
 * Get user role from email
 * @param {string} email - User email
 * @returns {string|null} - User role or null if unauthorized
 */
export const getUserRole = (email) => {
  if (!email) return null;
  const user = AUTHORIZED_USERS[email.toLowerCase()];
  return user ? user.role : null;
};

/**
 * Get user store ID from email
 * @param {string} email - User email
 * @returns {string|null} - Store ID or null if super admin or unauthorized
 */
export const getUserStoreId = (email) => {
  if (!email) return null;
  const user = AUTHORIZED_USERS[email.toLowerCase()];
  return user ? user.storeId : null;
};

/**
 * Get user store name from email
 * @param {string} email - User email
 * @returns {string|null} - Store name or null if unauthorized
 */
export const getUserStoreName = (email) => {
  if (!email) return null;
  const user = AUTHORIZED_USERS[email.toLowerCase()];
  return user ? user.storeName : null;
};

/**
 * Check if user is super admin (has access to all stores)
 * @param {string} email - User email
 * @returns {boolean} - Whether user is super admin
 */
export const isSuperAdmin = (email) => {
  const role = getUserRole(email);
  return role === USER_ROLES.SUPER_ADMIN;
};

/**
 * Check if user can access specific store data
 * @param {string} email - User email
 * @param {string} storeId - Store ID to check access for
 * @returns {boolean} - Whether user can access the store
 */
export const canAccessStore = (email, storeId) => {
  if (isSuperAdmin(email)) return true; // Super admin can access all stores
  
  const userStoreId = getUserStoreId(email);
  return userStoreId === storeId;
};

/**
 * Get accessible store IDs for user
 * @param {string} email - User email
 * @returns {Array|null} - Array of store IDs or null for super admin (all stores)
 */
export const getAccessibleStoreIds = (email) => {
  if (isSuperAdmin(email)) return null; // null means all stores
  
  const userStoreId = getUserStoreId(email);
  return userStoreId ? [userStoreId] : [];
};

/**
 * Check if user is authorized
 * @param {string} email - User email
 * @returns {boolean} - Whether user is authorized
 */
export const isUserAuthorized = (email) => {
  return getUserRole(email) !== null;
};

/**
 * Get user info including role, store, and permissions
 * @param {string} email - User email
 * @returns {Object|null} - User info object or null if unauthorized
 */
export const getUserInfo = (email) => {
  if (!email) return null;
  const user = AUTHORIZED_USERS[email.toLowerCase()];
  if (!user) return null;
  
  return {
    email: email.toLowerCase(),
    role: user.role,
    storeId: user.storeId,
    storeName: user.storeName,
    permissions: ROLE_PERMISSIONS[user.role] || [],
    isSuperAdmin: user.role === USER_ROLES.SUPER_ADMIN,
    displayName: getRoleDisplayName(user.role)
  };
};

/**
 * Check if user has specific permission
 * @param {string} email - User email
 * @param {string} permission - Permission to check
 * @returns {boolean} - Whether user has permission
 */
export const hasPermission = (email, permission) => {
  const role = getUserRole(email);
  if (!role) return false;
  
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
};

/**
 * Get all permissions for a user
 * @param {string} email - User email
 * @returns {Array} - Array of permissions
 */
export const getUserPermissions = (email) => {
  const role = getUserRole(email);
  if (!role) return [];
  
  return ROLE_PERMISSIONS[role] || [];
};

/**
 * Get role display name
 * @param {string} role - Role key
 * @returns {string} - Display name
 */
export const getRoleDisplayName = (role) => {
  const roleNames = {
    [USER_ROLES.SUPER_ADMIN]: 'Super Administrator',
    [USER_ROLES.ADMIN]: 'Administrator',
    [USER_ROLES.CASHIER]: 'Cashier'
  };
  
  return roleNames[role] || 'Unknown Role';
};

/**
 * Get dashboard stats based on user role
 * @param {string} email - User email
 * @param {Object} allStats - All available stats
 * @returns {Object} - Filtered stats based on role
 */
export const getFilteredStats = (email, allStats) => {
  const permissions = getUserPermissions(email);
  const filteredStats = {};
  
  if (permissions.includes('manage_stores')) {
    filteredStats.totalStores = allStats.totalStores;
  }
  
  if (permissions.includes('manage_inventory')) {
    filteredStats.totalProducts = allStats.totalProducts;
    filteredStats.productsWithCodes = allStats.productsWithCodes;
    filteredStats.productsWithBarcodes = allStats.productsWithBarcodes;
  }
  
  if (permissions.includes('view_reports')) {
    filteredStats.totalSales = allStats.totalSales;
    filteredStats.totalBills = allStats.totalBills;
  }
  
  return filteredStats;
};

/**
 * Get quick actions based on user role
 * @param {string} email - User email
 * @returns {Array} - Array of quick actions
 */
export const getQuickActions = (email) => {
  const permissions = getUserPermissions(email);
  const allActions = [
    { id: 'bill', label: 'New Bill', permission: 'manage_billing', color: 'orange', icon: 'CreditCard' },
    { id: 'product', label: 'Add Product', permission: 'manage_inventory', color: 'green', icon: 'Plus' },
    { id: 'store', label: 'Add Store', permission: 'manage_stores', color: 'blue', icon: 'Store' },
    { id: 'user', label: 'Add User', permission: 'manage_users', color: 'purple', icon: 'Users' },
    { id: 'barcode', label: 'Manage Barcodes', permission: 'manage_barcodes', color: 'teal', icon: 'QrCode' },
    { id: 'reports', label: 'View Reports', permission: 'view_reports', color: 'indigo', icon: 'BarChart3' }
  ];
  
  return allActions.filter(action => permissions.includes(action.permission));
};

/**
 * Check if user can access a specific view
 * @param {string} email - User email
 * @param {string} view - View name
 * @returns {boolean} - Whether user can access the view
 */
export const canAccessView = (email, view) => {
  const viewPermissions = {
    'dashboard': 'view_dashboard',
    'billing': 'manage_billing',
    'inventory': 'view_inventory', // Changed from 'manage_inventory' to 'view_inventory'
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
  
  return hasPermission(email, requiredPermission);
};

/**
 * Get welcome message based on user role and store
 * @param {string} email - User email
 * @returns {string} - Welcome message
 */
export const getWelcomeMessage = (email) => {
  const userInfo = getUserInfo(email);
  if (!userInfo) return 'Welcome!';
  
  const name = email.split('@')[0];
  
  const messages = {
    [USER_ROLES.SUPER_ADMIN]: `Welcome back, ${name}! You have full system access across all stores.`,
    [USER_ROLES.ADMIN]: `Welcome back, ${name}! Managing ${userInfo.storeName} efficiently.`,
    [USER_ROLES.CASHIER]: `Welcome, ${name}! Ready to serve customers at ${userInfo.storeName}.`
  };
  
  return messages[userInfo.role] || `Welcome, ${name}!`;
};

/**
 * Filter data based on user's store access
 * @param {string} email - User email
 * @param {Array} data - Array of data items with storeId property
 * @returns {Array} - Filtered data based on user's store access
 */
export const filterDataByStoreAccess = (email, data) => {
  if (isSuperAdmin(email)) return data; // Super admin sees all data
  
  const userStoreId = getUserStoreId(email);
  if (!userStoreId) return []; // No store access
  
  return data.filter(item => item.storeId === userStoreId);
};

/**
 * Check if user can manage other users
 * @param {string} email - User email
 * @returns {boolean} - Whether user can manage users
 */
export const canManageUsers = (email) => {
  return isSuperAdmin(email); // Only super admin can manage users
};

/**
 * Check if user can create stores
 * @param {string} email - User email
 * @returns {boolean} - Whether user can create stores
 */
export const canCreateStores = (email) => {
  return isSuperAdmin(email); // Only super admin can create stores
};

/**
 * Get navigation items with store context
 * @param {string} email - User email
 * @returns {Array} - Array of navigation items
 */
export const getNavigationItems = (email) => {
  const permissions = getUserPermissions(email);
  const userInfo = getUserInfo(email);
  
  const allItems = [
    { id: 'dashboard', label: 'Dashboard', permission: 'view_dashboard', icon: 'Home' },
    { id: 'billing', label: 'Billing', permission: 'manage_billing', icon: 'CreditCard' },
    { id: 'inventory', label: 'Inventory', permission: 'view_inventory', icon: 'Package' },
    { id: 'stores', label: 'Stores', permission: 'manage_stores', icon: 'Store', superAdminOnly: true },
    { id: 'users', label: 'Users', permission: 'manage_users', icon: 'Users', superAdminOnly: true },
    { id: 'reports', label: 'Reports', permission: 'view_reports', icon: 'BarChart3' },
    { id: 'barcode', label: 'Barcodes', permission: 'manage_barcodes', icon: 'QrCode' },
    { id: 'activity', label: 'Activity', permission: 'view_activity', icon: 'Activity' },
    { id: 'lowstock', label: 'Low Stock', permission: 'view_inventory', icon: 'AlertTriangle' }
  ];
  
  return allItems.filter(item => {
    // Check if user has permission
    if (!permissions.includes(item.permission)) return false;
    
    // Check if item is super admin only
    if (item.superAdminOnly && !userInfo?.isSuperAdmin) return false;
    
    return true;
  });
};