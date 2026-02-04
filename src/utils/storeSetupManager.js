/**
 * Comprehensive Store Setup Manager
 * Handles complete store creation with admin, inventory, and all features
 */

import { addStore, addProduct, updateStore } from '../services/firebaseService';
import { addUserToDB, USER_ROLES } from './dynamicRoleManager';
import { generateUniqueProductCode } from './productCodeGenerator';
import { generateProductBarcode } from './barcodeGenerator';

/**
 * Complete store setup with admin and initial data
 */
const createCompleteStore = async (storeData, adminData) => {
  try {
    console.log('🏪 Creating complete store setup...');
    
    // Step 1: Create the store
    console.log('1️⃣ Creating store...');
    const storeId = await addStore({
      ...storeData,
      storeId: generateStoreId(storeData.name),
      status: 'Active',
      setupComplete: false,
      createdBy: 'super_admin',
      features: {
        inventory: true,
        billing: true,
        reports: true,
        barcodes: true,
        userManagement: true,
        lowStockAlerts: true
      }
    });
    
    const generatedStoreId = `store_${storeId.slice(-3)}`;
    
    // Step 2: Create store admin
    console.log('2️⃣ Creating store admin...');
    const adminUserId = await addUserToDB({
      name: adminData.name,
      email: adminData.email,
      phone: adminData.phone,
      role: USER_ROLES.ADMIN,
      storeId: generatedStoreId,
      storeName: storeData.name,
      password: adminData.password,
      isActive: true,
      permissions: [
        'view_dashboard',
        'manage_inventory',
        'view_inventory',
        'view_reports',
        'manage_barcodes',
        'view_activity',
        'export_data',
        'manage_store_users'
      ],
      createdBy: 'super_admin',
      setupComplete: true
    });
    
    // Step 3: Create sample cashier (optional)
    let cashierUserId = null;
    if (adminData.createSampleCashier) {
      console.log('3️⃣ Creating sample cashier...');
      cashierUserId = await addUserToDB({
        name: `${storeData.name} Cashier`,
        email: `cashier@${storeData.name.toLowerCase().replace(/\s+/g, '')}.com`,
        phone: adminData.phone.replace(/\d$/, '1'), // Change last digit
        role: USER_ROLES.CASHIER,
        storeId: generatedStoreId,
        storeName: storeData.name,
        password: 'cashier123',
        isActive: true,
        permissions: [
          'view_dashboard',
          'manage_billing',
          'view_inventory'
        ],
        createdBy: 'super_admin',
        setupComplete: true
      });
    }
    
    // Step 4: Initialize inventory with sample products
    console.log('4️⃣ Setting up initial inventory...');
    const inventoryResult = await initializeStoreInventory(generatedStoreId, storeData.name);
    
    // Step 5: Update store as setup complete
    console.log('5️⃣ Finalizing store setup...');
    await updateStore(storeId, {
      setupComplete: true,
      storeId: generatedStoreId,
      adminUserId,
      cashierUserId,
      inventoryCount: inventoryResult.count,
      setupCompletedAt: new Date().toISOString()
    });
    
    console.log('🎉 Complete store setup finished!');
    
    return {
      success: true,
      storeId: generatedStoreId,
      storeDocId: storeId,
      storeName: storeData.name,
      adminUserId,
      cashierUserId,
      inventoryCount: inventoryResult.count,
      adminCredentials: {
        email: adminData.email,
        password: adminData.password
      },
      cashierCredentials: cashierUserId ? {
        email: `cashier@${storeData.name.toLowerCase().replace(/\s+/g, '')}.com`,
        password: 'cashier123'
      } : null,
      message: 'Store setup completed successfully with all features enabled'
    };
    
  } catch (error) {
    console.error('❌ Error creating complete store:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to create complete store setup'
    };
  }
};

/**
 * Initialize store inventory with sample products
 */
