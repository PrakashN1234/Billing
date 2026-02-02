import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Generate next sequential bill number
 * @param {string} storeId - Store ID for store-specific bill numbering
 * @returns {Promise<string>} - Next bill number like BILLNO1, BILLNO2, etc.
 */
export const generateNextBillNumber = async (storeId = 'default') => {
  try {
    const counterRef = doc(db, 'counters', `bills_${storeId}`);
    const counterDoc = await getDoc(counterRef);
    
    let nextNumber = 1;
    
    if (counterDoc.exists()) {
      const currentCount = counterDoc.data().count || 0;
      nextNumber = currentCount + 1;
      
      // Update the counter
      await updateDoc(counterRef, {
        count: nextNumber,
        lastUpdated: serverTimestamp()
      });
    } else {
      // Create new counter document
      await setDoc(counterRef, {
        count: nextNumber,
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
        storeId: storeId
      });
    }
    
    // Format bill number with leading zeros for better sorting
    const billNumber = `BILLNO${nextNumber.toString().padStart(4, '0')}`;
    
    console.log(`Generated bill number: ${billNumber} for store: ${storeId}`);
    return billNumber;
    
  } catch (error) {
    console.error('Error generating bill number:', error);
    // Fallback to timestamp-based number if counter fails
    const fallbackNumber = `BILLNO${Date.now().toString().slice(-6)}`;
    console.warn(`Using fallback bill number: ${fallbackNumber}`);
    return fallbackNumber;
  }
};

/**
 * Get current bill count for a store
 * @param {string} storeId - Store ID
 * @returns {Promise<number>} - Current bill count
 */
export const getCurrentBillCount = async (storeId = 'default') => {
  try {
    const counterRef = doc(db, 'counters', `bills_${storeId}`);
    const counterDoc = await getDoc(counterRef);
    
    if (counterDoc.exists()) {
      return counterDoc.data().count || 0;
    }
    
    return 0;
  } catch (error) {
    console.error('Error getting bill count:', error);
    return 0;
  }
};

/**
 * Reset bill counter for a store (Admin only)
 * @param {string} storeId - Store ID
 * @returns {Promise<boolean>} - Success status
 */
export const resetBillCounter = async (storeId = 'default') => {
  try {
    const counterRef = doc(db, 'counters', `bills_${storeId}`);
    await setDoc(counterRef, {
      count: 0,
      resetAt: serverTimestamp(),
      storeId: storeId
    });
    
    console.log(`Bill counter reset for store: ${storeId}`);
    return true;
  } catch (error) {
    console.error('Error resetting bill counter:', error);
    return false;
  }
};

/**
 * Generate bill number with store prefix
 * @param {string} storeId - Store ID
 * @param {string} storeName - Store name for prefix
 * @returns {Promise<string>} - Bill number with store prefix
 */
export const generateStoreBillNumber = async (storeId = 'default', storeName = 'STORE') => {
  try {
    const counterRef = doc(db, 'counters', `bills_${storeId}`);
    const counterDoc = await getDoc(counterRef);
    
    let nextNumber = 1;
    
    if (counterDoc.exists()) {
      const currentCount = counterDoc.data().count || 0;
      nextNumber = currentCount + 1;
      
      await updateDoc(counterRef, {
        count: nextNumber,
        lastUpdated: serverTimestamp()
      });
    } else {
      await setDoc(counterRef, {
        count: nextNumber,
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
        storeId: storeId
      });
    }
    
    // Create store prefix from store name (first 3 letters)
    const storePrefix = storeName.replace(/\s+/g, '').substring(0, 3).toUpperCase();
    const billNumber = `${storePrefix}BILL${nextNumber.toString().padStart(4, '0')}`;
    
    console.log(`Generated store bill number: ${billNumber} for store: ${storeName}`);
    return billNumber;
    
  } catch (error) {
    console.error('Error generating store bill number:', error);
    const fallbackNumber = `BILL${Date.now().toString().slice(-6)}`;
    return fallbackNumber;
  }
};