import { useState, useEffect } from 'react';
import { Trash2, Receipt, AlertCircle, Camera, Package, Printer, Download, FileText, X } from 'lucide-react';
import { saveSale, updateStock } from '../services/firebaseService';
import { getStoreSettings, calculateBillTotal, formatCurrency, getTaxDisplayName } from '../services/storeSettingsService';
import QRCodeScanner from './QRCodeScanner';
import { printBill, downloadBill, generatePDF } from '../utils/billGenerator';
import { useAuth } from '../contexts/AuthContext';
import { getUserStoreId, getUserStoreName } from '../utils/roleManager';

const BillingTable = ({ cart, inventory, updateQty, removeItem, clearCart, addToCart }) => {
  const { currentUser } = useAuth();
  const userStoreId = getUserStoreId(currentUser?.email);
  const userStoreName = getUserStoreName(currentUser?.email);
  const [isProcessing, setIsProcessing] = useState(false);
  const [productCode, setProductCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [scannerActive, setScannerActive] = useState(false);
  const [showBillActions, setShowBillActions] = useState(false);
  const [lastBillData, setLastBillData] = useState(null);
  const [storeSettings, setStoreSettings] = useState({ taxRate: 18, currency: 'INR', currencySymbol: '₹' });

  // Load store settings
  useEffect(() => {
    const loadStoreSettings = async () => {
      if (userStoreId) {
        try {
          const settings = await getStoreSettings(userStoreId);
          setStoreSettings(settings);
        } catch (error) {
          console.error('Error loading store settings:', error);
        }
      }
    };
    
    loadStoreSettings();
  }, [userStoreId]);

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const discountAmount = (subtotal * discount) / 100;
  
  // Use dynamic tax calculation from store settings
  const billCalculation = calculateBillTotal(subtotal, storeSettings.taxRate, discountAmount);
  const { taxAmount, total } = billCalculation;

  const handleFetchProduct = (codeToSearch = null) => {
    const searchCode = codeToSearch || productCode;
    
    if (!searchCode.trim()) {
      alert('Please enter a product code');
      return;
    }

    // Search by QR code first, then barcode, then product code, then ID, then name
    const product = inventory.find(p => 
      p.qrcode === searchCode.trim() ||
      p.barcode === searchCode.trim() ||
      p.code === searchCode.trim().toUpperCase() ||
      p.id.toLowerCase() === searchCode.toLowerCase() || 
      p.name.toLowerCase().includes(searchCode.toLowerCase())
    );

    if (product) {
      if (product.stock > 0) {
        addToCart(product);
        setProductCode('');
        console.log('✅ Product added to cart:', product.name);
      } else {
        alert('Product is out of stock!');
      }
    } else {
      console.log('❌ Product not found for code:', searchCode);
      alert(`Product not found! Please check the QR code, barcode, or product code: ${searchCode}`);
    }
  };

  const handleScannerToggle = () => {
    setScannerActive(!scannerActive);
  };

  const handleCompleteCheckout = async () => {
    if (cart.length === 0) {
      alert('Cart is empty!');
      return;
    }

    setIsProcessing(true);
    try {
      // Prepare sale data
      const saleData = {
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          qty: item.qty,
          total: item.price * item.qty
        })),
        subtotal: subtotal,
        taxRate: storeSettings.taxRate,
        taxAmount: taxAmount,
        discount: discountAmount,
        total: total,
        paymentMode: paymentMode,
        itemCount: cart.reduce((acc, item) => acc + item.qty, 0),
        timestamp: Date.now(),
        storeId: userStoreId,
        storeName: userStoreName,
        cashierEmail: currentUser?.email,
        currency: storeSettings.currency,
        currencySymbol: storeSettings.currencySymbol
      };

      // Save sale to Firebase (will generate bill number automatically)
      const billNumber = await saveSale(saleData);

      // Update stock levels
      const stockUpdates = cart.map(item => {
        const currentProduct = inventory.find(p => p.id === item.id);
        return {
          id: item.id,
          newStock: currentProduct.stock - item.qty
        };
      });

      await updateStock(stockUpdates);

      // Store bill data for printing/downloading (include bill number)
      setLastBillData({
        ...saleData,
        billNumber: billNumber
      });
      
      // Clear cart and show success with bill options
      clearCart();
      setDiscount(0);
      setShowBillActions(true);
      
    } catch (error) {
      console.error('Error processing sale:', error);
      alert('Error processing sale. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrintBill = () => {
    if (lastBillData) {
      printBill(lastBillData);
    }
  };

  const handleDownloadBill = () => {
    if (lastBillData) {
      downloadBill(lastBillData);
    }
  };

  const handleDownloadPDF = () => {
    if (lastBillData) {
      generatePDF(lastBillData);
    }
  };

  const closeBillActions = () => {
    setShowBillActions(false);
    setLastBillData(null);
  };

  const getStockWarning = (item) => {
    const product = inventory.find(p => p.id === item.id);
    if (!product) return null;
    
    if (product.stock < item.qty) {
      return 'Insufficient stock!';
    }
    if (product.stock - item.qty < 5) {
      return 'Low stock after sale';
    }
    return null;
  };

  return (
    <div className="billing-container">
      {/* Product Scanner Section */}
      <div className="scanner-section">
        <div className="scanner-card">
          <div className="scanner-header">
            <Camera size={20} />
            <h2>Product Scanner (Demo)</h2>
          </div>
          
          <div className="scanner-info">
            <AlertCircle size={16} />
            <p>Camera scanner shows video feed but may have detection issues. Use manual entry below for reliable barcode input, or try scanning with better lighting and positioning.</p>
          </div>

          <div className="camera-section">
            <h3>Camera Scanner</h3>
            <div className="camera-preview">
              <div className="camera-placeholder">
                <Camera size={48} />
                <p>Camera will appear here</p>
              </div>
            </div>
            
            <button 
              className={`scanner-btn ${scannerActive ? 'active' : 'inactive'}`}
              onClick={handleScannerToggle}
              disabled={isProcessing}
            >
              {scannerActive ? 'Close Scanner' : 'Open Scanner'}
            </button>
          </div>

          <div className="manual-entry">
            <h3>🔍 Barcode / Product Search</h3>
            <p>Enter barcode number, product code, product ID, or product name:</p>
            <div className="input-container">
              <input
                type="text"
                placeholder="Enter: 78011234567 (barcode) or RICE001 (code) or Rice (name)"
                value={productCode}
                onChange={(e) => setProductCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFetchProduct()}
                disabled={isProcessing}
                className="product-code-input"
              />
            </div>
            <button 
              className="fetch-btn"
              onClick={handleFetchProduct}
              disabled={isProcessing}
              style={{ padding: '12px 20px', fontSize: '16px' }}
            >
              🔍 Find & Add Product
            </button>
            <div className="search-help">
              <small>
                💡 <strong>Tip:</strong> You can search by barcode (78011234567), product code (RICE001), product ID, or product name (Rice)
              </small>
            </div>
          </div>

          <div className="product-list-section">
            <div className="list-header">
              <Package size={20} />
              <h3>Or Select from List</h3>
            </div>
            
            <div className="product-selector">
              <select 
                onChange={(e) => {
                  const product = inventory.find(p => p.id === e.target.value);
                  if (product && product.stock > 0) {
                    addToCart(product);
                  }
                }}
                disabled={isProcessing}
                className="product-select"
              >
                <option value="">Select Product</option>
                {inventory.map(product => (
                  <option 
                    key={product.id} 
                    value={product.id}
                    disabled={product.stock === 0}
                  >
                    {product.name} - ₹{product.price} {product.stock === 0 ? '(Out of Stock)' : `(${product.stock} available)`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Bill Summary Section */}
      <div className="bill-summary-section">
        <div className="bill-summary-card">
          <div className="bill-header">
            <Receipt size={20} />
            <h2>Bill Summary</h2>
          </div>

          <div className="bill-details">
            <div className="bill-row">
              <span>Subtotal:</span>
              <span>{formatCurrency(subtotal, storeSettings.currency, storeSettings.currencySymbol)}</span>
            </div>
            
            <div className="bill-row">
              <span>{getTaxDisplayName(storeSettings.currency)} ({storeSettings.taxRate}%):</span>
              <span>{formatCurrency(taxAmount, storeSettings.currency, storeSettings.currencySymbol)}</span>
            </div>

            <div className="discount-section">
              <label>Discount (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={discount}
                onChange={(e) => setDiscount(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                disabled={isProcessing}
                className="discount-input"
              />
            </div>

            <div className="bill-row total-row">
              <span>Total:</span>
              <span>{formatCurrency(total, storeSettings.currency, storeSettings.currencySymbol)}</span>
            </div>

            <div className="payment-section">
              <label>Payment Mode</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                disabled={isProcessing}
                className="payment-select"
              >
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="UPI">UPI</option>
                <option value="Net Banking">Net Banking</option>
              </select>
            </div>

            <button
              className="complete-checkout-btn"
              onClick={handleCompleteCheckout}
              disabled={cart.length === 0 || isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Complete Checkout'}
            </button>
          </div>
        </div>

        {cart.length > 0 && (
          <div className="cart-items">
            <h3>Cart Items ({cart.reduce((acc, item) => acc + item.qty, 0)})</h3>
            <div className="cart-list">
              {cart.map(item => {
                const product = inventory.find(p => p.id === item.id);
                const stockWarning = getStockWarning(item);
                
                return (
                  <div key={item.id} className={`cart-item ${stockWarning ? 'stock-warning' : ''}`}>
                    <div className="item-info">
                      <span className="item-name">{item.name}</span>
                      <span className="item-price">₹{item.price.toFixed(2)} x {item.qty}</span>
                      {stockWarning && (
                        <div className="warning-text">
                          <AlertCircle size={12} />
                          {stockWarning}
                        </div>
                      )}
                    </div>
                    <div className="item-controls">
                      <input 
                        type="number" 
                        className="qty-input"
                        value={item.qty} 
                        min="1"
                        max={product?.stock || 999}
                        onChange={(e) => updateQty(item.id, e.target.value)} 
                        disabled={isProcessing}
                      />
                      <span className="item-total">₹{(item.price * item.qty).toFixed(2)}</span>
                      <button 
                        className="remove-btn" 
                        onClick={() => removeItem(item.id)}
                        disabled={isProcessing}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <button className="clear-cart-btn" onClick={clearCart} disabled={isProcessing}>
              Clear All Items
            </button>
          </div>
        )}
      </div>

      {/* Bill Actions Modal */}
      {showBillActions && lastBillData && (
        <div className="bill-actions-overlay">
          <div className="bill-actions-modal">
            <div className="bill-actions-header">
              <Receipt size={24} />
              <h3>Bill Processed Successfully!</h3>
              <button className="close-btn" onClick={closeBillActions}>
                <X size={20} />
              </button>
            </div>
            
            <div className="bill-summary">
              <div className="success-message">
                <div className="success-icon">✓</div>
                <div className="success-details">
                  <p><strong>Bill Number: {lastBillData.billNumber}</strong></p>
                  <p><strong>Total Amount: ₹{lastBillData.total.toFixed(2)}</strong></p>
                  <p>Payment Mode: {lastBillData.paymentMode}</p>
                  <p>Items: {lastBillData.itemCount}</p>
                </div>
              </div>
            </div>

            <div className="bill-actions">
              <h4>Choose an action:</h4>
              <div className="action-buttons">
                <button 
                  className="action-btn print-btn"
                  onClick={handlePrintBill}
                >
                  <Printer size={20} />
                  Print Bill
                </button>
                
                <button 
                  className="action-btn download-btn"
                  onClick={handleDownloadBill}
                >
                  <Download size={20} />
                  Download HTML
                </button>
                
                <button 
                  className="action-btn pdf-btn"
                  onClick={handleDownloadPDF}
                >
                  <FileText size={20} />
                  Save as PDF
                </button>
              </div>
              
              <div className="action-info">
                <p><strong>Print Bill:</strong> Opens print dialog for immediate printing</p>
                <p><strong>Download HTML:</strong> Downloads bill as HTML file</p>
                <p><strong>Save as PDF:</strong> Opens print dialog - select "Save as PDF"</p>
              </div>
              
              <button 
                className="continue-btn"
                onClick={closeBillActions}
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Scanner */}
      <QRCodeScanner 
        isActive={scannerActive}
        onScan={(code) => {
          console.log('QR Code scanned in BillingTable:', code);
          handleFetchProduct(code);
          setScannerActive(false);
        }}
        onClose={() => setScannerActive(false)}
      />
    </div>
  );
};

export default BillingTable;