import QRCode from 'qrcode';

/**
 * Generate unique QR code data for products
 * NEW: Simply use the product code as QR code data
 */
export const generateProductQRData = (productName, productId, storeId = '001', productCode = null) => {
  // If product has a code, use it directly as QR code
  if (productCode) {
    return productCode;
  }
  
  // If no product code, generate a simple one
  const categoryPrefix = getCategoryPrefix(productName);
  let sequence = 1;
  let qrData = `${categoryPrefix}${String(sequence).padStart(3, '0')}`;
  
  return qrData;
};

// Get simple category prefix for product code generation
const getCategoryPrefix = (productName) => {
  const name = productName.toLowerCase();
  
  // Food & Beverages
  if (name.includes('rice')) return 'RICE';
  if (name.includes('wheat')) return 'WHEAT';
  if (name.includes('flour')) return 'FLOUR';
  if (name.includes('oil')) return 'OIL';
  if (name.includes('ghee')) return 'GHEE';
  if (name.includes('butter')) return 'BUTTER';
  if (name.includes('sugar')) return 'SUGAR';
  if (name.includes('salt')) return 'SALT';
  if (name.includes('milk')) return 'MILK';
  if (name.includes('bread')) return 'BREAD';
  if (name.includes('biscuit')) return 'BISCUIT';
  if (name.includes('tea')) return 'TEA';
  if (name.includes('coffee')) return 'COFFEE';
  if (name.includes('juice')) return 'JUICE';
  if (name.includes('egg')) return 'EGGS';
  
  // Personal Care
  if (name.includes('soap')) return 'SOAP';
  if (name.includes('shampoo')) return 'SHAMPOO';
  if (name.includes('toothpaste')) return 'PASTE';
  
  // Household
  if (name.includes('detergent')) return 'DETERGENT';
  if (name.includes('cleaner')) return 'CLEANER';
  
  // Default - use first 4 letters of product name
  return productName.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, 'X');
};

// Generate category code based on product name
// eslint-disable-next-line no-unused-vars
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
// eslint-disable-next-line no-unused-vars
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
 * NEW: Use product code directly
 */
export const generateUniqueQRCode = (productName, productId, inventory, storeId = '001', productCode = null) => {
  // If product has a code, use it directly
  if (productCode) {
    return productCode;
  }
  
  // Generate QR code data
  let qrData = generateProductQRData(productName, productId, storeId, productCode);
  let attempts = 0;
  
  // If QR code exists, modify until unique
  while (!isQRCodeUnique(qrData, inventory, productId) && attempts < 100) {
    const categoryPrefix = getCategoryPrefix(productName);
    const sequence = attempts + 1;
    qrData = `${categoryPrefix}${String(sequence).padStart(3, '0')}`;
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
 * NEW: Accept simple product code format (e.g., RICE001, MILK001)
 */
export const validateQRCode = (qrData) => {
  if (!qrData) return false;
  
  // Accept simple product code format: LETTERS + NUMBERS (e.g., RICE001, MILK001)
  const simplePattern = /^[A-Z]{3,10}\d{3}$/;
  if (simplePattern.test(qrData)) return true;
  
  // Also accept old format for backward compatibility: ST###_CATEGORY_######
  const oldPattern = /^ST\d{3}_[A-Z]+_\d{6}$/;
  return oldPattern.test(qrData);
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

const qrCodeGenerator = {
  generateProductQRData,
  generateQRCodeImage,
  generateQRCodeSVG,
  generateUniqueQRCode,
  validateQRCode,
  parseQRCode
};

export default qrCodeGenerator;