import { generateUniqueQRCode } from './qrcodeGenerator';
import { updateProduct } from '../services/firebaseService';

/**
 * Generate QR codes for all inventory items that don't have them
 */
export const generateQRCodesForInventory = async (inventory, storeId = '001') => {
  const itemsWithoutQRCodes = inventory.filter(item => !item.qrcode);
  
  if (itemsWithoutQRCodes.length === 0) {
    console.log('All items already have QR codes');
    return { success: true, updated: 0, message: 'All items already have QR codes' };
  }

  console.log(`Generating QR codes for ${itemsWithoutQRCodes.length} items...`);
  
  try {
    const updatePromises = itemsWithoutQRCodes.map(async (item) => {
      const qrcode = generateUniqueQRCode(item.name, item.id, inventory, storeId);
      await updateProduct(item.id, { qrcode });
      console.log(`Generated QR code ${qrcode} for ${item.name}`);
      return { id: item.id, name: item.name, qrcode };
    });

    const results = await Promise.all(updatePromises);
    
    return {
      success: true,
      updated: results.length,
      message: `Successfully generated QR codes for ${results.length} items`,
      results
    };
  } catch (error) {
    console.error('Error generating QR codes:', error);
    return {
      success: false,
      updated: 0,
      message: `Failed to generate QR codes: ${error.message}`,
      error
    };
  }
};

/**
 * Generate a single QR code for a specific item
 */
export const generateQRCodeForItem = async (item, inventory, storeId = '001') => {
  try {
    const qrcode = generateUniqueQRCode(item.name, item.id, inventory, storeId);
    await updateProduct(item.id, { qrcode });
    console.log(`Generated QR code ${qrcode} for ${item.name}`);
    return { success: true, qrcode };
  } catch (error) {
    console.error('Error generating QR code:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Regenerate all QR codes (useful for migration from barcodes)
 */
export const regenerateAllQRCodes = async (inventory, storeId = '001') => {
  console.log(`Regenerating QR codes for all ${inventory.length} items...`);
  
  try {
    const updatePromises = inventory.map(async (item) => {
      const qrcode = generateUniqueQRCode(item.name, item.id, inventory, storeId);
      await updateProduct(item.id, { qrcode });
      console.log(`Regenerated QR code ${qrcode} for ${item.name}`);
      return { id: item.id, name: item.name, qrcode };
    });

    const results = await Promise.all(updatePromises);
    
    return {
      success: true,
      updated: results.length,
      message: `Successfully regenerated QR codes for ${results.length} items`,
      results
    };
  } catch (error) {
    console.error('Error regenerating QR codes:', error);
    return {
      success: false,
      updated: 0,
      message: `Failed to regenerate QR codes: ${error.message}`,
      error
    };
  }
};

export default {
  generateQRCodesForInventory,
  generateQRCodeForItem,
  regenerateAllQRCodes
};