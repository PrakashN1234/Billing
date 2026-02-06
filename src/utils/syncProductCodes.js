/**
 * Utility to sync product codes, barcodes, and QR codes
 * Ensures all three fields have the same value (the product code)
 */

import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Sync all products to have matching code, barcode, and qrcode
 */
export const syncAllProductCodes = async () => {
  try {
    console.log('🔄 Starting product code sync...');
    
    const inventoryRef = collection(db, 'inventory');
    const snapshot = await getDocs(inventoryRef);
    
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`📦 Found ${products.length} products to sync`);

    let updated = 0;
    let skipped = 0;

    for (const product of products) {
      const productCode = product.code;
      
      if (!productCode) {
        console.warn(`⚠️ Product ${product.name} (${product.id}) has no product code, skipping...`);
        skipped++;
        continue;
      }

      // Check if barcode and qrcode need updating
      const needsUpdate = product.barcode !== productCode || product.qrcode !== productCode;

      if (needsUpdate) {
        const productRef = doc(db, 'inventory', product.id);
        await updateDoc(productRef, {
          barcode: productCode,
          qrcode: productCode
        });
        
        console.log(`✅ Updated ${product.name}: code=${productCode}, barcode=${productCode}, qrcode=${productCode}`);
        updated++;
      } else {
        console.log(`✓ ${product.name} already synced`);
        skipped++;
      }
    }

    console.log(`\n✨ Sync complete!`);
    console.log(`   Updated: ${updated} products`);
    console.log(`   Skipped: ${skipped} products`);
    
    return {
      success: true,
      total: products.length,
      updated,
      skipped,
      message: `Successfully synced ${updated} products`
    };

  } catch (error) {
    console.error('❌ Error syncing product codes:', error);
    return {
      success: false,
      error: error.message,
      message: `Failed to sync: ${error.message}`
    };
  }
};

/**
 * Sync a single product's codes
 */
export const syncSingleProduct = async (productId, productCode) => {
  try {
    if (!productCode) {
      throw new Error('Product code is required');
    }

    const productRef = doc(db, 'inventory', productId);
    await updateDoc(productRef, {
      barcode: productCode,
      qrcode: productCode
    });

    console.log(`✅ Synced product ${productId}: code=${productCode}`);
    
    return {
      success: true,
      productId,
      code: productCode
    };

  } catch (error) {
    console.error('❌ Error syncing product:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Generate product code from product name if missing
 */
export const generateProductCodeFromName = (productName, existingCodes = []) => {
  const name = productName.toLowerCase().trim();
  
  // Category prefixes
  const categoryMap = {
    'rice': 'RICE',
    'wheat': 'WHEAT',
    'flour': 'FLOUR',
    'oil': 'OIL',
    'ghee': 'GHEE',
    'butter': 'BUTTER',
    'sugar': 'SUGAR',
    'salt': 'SALT',
    'milk': 'MILK',
    'bread': 'BREAD',
    'biscuit': 'BISCUIT',
    'tea': 'TEA',
    'coffee': 'COFFEE',
    'juice': 'JUICE',
    'egg': 'EGGS',
    'soap': 'SOAP',
    'shampoo': 'SHAMPOO',
    'toothpaste': 'PASTE',
    'detergent': 'DETERGENT',
    'cleaner': 'CLEANER'
  };

  // Find matching category
  let prefix = null;
  for (const [keyword, code] of Object.entries(categoryMap)) {
    if (name.includes(keyword)) {
      prefix = code;
      break;
    }
  }

  // If no category match, use first 4 letters
  if (!prefix) {
    prefix = productName.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, 'X');
  }

  // Find next available number
  let sequence = 1;
  let code = `${prefix}${String(sequence).padStart(3, '0')}`;
  
  while (existingCodes.includes(code) && sequence < 999) {
    sequence++;
    code = `${prefix}${String(sequence).padStart(3, '0')}`;
  }

  return code;
};

/**
 * Auto-generate codes for products missing them
 */
export const autoGenerateMissingCodes = async () => {
  try {
    console.log('🔄 Auto-generating missing product codes...');
    
    const inventoryRef = collection(db, 'inventory');
    const snapshot = await getDocs(inventoryRef);
    
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const existingCodes = products
      .filter(p => p.code)
      .map(p => p.code);

    let generated = 0;

    for (const product of products) {
      if (!product.code) {
        const newCode = generateProductCodeFromName(product.name, existingCodes);
        existingCodes.push(newCode);

        const productRef = doc(db, 'inventory', product.id);
        await updateDoc(productRef, {
          code: newCode,
          barcode: newCode,
          qrcode: newCode
        });

        console.log(`✅ Generated code for ${product.name}: ${newCode}`);
        generated++;
      }
    }

    console.log(`\n✨ Auto-generation complete! Generated ${generated} codes`);
    
    return {
      success: true,
      generated,
      message: `Generated codes for ${generated} products`
    };

  } catch (error) {
    console.error('❌ Error auto-generating codes:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

const syncUtils = {
  syncAllProductCodes,
  syncSingleProduct,
  generateProductCodeFromName,
  autoGenerateMissingCodes
};

export default syncUtils;
