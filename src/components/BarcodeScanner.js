import { useState, useEffect, useRef } from 'react';
import { Camera, X, CheckCircle, AlertCircle, Keyboard, Zap } from 'lucide-react';

const BarcodeScanner = ({ onScan, onClose, isActive }) => {
  const [manualCode, setManualCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentScans, setRecentScans] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isActive && inputRef.current) {
      // Focus the input when scanner opens
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isActive]);

  const handleManualSubmit = async () => {
    const code = manualCode.trim();
    if (!code) return;

    setIsSubmitting(true);
    
    // Add to recent scans
    setRecentScans(prev => {
      const newScans = [code, ...prev.filter(s => s !== code)].slice(0, 5);
      return newScans;
    });

    try {
      console.log('Submitting barcode:', code);
      await onScan(code);
      setManualCode('');
      
      // Vibrate if supported
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
      
    } catch (error) {
      console.error('Error processing barcode:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isSubmitting) {
      handleManualSubmit();
    }
  };

  const handleRecentScanClick = (code) => {
    setManualCode(code);
    inputRef.current?.focus();
  };

  const quickCodes = [
    { code: 'RICE001', label: 'Rice' },
    { code: 'MILK001', label: 'Milk' },
    { code: 'BREAD001', label: 'Bread' },
    { code: 'EGGS001', label: 'Eggs' }
  ];

  if (!isActive) return null;

  return (
    <div className="barcode-scanner-overlay">
      <div className="barcode-scanner-modal">
        <div className="scanner-header">
          <div className="header-content">
            <Keyboard size={24} />
            <h3>Product Scanner</h3>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="scanner-content">
          {/* Main Input Section */}
          <div className="main-input-section">
            <div className="input-header">
              <CheckCircle size={20} />
              <h4>Enter Product Code or Barcode</h4>
            </div>
            
            <div className="input-group">
              <input
                ref={inputRef}
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type or scan barcode number..."
                className="main-input"
                disabled={isSubmitting}
              />
              <button
                onClick={handleManualSubmit}
                className="submit-btn"
                disabled={!manualCode.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="spinner"></div>
                    Adding...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    Add Product
                  </>
                )}
              </button>
            </div>

            <div className="input-tips">
              <div className="tip-row">
                <span className="tip-icon">🔢</span>
                <span>Enter barcode numbers (e.g., 1234567890123)</span>
              </div>
              <div className="tip-row">
                <span className="tip-icon">🏷️</span>
                <span>Use product codes (e.g., RICE001, MILK001)</span>
              </div>
              <div className="tip-row">
                <span className="tip-icon">🔍</span>
                <span>Search by name (e.g., "rice", "milk")</span>
              </div>
            </div>
          </div>

          {/* Quick Access Codes */}
          <div className="quick-codes-section">
            <h4>Quick Access</h4>
            <div className="quick-codes-grid">
              {quickCodes.map((item) => (
                <button
                  key={item.code}
                  className="quick-code-btn"
                  onClick={() => handleRecentScanClick(item.code)}
                  disabled={isSubmitting}
                >
                  <span className="code">{item.code}</span>
                  <span className="label">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Scans */}
          {recentScans.length > 0 && (
            <div className="recent-scans-section">
              <h4>Recent Scans</h4>
              <div className="recent-scans-list">
                {recentScans.map((code, index) => (
                  <button
                    key={`${code}-${index}`}
                    className="recent-scan-btn"
                    onClick={() => handleRecentScanClick(code)}
                    disabled={isSubmitting}
                  >
                    <Zap size={14} />
                    <span>{code}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Camera Scanner Notice */}
          <div className="camera-notice">
            <div className="notice-content">
              <Camera size={20} />
              <div className="notice-text">
                <h4>Camera Scanning</h4>
                <p>
                  Camera barcode scanning is currently disabled for better reliability. 
                  Manual entry provides faster and more accurate results.
                </p>
              </div>
            </div>
          </div>

          {/* Help Section */}
          <div className="help-section">
            <h4>Need Help?</h4>
            <div className="help-grid">
              <div className="help-item">
                <AlertCircle size={16} />
                <div>
                  <strong>Product not found?</strong>
                  <p>Try using the product name or check if the product exists in inventory.</p>
                </div>
              </div>
              <div className="help-item">
                <CheckCircle size={16} />
                <div>
                  <strong>Multiple formats supported:</strong>
                  <p>Barcodes, product codes, or partial product names all work.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;