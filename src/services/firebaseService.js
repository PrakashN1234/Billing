import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  setDoc,
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  limit,
  where
} from 'firebase/firestore';
import { db } from '../firebase';
import { generateNextBillNumber } from '../utils/billNumberGenerator';

// Inventory Management
export const getInventory = async () => {
  try {
    const inventoryRef = collection(db, 'inventory');
    const snapshot = await getDocs(inventoryRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching inventory:', error);
    throw error;
  }
};

export const addProduct = async (product) => {
  try {
    const inventoryRef = collection(db, 'inventory');
    
    // Use custom product code as document ID if available
    if (product.code) {
      const docRef = doc(inventoryRef, product.code);
      await setDoc(docRef, {
        ...product,
        id: product.code, // Ensure ID matches the document ID
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return product.code;
    } else {
      // Fallback to auto-generated ID if no code provided
      const docRef = await addDoc(inventoryRef, {
        ...product,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    }
  } catch (error) {
    console.error('Error adding product:', error);
    throw error;
  }
};

export const updateProduct = async (productId, updates) => {
  try {
    const productRef = doc(db, 'inventory', productId);
    await updateDoc(productRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

export const deleteProduct = async (productId) => {
  try {
    const productRef = doc(db, 'inventory', productId);
    await deleteDoc(productRef);
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

// Real-time inventory listener
export const subscribeToInventory = (callback, errorCallback) => {
  const inventoryRef = collection(db, 'inventory');
  return onSnapshot(
    inventoryRef, 
    (snapshot) => {
      const inventory = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(inventory);
    },
    (error) => {
      console.error('Inventory subscription error:', error);
      if (errorCallback) errorCallback(error);
    }
  );
};

// Sales Management
export const saveSale = async (saleData) => {
  try {
    // Generate sequential bill number
    const billNumber = await generateNextBillNumber(saleData.storeId || 'default');
    
    const salesRef = collection(db, 'sales');
    
    // Use bill number as document ID
    const docRef = doc(salesRef, billNumber);
    await setDoc(docRef, {
      ...saleData,
      billNumber: billNumber,
      id: billNumber, // Ensure ID matches bill number
      timestamp: serverTimestamp(),
      date: new Date().toISOString().split('T')[0]
    });
    
    console.log(`Sale saved with bill number: ${billNumber}`);
    return billNumber;
  } catch (error) {
    console.error('Error saving sale:', error);
    throw error;
  }
};

export const getSales = async (limitCount = 50) => {
  try {
    const salesRef = collection(db, 'sales');
    const q = query(salesRef, orderBy('timestamp', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching sales:', error);
    throw error;
  }
};

// Update stock after sale
export const updateStock = async (items) => {
  try {
    const updatePromises = items.map(async (item) => {
      const productRef = doc(db, 'inventory', item.id);
      await updateDoc(productRef, {
        stock: item.newStock,
        updatedAt: serverTimestamp()
      });
    });
    await Promise.all(updatePromises);
  } catch (error) {
    console.error('Error updating stock:', error);
    throw error;
  }
};
// Stores Management
export const getStores = async () => {
  try {
    console.log('🔍 Fetching stores from Firestore...');
    const storesRef = collection(db, 'stores');
    const snapshot = await getDocs(storesRef);
    const stores = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    console.log('✅ Stores fetched successfully:', stores.length);
    return stores;
  } catch (error) {
    console.error('❌ Error fetching stores:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    throw error;
  }
};

export const addStore = async (store) => {
  try {
    console.log('➕ Adding store to Firestore:', store);
    const storesRef = collection(db, 'stores');
    const docRef = await addDoc(storesRef, {
      ...store,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log('✅ Store added successfully with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error adding store:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    // Provide user-friendly error messages
    if (error.code === 'permission-denied') {
      throw new Error('Permission denied. Please check Firestore security rules.');
    } else if (error.code === 'unavailable') {
      throw new Error('Firestore is currently unavailable. Please try again later.');
    } else {
      throw new Error(`Failed to add store: ${error.message}`);
    }
  }
};

export const updateStore = async (storeId, updates) => {
  try {
    console.log('📝 Updating store:', storeId, updates);
    const storeRef = doc(db, 'stores', storeId);
    await updateDoc(storeRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    console.log('✅ Store updated successfully');
  } catch (error) {
    console.error('❌ Error updating store:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    if (error.code === 'permission-denied') {
      throw new Error('Permission denied. Please check Firestore security rules.');
    } else {
      throw new Error(`Failed to update store: ${error.message}`);
    }
  }
};

export const deleteStore = async (storeId) => {
  try {
    console.log('🗑️ Deleting store:', storeId);
    const storeRef = doc(db, 'stores', storeId);
    await deleteDoc(storeRef);
    console.log('✅ Store deleted successfully');
  } catch (error) {
    console.error('❌ Error deleting store:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    if (error.code === 'permission-denied') {
      throw new Error('Permission denied. Please check Firestore security rules.');
    } else {
      throw new Error(`Failed to delete store: ${error.message}`);
    }
  }
};

// Real-time stores listener
export const subscribeToStores = (callback, errorCallback) => {
  try {
    console.log('👂 Setting up stores listener...');
    const storesRef = collection(db, 'stores');
    return onSnapshot(
      storesRef, 
      (snapshot) => {
        const stores = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('📡 Stores updated:', stores.length);
        callback(stores);
      },
      (error) => {
        console.error('❌ Stores subscription error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        if (errorCallback) errorCallback(error);
      }
    );
  } catch (error) {
    console.error('❌ Error setting up stores listener:', error);
    if (errorCallback) errorCallback(error);
  }
};

// Users Management
export const getUsers = async () => {
  try {
    console.log('🔍 Fetching users from Firestore...');
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    console.log('✅ Users fetched successfully:', users.length);
    return users;
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    throw error;
  }
};

export const addUser = async (user) => {
  try {
    console.log('➕ Adding user to Firestore:', { ...user, password: '[HIDDEN]' });
    const usersRef = collection(db, 'users');
    const docRef = await addDoc(usersRef, {
      ...user,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      joinDate: new Date().toISOString().split('T')[0],
      lastLogin: 'Never'
    });
    console.log('✅ User added successfully with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error adding user:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    if (error.code === 'permission-denied') {
      throw new Error('Permission denied. Please check Firestore security rules.');
    } else if (error.code === 'unavailable') {
      throw new Error('Firestore is currently unavailable. Please try again later.');
    } else {
      throw new Error(`Failed to add user: ${error.message}`);
    }
  }
};

export const updateUser = async (userId, updates) => {
  try {
    console.log('📝 Updating user:', userId, { ...updates, password: '[HIDDEN]' });
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    console.log('✅ User updated successfully');
  } catch (error) {
    console.error('❌ Error updating user:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    if (error.code === 'permission-denied') {
      throw new Error('Permission denied. Please check Firestore security rules.');
    } else {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }
};

export const deleteUser = async (userId) => {
  try {
    console.log('🗑️ Deleting user:', userId);
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);
    console.log('✅ User deleted successfully');
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    if (error.code === 'permission-denied') {
      throw new Error('Permission denied. Please check Firestore security rules.');
    } else {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }
};

// Real-time users listener
export const subscribeToUsers = (callback, errorCallback) => {
  try {
    console.log('👂 Setting up users listener...');
    const usersRef = collection(db, 'users');
    return onSnapshot(
      usersRef, 
      (snapshot) => {
        const users = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('📡 Users updated:', users.length);
        callback(users);
      },
      (error) => {
        console.error('❌ Users subscription error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        if (errorCallback) errorCallback(error);
      }
    );
  } catch (error) {
    console.error('❌ Error setting up users listener:', error);
    if (errorCallback) errorCallback(error);
  }
};

// Initialize default data
export const initializeStores = async () => {
  try {
    console.log('🔧 Checking if stores need initialization...');
    const stores = await getStores();
    if (stores.length === 0) {
      console.log('📦 Initializing default store...');
      await addStore({
        name: 'My Store Main Branch',
        address: '321 Main Street, City',
        phone: '+91 9876543210',
        email: 'main@mystore.com',
        status: 'Active',
        manager: 'Store Manager'
      });
      console.log('✅ Default store initialized');
    } else {
      console.log('✅ Stores already exist, skipping initialization');
    }
  } catch (error) {
    console.error('❌ Error initializing stores:', error);
    // Don't throw error here, just log it
  }
};

export const initializeUsers = async () => {
  try {
    console.log('🔧 Checking if users need initialization...');
    const users = await getUsers();
    if (users.length === 0) {
      console.log('📦 Initializing default users...');
      await addUser({
        name: 'Prakash N',
        email: 'prakashn1234@gmail.com',
        phone: '+91 9876543210',
        role: 'Administrator',
        status: 'Active',
        password: 'admin123'
      });
      
      await addUser({
        name: 'Demo User',
        email: 'demo@mystore.com',
        phone: '+91 9876543211',
        role: 'Cashier',
        status: 'Active',
        password: 'demo123'
      });
      
      console.log('✅ Default users initialized');
    } else {
      console.log('✅ Users already exist, skipping initialization');
    }
  } catch (error) {
    console.error('❌ Error initializing users:', error);
    // Don't throw error here, just log it
  }
};

// Store-based data filtering functions

/**
 * Get inventory filtered by store access
 * @param {string|null} storeId - Store ID to filter by, null for all stores
 * @returns {Promise<Array>} - Filtered inventory array
 */
export const getInventoryByStore = async (storeId = null) => {
  try {
    const inventoryRef = collection(db, 'inventory');
    let inventoryQuery;
    
    if (storeId) {
      // Filter by specific store
      inventoryQuery = query(inventoryRef, where('storeId', '==', storeId));
    } else {
      // Get all inventory (for super admin)
      inventoryQuery = inventoryRef;
    }
    
    const snapshot = await getDocs(inventoryQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching inventory by store:', error);
    throw error;
  }
};

/**
 * Get sales filtered by store access
 * @param {string|null} storeId - Store ID to filter by, null for all stores
 * @param {number} limitCount - Number of sales to fetch
 * @returns {Promise<Array>} - Filtered sales array
 */
export const getSalesByStore = async (storeId = null, limitCount = 50) => {
  try {
    const salesRef = collection(db, 'sales');
    let salesQuery;
    
    if (storeId) {
      // Filter by specific store
      salesQuery = query(
        salesRef, 
        where('storeId', '==', storeId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
    } else {
      // Get all sales (for super admin)
      salesQuery = query(
        salesRef,
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
    }
    
    const snapshot = await getDocs(salesQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching sales by store:', error);
    throw error;
  }
};

/**
 * Subscribe to inventory changes filtered by store
 * @param {string|null} storeId - Store ID to filter by, null for all stores
 * @param {Function} onUpdate - Callback function for updates
 * @param {Function} onError - Callback function for errors
 * @returns {Function} - Unsubscribe function
 */
export const subscribeToInventoryByStore = (storeId = null, onUpdate, onError) => {
  try {
    const inventoryRef = collection(db, 'inventory');
    let inventoryQuery;
    
    if (storeId) {
      inventoryQuery = query(inventoryRef, where('storeId', '==', storeId));
    } else {
      inventoryQuery = inventoryRef;
    }
    
    return onSnapshot(
      inventoryQuery,
      (snapshot) => {
        const inventory = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        onUpdate(inventory);
      },
      onError
    );
  } catch (error) {
    console.error('Error subscribing to inventory by store:', error);
    onError(error);
  }
};

/**
 * Add product with store association
 * @param {Object} product - Product data
 * @param {string} storeId - Store ID to associate with
 * @returns {Promise<string>} - Document ID
 */
export const addProductToStore = async (product, storeId) => {
  try {
    const inventoryRef = collection(db, 'inventory');
    const productData = {
      ...product,
      storeId: storeId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    // Use custom product code as document ID if available
    if (product.code) {
      const docRef = doc(inventoryRef, product.code);
      await setDoc(docRef, {
        ...productData,
        id: product.code // Ensure ID matches the document ID
      });
      return product.code;
    } else {
      // Fallback to auto-generated ID if no code provided
      const docRef = await addDoc(inventoryRef, productData);
      return docRef.id;
    }
  } catch (error) {
    console.error('Error adding product to store:', error);
    throw error;
  }
};

/**
 * Save sale with store association
 * @param {Object} saleData - Sale data
 * @param {string} storeId - Store ID to associate with
 * @returns {Promise<string>} - Document ID
 */
export const saveSaleToStore = async (saleData, storeId) => {
  try {
    const salesRef = collection(db, 'sales');
    const docRef = await addDoc(salesRef, {
      ...saleData,
      storeId: storeId,
      timestamp: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error saving sale to store:', error);
    throw error;
  }
};

/**
 * Get stores that user can access
 * @param {boolean} isSuperAdmin - Whether user is super admin
 * @param {string|null} userStoreId - User's store ID if not super admin
 * @returns {Promise<Array>} - Array of accessible stores
 */
export const getAccessibleStores = async (isSuperAdmin, userStoreId = null) => {
  try {
    const storesRef = collection(db, 'stores');
    let storesQuery;
    
    if (isSuperAdmin) {
      // Super admin can see all stores
      storesQuery = storesRef;
    } else if (userStoreId) {
      // Regular admin can only see their store
      storesQuery = query(storesRef, where('id', '==', userStoreId));
    } else {
      // No access
      return [];
    }
    
    const snapshot = await getDocs(storesQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching accessible stores:', error);
    throw error;
  }
};

/**
 * Create a new store (Super Admin only)
 * @param {Object} storeData - Store data
 * @returns {Promise<string>} - Document ID
 */
export const createStore = async (storeData) => {
  try {
    const storesRef = collection(db, 'stores');
    const docRef = await addDoc(storesRef, {
      ...storeData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: 'active'
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating store:', error);
    throw error;
  }
};

/**
 * Create a new user (Super Admin only)
 * @param {Object} userData - User data including email, role, storeId
 * @returns {Promise<string>} - Document ID
 */
export const createUser = async (userData) => {
  try {
    const usersRef = collection(db, 'users');
    const docRef = await addDoc(usersRef, {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: 'active',
      lastLogin: null
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};