const initializeStoreInventory = async (storeId, storeName) => {
  try {
    console.log(`📦 Initializing inventory for ${storeName}...`);
    
    const sampleProducts = [
      // Grocery Items
      { name: 'Basmati Rice', category: 'Grains', price: 120, stock: 50, unit: 'kg' },
      { name: 'Whole Wheat Flour', category: 'Grains', price: 45, stock: 30, unit: 'kg' },
      { name: 'Sugar', category: 'Pantry', price: 42, stock: 25, unit: 'kg' },
      { name: 'Cooking Oil', category: 'Pantry', price: 180, stock: 20, unit: 'liter' },
      { name: 'Salt', category: 'Pantry', price: 20, stock: 40, unit: 'kg' },
      
      // Dairy Products
      { name: 'Fresh Milk', category: 'Dairy', price: 60, stock: 15, unit: 'liter' },
      { name: 'Butter', category: 'Dairy', price: 250, stock: 12, unit: 'pack' },
      { name: 'Cheese Slices', category: 'Dairy', price: 180, stock: 8, unit: 'pack' },
      { name: 'Yogurt', category: 'Dairy', price: 45, stock: 20, unit: 'cup' },
      
      // Beverages
      { name: 'Coca Cola', category: 'Beverages', price: 40, stock: 50, unit: 'bottle' },
      { name: 'Orange Juice', category: 'Beverages', price: 80, stock: 25, unit: 'pack' },
      { name: 'Mineral Water', category: 'Beverages', price: 20, stock: 100, unit: 'bottle' },
      
      // Snacks
      { name: 'Potato Chips', category: 'Snacks', price: 30, stock: 40, unit: 'pack' },
      { name: 'Biscuits', category: 'Snacks', price: 25, stock: 35, unit: 'pack' },
      { name: 'Chocolate Bar', category: 'Snacks', price: 50, stock: 30, unit: 'piece' },
      
      // Personal Care
      { name: 'Toothpaste', category: 'Personal Care', price: 85, stock: 20, unit: 'tube' },
      { name: 'Shampoo', category: 'Personal Care', price: 180, stock: 15, unit: 'bottle' },
      { name: 'Soap', category: 'Personal Care', price: 35, stock: 25, unit: 'bar' },
      
      // Household
      { name: 'Detergent Powder', category: 'Household', price: 120, stock: 18, unit: 'kg' },
      { name: 'Toilet Paper', category: 'Household', price: 45, stock: 30, unit: 'roll' }
    ];
    
    const results = [];
    for (const product of sampleProducts) {
      try {
        const productCode = generateUniqueProductCode(product.name);
        const barcode = generateProductBarcode(product.name, productCode);
        
        const productData = {
          ...product,
          code: productCode,
          barcode,
          storeId,
          storeName,
          createdBy: 'system_setup',
          setupProduct: true,
          lowStockThreshold: 10,
          status: 'Active'
        };
        
        const productId = await addProduct(productData);
        results.push({
          success: true,
          productId,
          name: product.name,
          code: productCode,
          barcode
        });
        
      } catch (error) {
        results.push({
          success: false,
          name: product.name,
          error: error.message
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    console.log(`✅ Initialized ${successCount} products for ${storeName}`);
    
    return {
      success: true,
      count: successCount,
      total: sampleProducts.length,
      results,
      sampleCodes: results.filter(r => r.success).slice(0, 5)
    };
    
  } catch (error) {
    console.error('❌ Error initializing store inventory:', error);
    return {
      success: false,
      error: error.message,
      count: 0
    };
  }
};

/**
 * Generate unique store ID
 */
const generateStoreId = (storeName) => {
  const prefix = storeName
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 3)
    .toUpperCase();
  const timestamp = Date.now().toString().slice(-4);
  return `${prefix}_${timestamp}`;
};

/**
 * Setup store admin dashboard features
 */
const setupAdminFeatures = async (storeId, storeName) => {
  try {
    console.log(`⚙️ Setting up admin features for ${storeName}...`);
    
    // Create default settings
    const settings = {
      storeId,
      storeName,
      features: {
        inventory: true,
        billing: true,
        reports: true,
        barcodes: true,
        userManagement: true,
        lowStockAlerts: true,
        activityTracking: true
      },
      preferences: {
        currency: 'INR',
        taxRate: 18,
        lowStockThreshold: 10,
        autoGenerateCodes: true,
        autoGenerateBarcodes: true
      },
      notifications: {
        lowStock: true,
        newUsers: true,
        systemUpdates: true
      }
    };
    
    // Store settings in Firebase (you might want to create a settings collection)
    console.log('✅ Admin features configured:', settings);
    
    return {
      success: true,
      settings,
      message: 'Admin features configured successfully'
    };
    
  } catch (error) {
    console.error('❌ Error setting up admin features:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Create store with wizard-like setup
 */
const createStoreWithWizard = async (wizardData) => {
  try {
    console.log('🧙‍♂️ Starting store creation wizard...');
    
    const {
      // Store Information
      storeName,
      storeAddress,
      storePhone,
      storeEmail,
      
      // Admin Information
      adminName,
      adminEmail,
      adminPhone,
      adminPassword,
      
      // Options
      createSampleCashier = true,
      initializeInventory = true,
      setupFeatures = true
    } = wizardData;
    
    // Validate required fields
    if (!storeName || !storeAddress || !adminName || !adminEmail || !adminPassword) {
      throw new Error('Missing required fields for store creation');
    }
    
    const storeData = {
      name: storeName,
      address: storeAddress,
      phone: storePhone,
      email: storeEmail,
      manager: adminName
    };
    
    const adminData = {
      name: adminName,
      email: adminEmail,
      phone: adminPhone,
      password: adminPassword,
      createSampleCashier
    };
    
    // Create complete store
    const result = await createCompleteStore(storeData, adminData);
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    // Setup additional features if requested
    if (setupFeatures) {
      await setupAdminFeatures(result.storeId, result.storeName);
    }
    
    return {
      ...result,
      wizardComplete: true,
      setupSteps: [
        '✅ Store created',
        '✅ Admin user created',
        createSampleCashier ? '✅ Sample cashier created' : '⏭️ Sample cashier skipped',
        initializeInventory ? '✅ Inventory initialized' : '⏭️ Inventory initialization skipped',
        setupFeatures ? '✅ Features configured' : '⏭️ Feature setup skipped'
      ]
    };
    
  } catch (error) {
    console.error('❌ Store creation wizard failed:', error);
    return {
      success: false,
      error: error.message,
      message: 'Store creation wizard failed'
    };
  }
};

// Export for console use
if (typeof window !== 'undefined') {
  window.createCompleteStore = createCompleteStore;
  window.createStoreWithWizard = createStoreWithWizard;
  window.initializeStoreInventory = initializeStoreInventory;
}

export {
  createCompleteStore,
  createStoreWithWizard,
  initializeStoreInventory,
  setupAdminFeatures,
  generateStoreId
};