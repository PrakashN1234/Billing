import QRCode from 'qrcode';

/**
 * Generate unique QR code data for products
 * Format: STORE_PRODUCT_SEQUENCE (e.g., ST001_RICE_000001)
 */
export const generateProductQRData = (productName, productId, storeId = '001') => {
  // Create a unique QR code data based on product info
  const storePart = `ST${storeId}`;
  const categoryCode = getCategoryCode(productName);
  const productSequence = generateProductSequence(productId);
  
  // Format: STORE_CATEGORY_SEQUENCE (e.g., ST001_FOOD_000123)
  return `${storePart}_${categoryCode}_${productSequence}`;
};

// Generate category code based on product name
const getCategoryCode = (productName) => {
  const name = productName.toLowerCase();
  
  // Food & Beverages
  if (name.includes('rice') || name.includes('wheat') || name.includes('flour')) return 'GRAIN';
  if (name.includes('oil') || name.includes('ghee') || name.includes('butter')) return 'DAIRY';
  if (name.includes('sugar') || name.includes('salt') || name.includes('spice')) return 'SPICE';
  if (name.includes('milk') || name.includes('yogurt') || name.includes('cheese')) return 'DAIRY';
  if (name.includes('bread') || name.includes('biscuit') || name.includes('cake')) return 'BAKERY';
  if (name.includes('tea') || name.includes('coffee') || name.includes('juice')) return 'BEVERAGE';
  
  // Fruits & Vegetables
  if (name.includes('apple') || name.includes('banana') || name.includes('orange')) return 'FRUIT';
  if (name.includes('tomato') || name.includes('onion') || name.includes('potato')) return 'VEGETABLE';
  
  // Personal Care
  if (name.includes('soap') || name.includes('shampoo') || name.includes('toothpaste')) return 'PERSONAL';
  
  // Household
  if (name.includes('detergent') || name.includes('cleaner') || name.includes('brush')) return 'HOUSEHOLD';
  
  // Meat & Poultry
  if (name.includes('chicken') || name.includes('beef') || name.includes('pork')) return 'MEAT';
  
  // Default category
  return 'GENERAL';
};

// Generate 6-digit product sequence from product ID
const generateProductSequence = (productId) => {
  let sequence = '';
  
  if (productId) {
    // Use hash of product ID to generate consistent sequence
    let hash = 0;
    for (let i = 0; i < productId.length; i++) {
      const char = productId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    sequence = Math.abs(hash).toString().padStart(6, '0').slice(-6);
  } else {
    // Generate random 6-digit sequence
    sequence = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  }
  
  return sequence;
};

/**
 * Generate QR code image as Data URL
 * @param {string} qrData - Data to encode in QR code
 * @param {object} options - QR code generation options
 * @returns {Promise<string>} - Data URL of QR code image
 */
export const generateQRCodeImage = async (qrData, options = {}) => {
  const defaultOptions = {
    width: 200,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    },
    errorCorrectionLevel: 'M' // Medium error correction
  };
  
  const finalOptions = { ...defaultOptions, ...options };
  
  try {
    const dataUrl = await QRCode.toDataURL(qrData, finalOptions);
    return dataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    return null;
  }
};

/**
 * Generate QR code as SVG string
 * @param {string} qrData - Data to encode in QR code
 * @param {object} options - QR code generation options
 * @returns {Promise<string>} - SVG string of QR code
 */
export const generateQRCodeSVG = async (qrData, options = {}) => {
  const defaultOptions = {
    width: 200,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    },
    errorCorrectionLevel: 'M'
  };
  
  const finalOptions = { ...defaultOptions, ...options };
  
  try {
    const svg = await QRCode.toString(qrData, { ...finalOptions, type: 'svg' });
    return svg;
  } catch (error) {
    console.error('Error generating QR code SVG:', error);
    return null;
  }
};

/**
 * Generate unique QR code ensuring no duplicates
 * @param {string} productName - Product name
 * @param {string} productId - Product ID
 * @param {array} inventory - Current inventory to check for duplicates
 * @param {string} storeId - Store ID
 * @returns {string} - Unique QR code data
 */
export const generateUniqueQRCode = (productName, productId, inventory, storeId = '001') => {
  let qrData = generateProductQRData(productName, productId, storeId);
  let attempts = 0;
  
  // If QR code exists, modify the sequence until unique
  while (!isQRCodeUnique(qrData, inventory, productId) && attempts < 100) {
    const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const modifiedSequence = (productId + randomSuffix).slice(-6).padStart(6, '0');
    const storePart = `ST${storeId}`;
    const categoryCode = getCategoryCode(productName);
    qrData = `${storePart}_${categoryCode}_${modifiedSequence}`;
    attempts++;
  }
  
  return qrData;
};

/**
 * Check if QR code is unique in inventory
 * @param {string} qrData - QR code data to check
 * @param {array} inventory - Current inventory
 * @param {string} currentProductId - Current product ID to exclude from check
 * @returns {boolean} - Whether QR code is unique
 */
const isQRCodeUnique = (qrData, inventory, currentProductId) => {
  if (!inventory || inventory.length === 0) return true;
  
  return !inventory.some(item => 
    item.qrcode === qrData && item.id !== currentProductId
  );
};

/**
 * Validate QR code format
 * @param {string} qrData - QR code data to validate
 * @returns {boolean} - Whether QR code format is valid
 */
export const validateQRCode = (qrData) => {
  if (!qrData) return false;
  
  // Expected format: ST###_CATEGORY_######
  const qrPattern = /^ST\d{3}_[A-Z]+_\d{6}$/;
  return qrPattern.test(qrData);
};

/**
 * Parse QR code data to extract information
 * @param {string} qrData - QR code data to parse
 * @returns {object} - Parsed QR code information
 */
export const parseQRCode = (qrData) => {
  if (!validateQRCode(qrData)) {
    return null;
  }
  
  const parts = qrData.split('_');
  return {
    storeId: parts[0].substring(2), // Remove 'ST' prefix
    category: parts[1],
    sequence: parts[2]
  };
};

export default {
  generateProductQRData,
  generateQRCodeImage,
  generateQRCodeSVG,
  generateUniqueQRCode,
  validateQRCode,
  parseQRCode
};