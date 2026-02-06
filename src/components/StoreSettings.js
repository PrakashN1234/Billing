import { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  RefreshCw, 
  Percent, 
  DollarSign, 
  Store, 
  Phone, 
  Mail, 
  MapPin,
  FileText,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { 
  subscribeToStoreSettings,
  updateStoreSettings, 
  validateGSTNumber,
  getTaxDisplayName,
  DEFAULT_STORE_SETTINGS
} from '../services/storeSettingsService';
import { useAuth } from '../contexts/AuthContext';
import { getUserStoreId, getUserStoreName } from '../utils/roleManager';

const StoreSettings = () => {
  const { currentUser } = useAuth();
  const userStoreId = getUserStoreId(currentUser?.email);
  const userStoreName = getUserStoreName(currentUser?.email);
  
  const [settings, setSettings] = useState(DEFAULT_STORE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('tax');

  useEffect(() => {
    if (!userStoreId) {
      setLoading(false);
      return;
    }

    // Subscribe to real-time settings updates
    const unsubscribe = subscribeToStoreSettings(userStoreId, (storeSettings) => {
      setSettings(storeSettings);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userStoreId]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveSettings = async () => {
    if (!userStoreId) {
      showMessage('error', 'Store ID not found. Please contact administrator.');
      return;
    }

    setSaving(true);
    try {
      // Validate GST number if provided
      if (settings.gstNumber && !validateGSTNumber(settings.gstNumber)) {
        showMessage('error', 'Invalid GST number format. Please check and try again.');
        setSaving(false);
        return;
      }

      await updateStoreSettings(userStoreId, settings);
      showMessage('success', 'Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      showMessage('error', error.message || 'Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    if (window.confirm('Are you sure you want to reset all settings to default values?')) {
      setSettings(DEFAULT_STORE_SETTINGS);
      showMessage('info', 'Settings reset to defaults. Click Save to apply changes.');
    }
  };

  const tabs = [
    { id: 'tax', label: 'Tax & Pricing', icon: Percent },
    { id: 'business', label: 'Business Info', icon: Store },
    { id: 'receipt', label: 'Receipt Settings', icon: FileText },
    { id: 'scanning', label: 'Scanning Method', icon: Settings },
    { id: 'general', label: 'General', icon: Settings }
  ];

  if (loading) {
    return (
      <div className="store-settings">
        <div className="loading-state">
          <Settings size={48} />
          <p>Loading store settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="store-settings">
      <div className="settings-header">
        <div className="header-info">
          <h1>Store Settings</h1>
          <p>Configure settings for {userStoreName}</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn-secondary" 
            onClick={handleResetToDefaults}
            disabled={saving}
          >
            <RefreshCw size={16} />
            Reset to Defaults
          </button>
          <button 
            className="btn-primary" 
            onClick={handleSaveSettings}
            disabled={saving}
          >
            {saving ? (
              <>
                <RefreshCw size={16} className="spinning" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.type === 'success' && <CheckCircle size={16} />}
          {message.type === 'error' && <AlertCircle size={16} />}
          {message.type === 'info' && <AlertCircle size={16} />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="settings-content">
        <div className="settings-tabs">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="settings-panel">
          {activeTab === 'tax' && (
            <div className="settings-section">
              <h3>Tax & Pricing Configuration</h3>
              
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="taxRate">
                    <Percent size={16} />
                    {getTaxDisplayName(settings.currency)} Rate (%)
                  </label>
                  <input
                    type="number"
                    id="taxRate"
                    value={settings.taxRate}
                    onChange={(e) => handleInputChange('taxRate', parseFloat(e.target.value) || 0)}
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="18.00"
                  />
                  <small className="form-hint">
                    Current rate: {settings.taxRate}% - Applied to all sales
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="currency">
                    <DollarSign size={16} />
                    Currency
                  </label>
                  <select
                    id="currency"
                    value={settings.currency}
                    onChange={(e) => {
                      const currency = e.target.value;
                      const symbols = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
                      handleInputChange('currency', currency);
                      handleInputChange('currencySymbol', symbols[currency] || '$');
                    }}
                  >
                    <option value="INR">Indian Rupee (₹)</option>
                    <option value="USD">US Dollar ($)</option>
                    <option value="EUR">Euro (€)</option>
                    <option value="GBP">British Pound (£)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="enableDiscounts">
                    Enable Discounts
                  </label>
                  <div className="checkbox-group">
                    <input
                      type="checkbox"
                      id="enableDiscounts"
                      checked={settings.enableDiscounts}
                      onChange={(e) => handleInputChange('enableDiscounts', e.target.checked)}
                    />
                    <span>Allow discounts on bills</span>
                  </div>
                </div>

                {settings.enableDiscounts && (
                  <div className="form-group">
                    <label htmlFor="maxDiscountPercent">
                      Maximum Discount (%)
                    </label>
                    <input
                      type="number"
                      id="maxDiscountPercent"
                      value={settings.maxDiscountPercent}
                      onChange={(e) => handleInputChange('maxDiscountPercent', parseFloat(e.target.value) || 0)}
                      min="0"
                      max="100"
                      step="0.01"
                      placeholder="50.00"
                    />
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="roundingMethod">
                    Bill Rounding Method
                  </label>
                  <select
                    id="roundingMethod"
                    value={settings.roundingMethod}
                    onChange={(e) => handleInputChange('roundingMethod', e.target.value)}
                  >
                    <option value="round">Round to nearest</option>
                    <option value="floor">Round down</option>
                    <option value="ceil">Round up</option>
                  </select>
                </div>
              </div>

              <div className="tax-preview">
                <h4>Tax Calculation Preview</h4>
                <div className="preview-calculation">
                  <div className="calc-row">
                    <span>Sample Amount:</span>
                    <span>{settings.currencySymbol}1,000.00</span>
                  </div>
                  <div className="calc-row">
                    <span>{getTaxDisplayName(settings.currency)} ({settings.taxRate}%):</span>
                    <span>{settings.currencySymbol}{((1000 * settings.taxRate) / 100).toFixed(2)}</span>
                  </div>
                  <div className="calc-row total">
                    <span>Total:</span>
                    <span>{settings.currencySymbol}{(1000 + (1000 * settings.taxRate) / 100).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'business' && (
            <div className="settings-section">
              <h3>Business Information</h3>
              
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="businessName">
                    <Store size={16} />
                    Business Name
                  </label>
                  <input
                    type="text"
                    id="businessName"
                    value={settings.businessName}
                    onChange={(e) => handleInputChange('businessName', e.target.value)}
                    placeholder="Your Business Name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="businessAddress">
                    <MapPin size={16} />
                    Business Address
                  </label>
                  <textarea
                    id="businessAddress"
                    value={settings.businessAddress}
                    onChange={(e) => handleInputChange('businessAddress', e.target.value)}
                    placeholder="Complete business address"
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="businessPhone">
                    <Phone size={16} />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="businessPhone"
                    value={settings.businessPhone}
                    onChange={(e) => handleInputChange('businessPhone', e.target.value)}
                    placeholder="+91 9876543210"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="businessEmail">
                    <Mail size={16} />
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="businessEmail"
                    value={settings.businessEmail}
                    onChange={(e) => handleInputChange('businessEmail', e.target.value)}
                    placeholder="business@example.com"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="gstNumber">
                    <FileText size={16} />
                    GST Number (Optional)
                  </label>
                  <input
                    type="text"
                    id="gstNumber"
                    value={settings.gstNumber}
                    onChange={(e) => handleInputChange('gstNumber', e.target.value.toUpperCase())}
                    placeholder="22AAAAA0000A1Z5"
                    maxLength="15"
                  />
                  <small className="form-hint">
                    Format: 2 digits + 10 characters + 1 digit + Z + 1 digit
                  </small>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'receipt' && (
            <div className="settings-section">
              <h3>Receipt & Invoice Settings</h3>
              
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="receiptFooter">
                    Receipt Footer Message
                  </label>
                  <textarea
                    id="receiptFooter"
                    value={settings.receiptFooter}
                    onChange={(e) => handleInputChange('receiptFooter', e.target.value)}
                    placeholder="Thank you for shopping with us!"
                    rows="2"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="enableTaxInvoice">
                    Tax Invoice Format
                  </label>
                  <div className="checkbox-group">
                    <input
                      type="checkbox"
                      id="enableTaxInvoice"
                      checked={settings.enableTaxInvoice}
                      onChange={(e) => handleInputChange('enableTaxInvoice', e.target.checked)}
                    />
                    <span>Generate tax invoices (includes GST details)</span>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="printLogo">
                    Print Logo
                  </label>
                  <div className="checkbox-group">
                    <input
                      type="checkbox"
                      id="printLogo"
                      checked={settings.printLogo}
                      onChange={(e) => handleInputChange('printLogo', e.target.checked)}
                    />
                    <span>Include business logo on receipts</span>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="decimalPlaces">
                    Decimal Places
                  </label>
                  <select
                    id="decimalPlaces"
                    value={settings.decimalPlaces}
                    onChange={(e) => handleInputChange('decimalPlaces', parseInt(e.target.value))}
                  >
                    <option value="0">0 (₹100)</option>
                    <option value="1">1 (₹100.0)</option>
                    <option value="2">2 (₹100.00)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'scanning' && (
            <div className="settings-section">
              <h3>Scanning Method Settings</h3>
              
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="preferredScanningMethod">
                    Preferred Scanning Method for Cashiers
                  </label>
                  <select
                    id="preferredScanningMethod"
                    value={settings.preferredScanningMethod || 'qrcode'}
                    onChange={(e) => handleInputChange('preferredScanningMethod', e.target.value)}
                  >
                    <option value="qrcode">QR Code (Recommended for Mobile)</option>
                    <option value="barcode">Barcode (Traditional Scanner)</option>
                    <option value="both">Both (Allow Either)</option>
                  </select>
                  <small className="form-hint">
                    QR codes work better with mobile phone cameras
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="enableQRCodeScanning">
                    Enable QR Code Scanning
                  </label>
                  <div className="checkbox-group">
                    <input
                      type="checkbox"
                      id="enableQRCodeScanning"
                      checked={settings.enableQRCodeScanning !== false}
                      onChange={(e) => handleInputChange('enableQRCodeScanning', e.target.checked)}
                    />
                    <span>Allow cashiers to scan QR codes during billing</span>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="enableBarcodeScanning">
                    Enable Barcode Scanning
                  </label>
                  <div className="checkbox-group">
                    <input
                      type="checkbox"
                      id="enableBarcodeScanning"
                      checked={settings.enableBarcodeScanning !== false}
                      onChange={(e) => handleInputChange('enableBarcodeScanning', e.target.checked)}
                    />
                    <span>Allow cashiers to scan traditional barcodes</span>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="enableManualEntry">
                    Enable Manual Code Entry
                  </label>
                  <div className="checkbox-group">
                    <input
                      type="checkbox"
                      id="enableManualEntry"
                      checked={settings.enableManualEntry !== false}
                      onChange={(e) => handleInputChange('enableManualEntry', e.target.checked)}
                    />
                    <span>Allow cashiers to manually type product codes</span>
                  </div>
                </div>
              </div>

              <div className="scanning-info-box">
                <h4>Why QR Codes?</h4>
                <ul>
                  <li>✅ Better mobile camera compatibility</li>
                  <li>✅ Faster scanning with smartphones</li>
                  <li>✅ Works in various lighting conditions</li>
                  <li>✅ More reliable detection</li>
                  <li>✅ Can store more information</li>
                </ul>
                <p className="info-note">
                  <strong>Note:</strong> Both barcodes and QR codes will be displayed in inventory. 
                  This setting controls which method is preferred for cashier billing.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'general' && (
            <div className="settings-section">
              <h3>General Settings</h3>
              
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="lowStockThreshold">
                    <AlertCircle size={16} />
                    Low Stock Threshold
                  </label>
                  <input
                    type="number"
                    id="lowStockThreshold"
                    value={settings.lowStockThreshold}
                    onChange={(e) => handleInputChange('lowStockThreshold', parseInt(e.target.value) || 0)}
                    min="1"
                    placeholder="10"
                  />
                  <small className="form-hint">
                    Alert when product stock falls below this number
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="autoGenerateCodes">
                    Auto-generate Product Codes
                  </label>
                  <div className="checkbox-group">
                    <input
                      type="checkbox"
                      id="autoGenerateCodes"
                      checked={settings.autoGenerateCodes}
                      onChange={(e) => handleInputChange('autoGenerateCodes', e.target.checked)}
                    />
                    <span>Automatically create product codes for new items</span>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="autoGenerateBarcodes">
                    Auto-generate Barcodes
                  </label>
                  <div className="checkbox-group">
                    <input
                      type="checkbox"
                      id="autoGenerateBarcodes"
                      checked={settings.autoGenerateBarcodes}
                      onChange={(e) => handleInputChange('autoGenerateBarcodes', e.target.checked)}
                    />
                    <span>Automatically create barcodes for new products</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreSettings;