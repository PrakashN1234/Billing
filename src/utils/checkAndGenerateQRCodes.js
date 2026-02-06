/**
 * Utility to check and generate QR codes for products
 * Run this from browser console to diagnose and fix QR code issues
 */

import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { generateUniqueQRCode } from './qrcodeGenerator';

/**
 * Check which products have QR codes
 */
export const checkProductQRCodes = async () => {
  try {
    const inventoryRef = collection(db, 'inventory');
    const snapshot = await getDocs(inventoryRef);
    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const withQRCode = products.filter(p => p.qrcode);
    const withoutQRCode = products.filter(p => !p.qrcode);
    const withBarcode = products.filter(p => p.barcode);
    const withoutBarcode = products.filter(p => !p.barcode);
    
    console.log('📊 QR Code Status Report:');
    console.log('========================');
    console.log(`Total Products: ${products.length}`);
    console.log(`✅ With QR Code: ${withQRCode.length}`);
    console.log(`❌ Without QR Code: ${withoutQRCode.length}`);
    console.log(`✅ With Barcode: ${withBarcode.length}`);
    console.log(`❌ Without Barcode: ${withoutBarcode.length}`);
    console.log('');
    
    if (withQRCode.length > 0) {
      console.log('📋 Sample QR Codes:');
      withQRCode.slice(0, 3).forEach(p => {
        console.log(`  ${p.name}: ${p.qrcode}`);
      });
      console.log('');
    }
    
    if (withoutQRCode.length > 0) {
      console.log('⚠️ Products without QR codes:');
      withoutQRCode.forEach(p => {
        console.log(`  - ${p.name} (ID: ${p.id})`);
      });
      console.log('');
      console.log('💡 Run generateMissingQRCodes() to fix this');
    }
    
    return {
      total: products.length,
      withQRCode: withQRCode.length,
      withoutQRCode: withoutQRCode.length,
      products: products
    };
  } catch (error) {
    console.error('Error checking QR codes:', error);
    return null;
  }
};

/**
 * Generate QR codes for products that don't have them
 */
export const generateMissingQRCodes = async (storeId = '001') => {
  try {
    console.log('🔄 Starting QR code generation...');
    
    const inventoryRef = collection(db, 'inventory');
    const snapshot = await getDocs(inventoryRef);
    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const productsWithoutQRCode = products.filter(p => !p.qrcode);
    
    if (productsWithoutQRCode.length === 0) {
      console.log('✅ All products already have QR codes!');
      return { success: true, updated: 0 };
    }
    
    console.log(`📦 Generating QR codes for ${productsWithoutQRCode.length} products...`);
    
    let updated = 0;
    for (const product of productsWithoutQRCode) {
      try {
        const qrcode = generateUniqueQRCode(
          product.name, 
          product.id, 
          products,
          product.storeId || storeId
        );
        
        const productRef = doc(db, 'inventory', product.id);
        await updateDoc(productRef, { qrcode });
        
        console.log(`✅ Generated QR code for ${product.name}: ${qrcode}`);
        updated++;
      } catch (error) {
        console.error(`❌ Failed to generate QR code for ${product.name}:`, error);
      }
    }
    
    console.log('');
    console.log(`✅ Successfully generated ${updated} QR codes!`);
    
    return { success: true, updated };
  } catch (error) {
    console.error('Error generating QR codes:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Test scanning a specific code
 */
export const testScanCode = async (code) => {
  try {
    console.log(`🔍 Testing scan for code: "${code}"`);
    
    const inventoryRef = collection(db, 'inventory');
    const snapshot = await getDocs(inventoryRef);
    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Try all search methods
    const byQRCode = products.find(p => p.qrcode === code);
    const byBarcode = products.find(p => p.barcode === code);
    const byProductCode = products.find(p => p.code === code.toUpperCase());
    const byId = products.find(p => p.id.toLowerCase() === code.toLowerCase());
    const byName = products.find(p => p.name.toLowerCase().includes(code.toLowerCase()));
    
    console.log('Search Results:');
    console.log('===============');
    console.log('By QR Code:', byQRCode ? `✅ ${byQRCode.name}` : '❌ Not found');
    console.log('By Barcode:', byBarcode ? `✅ ${byBarcode.name}` : '❌ Not found');
    console.log('By Product Code:', byProductCode ? `✅ ${byProductCode.name}` : '❌ Not found');
    console.log('By ID:', byId ? `✅ ${byId.name}` : '❌ Not found');
    console.log('By Name:', byName ? `✅ ${byName.name}` : '❌ Not found');
    
    const found = byQRCode || byBarcode || byProductCode || byId || byName;
    
    if (found) {
      console.log('');
      console.log('✅ Product Found:');
      console.log('  Name:', found.name);
      console.log('  QR Code:', found.qrcode || 'Not set');
      console.log('  Barcode:', found.barcode || 'Not set');
      console.log('  Product Code:', found.code || 'Not set');
      console.log('  ID:', found.id);
      console.log('  Stock:', found.stock);
    } else {
      console.log('');
      console.log('❌ Product not found with any search method');
      console.log('💡 Make sure QR codes are generated for all products');
    }
    
    return found;
  } catch (error) {
    console.error('Error testing scan:', error);
    return null;
  }
};

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.checkProductQRCodes = checkProductQRCodes;
  window.generateMissingQRCodes = generateMissingQRCodes;
  window.testScanCode = testScanCode;
}

export default {
  checkProductQRCodes,
  generateMissingQRCodes,
  testScanCode
};
