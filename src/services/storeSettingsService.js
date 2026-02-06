/**
 * Store Settings Service
 * Manages store-specific settings including tax rates, currency, etc.
 */

import { 
  doc, 
  getDoc,
  setDoc, 
  updateDoc,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Default store settings
 */
export const DEFAULT_STORE_SETTINGS = {
  taxRate: 18, // Default 18% GST for India
  currency: 'INR',
  currencySymbol: '₹',
  lowStockThreshold: 10,
  autoGenerateCodes: true,
  autoGenerateBarcodes: true,
  enableDiscounts: true,
  maxDiscountPercent: 50,
  businessName: '',
  businessAddress: '',
  businessPhone: '',
  businessEmail: '',
  gstNumber: '',
  receiptFooter: 'Thank you for shopping with us!',
  printLogo: false,
  enableTaxInvoice: true,
  roundingMethod: 'round', // 'round', 'floor', 'ceil'
  decimalPlaces: 2,
  // Scanning method settings
  preferredScanningMethod: 'qrcode', // 'qrcode', 'barcode', 'both'
  enableQRCodeScanning: true,
  enableBarcodeScanning: true,
  enableManualEntry: true
};

/**
 * Get store settings
 * @param {string} storeId - Store ID
 * @returns {Promise<Object>} - Store settings
 */
export const getStoreSettings = async (storeId) => {
  try {
    if (!storeId) {
      console.warn('No store ID provided, returning default settings');
      return DEFAULT_STORE_SETTINGS;
    }

    const settingsRef = doc(db, 'store_settings', storeId);
    const settingsDoc = await getDoc(settingsRef);
    
    if (settingsDoc.exists()) {
      const settings = settingsDoc.data();
      // Merge with defaults to ensure all properties exist
      return {
        ...DEFAULT_STORE_SETTINGS,
        ...settings
      };
    } else {
      // Create default settings for new store
      await setDoc(settingsRef, {
        ...DEFAULT_STORE_SETTINGS,
        storeId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return DEFAULT_STORE_SETTINGS;
    }
  } catch (error) {
    console.error('Error getting store settings:', error);
    return DEFAULT_STORE_SETTINGS;
  }
};

/**
 * Update store settings
 * @param {string} storeId - Store ID
 * @param {Object} updates - Settings to update
 * @returns {Promise<void>}
 */
export const updateStoreSettings = async (storeId, updates) => {
  try {
    if (!storeId) {
      throw new Error('Store ID is required');
    }

    const settingsRef = doc(db, 'store_settings', storeId);
    
    // Validate tax rate
    if (updates.taxRate !== undefined) {
      const taxRate = parseFloat(updates.taxRate);
      if (isNaN(taxRate) || taxRate < 0 || taxRate > 100) {
        throw new Error('Tax rate must be a number between 0 and 100');
      }
      updates.taxRate = taxRate;
    }

    // Validate discount settings
    if (updates.maxDiscountPercent !== undefined) {
      const maxDiscount = parseFloat(updates.maxDiscountPercent);
      if (isNaN(maxDiscount) || maxDiscount < 0 || maxDiscount > 100) {
        throw new Error('Max discount must be a number between 0 and 100');
      }
      updates.maxDiscountPercent = maxDiscount;
    }

    await updateDoc(settingsRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });

    console.log('Store settings updated successfully');
  } catch (error) {
    console.error('Error updating store settings:', error);
    throw error;
  }
};

/**
 * Subscribe to store settings changes
 * @param {string} storeId - Store ID
 * @param {Function} callback - Callback function
 * @returns {Function} - Unsubscribe function
 */
export const subscribeToStoreSettings = (storeId, callback) => {
  if (!storeId) {
    callback(DEFAULT_STORE_SETTINGS);
    return () => {}; // Return empty unsubscribe function
  }

  const settingsRef = doc(db, 'store_settings', storeId);
  
  return onSnapshot(settingsRef, (doc) => {
    if (doc.exists()) {
      const settings = {
        ...DEFAULT_STORE_SETTINGS,
        ...doc.data()
      };
      callback(settings);
    } else {
      callback(DEFAULT_STORE_SETTINGS);
    }
  }, (error) => {
    console.error('Error subscribing to store settings:', error);
    callback(DEFAULT_STORE_SETTINGS);
  });
};

/**
 * Calculate tax amount
 * @param {number} amount - Base amount
 * @param {number} taxRate - Tax rate percentage
 * @returns {number} - Tax amount
 */
export const calculateTax = (amount, taxRate) => {
  if (!amount || !taxRate) return 0;
  return (amount * taxRate) / 100;
};

/**
 * Calculate total with tax
 * @param {number} subtotal - Subtotal amount
 * @param {number} taxRate - Tax rate percentage
 * @param {number} discount - Discount amount
 * @returns {Object} - Calculation breakdown
 */
export const calculateBillTotal = (subtotal, taxRate = 18, discount = 0) => {
  const discountAmount = discount;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = calculateTax(taxableAmount, taxRate);
  const total = taxableAmount + taxAmount;

  return {
    subtotal,
    discountAmount,
    taxableAmount,
    taxAmount,
    taxRate,
    total: Math.round(total * 100) / 100 // Round to 2 decimal places
  };
};

/**
 * Format currency
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code
 * @param {string} symbol - Currency symbol
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (amount, currency = 'INR', symbol = '₹') => {
  if (currency === 'INR') {
    // Indian number format with commas
    return `${symbol}${amount.toLocaleString('en-IN', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  } else {
    return `${symbol}${amount.toFixed(2)}`;
  }
};

/**
 * Validate GST number (Indian format)
 * @param {string} gstNumber - GST number to validate
 * @returns {boolean} - Whether GST number is valid
 */
export const validateGSTNumber = (gstNumber) => {
  if (!gstNumber) return true; // Optional field
  
  // GST format: 2 digits (state code) + 10 digits (PAN) + 1 digit (entity number) + 1 digit (Z) + 1 digit (checksum)
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstRegex.test(gstNumber.toUpperCase());
};

/**
 * Get tax display name
 * @param {string} currency - Currency code
 * @returns {string} - Tax display name
 */
export const getTaxDisplayName = (currency = 'INR') => {
  switch (currency) {
    case 'INR':
      return 'GST';
    case 'USD':
      return 'Sales Tax';
    case 'EUR':
      return 'VAT';
    default:
      return 'Tax';
  }
};

const storeSettingsService = {
  getStoreSettings,
  updateStoreSettings,
  subscribeToStoreSettings,
  calculateTax,
  calculateBillTotal,
  formatCurrency,
  validateGSTNumber,
  getTaxDisplayName,
  DEFAULT_STORE_SETTINGS
};

export default storeSettingsService;