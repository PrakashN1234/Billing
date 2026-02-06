import JsBarcode from 'jsbarcode';

// Generate unique barcode for products
export const generateProductBarcode = (productName, productId) => {
  // Create a unique barcode based on product info
  // Format: Store prefix (78) + Category code (2 digits) + Product sequence (6 digits) + Check digit
  
  const storePrefix = '78'; // Store identifier
  const categoryCode = getCategoryCode(productName);
  const productSequence = generateProductSequence(productId);
  const checkDigit = calculateCheckDigit(storePrefix + categoryCode + productSequence);
  
  return storePrefix + categoryCode + productSequence + checkDigit;
};

// Generate category code based on product name
const getCategoryCode = (productName) => {
  const name = productName.toLowerCase();
  
  // Food & Beverages
  if (name.includes('rice') || name.includes('wheat') || name.includes('flour')) return '01';
  if (name.includes('oil') || name.includes('ghee') || name.includes('butter')) return '02';
  if (name.includes('sugar') || name.includes('salt') || name.includes('spice')) return '03';
  if (name.includes('milk') || name.includes('yogurt') || name.includes('cheese')) return '04';
  if (name.includes('bread') || name.includes('biscuit') || name.includes('cake')) return '05';
  if (name.includes('tea') || name.includes('coffee') || name.includes('juice')) return '06';
  
  // Personal Care
  if (name.includes('soap') || name.includes('shampoo') || name.includes('toothpaste')) return '10';
  if (name.includes('cream') || name.includes('lotion') || name.includes('powder')) return '11';
  
  // Household
  if (name.includes('detergent') || name.includes('cleaner') || name.includes('brush')) return '20';
  if (name.includes('tissue') || name.includes('paper') || name.includes('napkin')) return '21';
  
  // Electronics
  if (name.includes('battery') || name.includes('bulb') || name.includes('wire')) return '30';
  
  // Stationery
  if (name.includes('pen') || name.includes('pencil') || name.includes('notebook')) return '40';
  
  // Default category for miscellaneous items
  return '99';
};

// Generate 6-digit product sequence from product ID
const generateProductSequence = (productId) => {
  // Convert product ID to a 6-digit number
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

// Calculate check digit using modulo 10 algorithm
const calculateCheckDigit = (barcode) => {
  let sum = 0;
  for (let i = 0; i < barcode.length; i++) {
    const digit = parseInt(barcode[i]);
    if (i % 2 === 0) {
      sum += digit;
    } else {
      sum += digit * 3;
    }
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit.toString();
};

// Generate barcode image as SVG with better quality for scanning
export const generateBarcodeImage = (barcodeValue, options = {}) => {
  const canvas = document.createElement('canvas');
  
  const defaultOptions = {
    format: 'CODE128',
    width: 3, // Increased width for better scanning
    height: 120, // Increased height
    displayValue: true,
    fontSize: 14,
    textMargin: 5,
    margin: 15, // Increased margin
    background: '#ffffff',
    lineColor: '#000000',
    textAlign: 'center',
    textPosition: 'bottom'
  };
  
  const finalOptions = { ...defaultOptions, ...options };
  
  try {
    JsBarcode(canvas, barcodeValue, finalOptions);
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error generating barcode:', error);
    return null;
  }
};

// Generate barcode as SVG string with better quality
export const generateBarcodeSVG = (barcodeValue, options = {}) => {
  const defaultOptions = {
    format: 'CODE128',
    width: 3, // Increased width
    height: 120, // Increased height
    displayValue: true,
    fontSize: 14,
    textMargin: 5,
    margin: 15, // Increased margin
    background: '#ffffff',
    lineColor: '#000000',
    textAlign: 'center',
    textPosition: 'bottom'
  };
  
  const finalOptions = { ...defaultOptions, ...options };
  
  try {
    // Create SVG element
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    JsBarcode(svg, barcodeValue, finalOptions);
    return new XMLSerializer().serializeToString(svg);
  } catch (error) {
    console.error('Error generating barcode SVG:', error);
    return null;
  }
};

// Validate barcode format
export const validateBarcode = (barcode) => {
  if (!barcode || barcode.length !== 11) {
    return false;
  }
  
  const checkDigit = barcode.slice(-1);
  const calculatedCheckDigit = calculateCheckDigit(barcode.slice(0, -1));
  
  return checkDigit === calculatedCheckDigit;
};

// Parse barcode information
export const parseBarcodeInfo = (barcode) => {
  if (!validateBarcode(barcode)) {
    return null;
  }
  
  const storePrefix = barcode.slice(0, 2);
  const categoryCode = barcode.slice(2, 4);
  const productSequence = barcode.slice(4, 10);
  const checkDigit = barcode.slice(10, 11);
  
  const categoryName = getCategoryName(categoryCode);
  
  return {
    storePrefix,
    categoryCode,
    categoryName,
    productSequence,
    checkDigit,
    fullBarcode: barcode
  };
};

// Get category name from code
const getCategoryName = (code) => {
  const categories = {
    '01': 'Grains & Cereals',
    '02': 'Oils & Fats',
    '03': 'Spices & Condiments',
    '04': 'Dairy Products',
    '05': 'Bakery Items',
    '06': 'Beverages',
    '10': 'Personal Care',
    '11': 'Cosmetics',
    '20': 'Household Cleaning',
    '21': 'Paper Products',
    '30': 'Electronics',
    '40': 'Stationery',
    '99': 'Miscellaneous'
  };
  
  return categories[code] || 'Unknown Category';
};

// Generate multiple barcodes for bulk operations
export const generateBulkBarcodes = (products) => {
  return products.map(product => ({
    ...product,
    barcode: generateProductBarcode(product.name, product.id),
    barcodeImage: null // Will be generated on demand
  }));
};

// Check if barcode already exists in inventory
export const isBarcodeUnique = (barcode, inventory, excludeId = null) => {
  return !inventory.some(item => 
    item.barcode === barcode && item.id !== excludeId
  );
};

// Generate unique barcode ensuring no duplicates
// NEW: Simply use the product code as the barcode
export const generateUniqueBarcode = (productName, productId, inventory, productCode = null) => {
  // If product has a code, use it directly as barcode
  if (productCode) {
    return productCode;
  }
  
  // If no product code, generate a simple one based on product name
  const categoryPrefix = getCategoryPrefix(productName);
  let sequence = 1;
  let barcode = `${categoryPrefix}${String(sequence).padStart(3, '0')}`;
  
  // Ensure uniqueness
  while (!isBarcodeUnique(barcode, inventory, productId) && sequence < 999) {
    sequence++;
    barcode = `${categoryPrefix}${String(sequence).padStart(3, '0')}`;
  }
  
  return barcode;
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