import { useState, useEffect } from 'react';
import { Camera, X, CheckCircle } from 'lucide-react';
import BarcodeScannerComponent from 'react-qr-barcode-scanner';

const BarcodeScanner = ({ onScan, onClose, isActive }) => {
  const [error, setError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (isActive) {
      setIsScanning(true);
      setError(null);
    } else {
      setIsScanning(false);
    }
  }, [isActive]);

  const handleScan = (result) => {
    if (result) {
      console.log('Barcode scanned:', result);
      onScan(result);
      setIsScanning(false);
    }
  };

  const handleError = (error) => {
    console.error('Scanner error:', error);
    
    // Don't show error for common "no barcode detected" messages
    if (error?.message?.includes('No MultiFormat Readers')) {
      // This is normal - just means no barcode is currently visible
      return;
    }
    
    // Show actual errors
    setError(error?.message || 'Scanner error occurred');
  };

  const handleManualInput = (code) => {
    if (code.trim()) {
      onScan(code.trim());
      onClose();
    }
  };

  const retryScanner = () => {
    setError(null);
    setIsScanning(true);
  };

  if (!isActive) return null;

  return (
    <div className="scanner-overlay">
      <div className="scanner-modal">
        <div className="scanner-header">
          <h3>Barcode Scanner</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="scanner-content">
          {error ? (
            <div className="scanner-error">
              <div className="error-message">
                <Camera size={48} />
                <h4>Camera Access Failed</h4>
                <p>{error}</p>
                <p>Please ensure:</p>
                <ul>
                  <li>Camera permissions are granted</li>
                  <li>No other app is using the camera</li>
                  <li>You're using HTTPS (required for camera access)</li>
                </ul>
                <button onClick={retryScanner} className="retry-btn">
                  Try Again
                </button>
              </div>
            </div>
          ) : isScanning ? (
            <div className="camera-container">
              <BarcodeScannerComponent
                width={500}
                height={400}
                onUpdate={(err, result) => {
                  if (err) {
                    // Only show error if it's not the common "no code detected" message
                    if (!err.message?.includes('No MultiFormat Readers')) {
                      handleError(err);
                    }
                    return;
                  }
                  if (result) {
                    console.log('Barcode detected:', result.text);
                    handleScan(result.text);
                  }
                }}
                onError={handleError}
                facingMode="environment"
                delay={100}
                torch={false}
              />
              <div className="scanner-overlay-frame">
                <div className="scanner-frame"></div>
                <p>Position barcode within the frame</p>
                <p className="scanner-status">Scanning for barcodes...</p>
                <p className="scanner-hint">Hold steady and ensure good lighting</p>
              </div>
            </div>
          ) : (
            <div className="scanner-loading">
              <Camera size={48} />
              <p>Initializing camera...</p>
            </div>
          )}

          <div className="manual-input-section">
            <h4>Manual Entry</h4>
            <p>Can't scan? Enter the barcode manually:</p>
            <div className="manual-input-group">
              <input
                type="text"
                placeholder="Enter barcode (e.g., 78011234567)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleManualInput(e.target.value);
                  }
                }}
                className="manual-input"
                autoFocus
              />
              <button
                onClick={(e) => {
                  const input = e.target.previousElementSibling;
                  handleManualInput(input.value);
                }}
                className="manual-submit-btn"
              >
                <CheckCircle size={16} />
                Add Product
              </button>
            </div>
          </div>

          <div className="scanner-tips">
            <h4>Scanning Tips:</h4>
            <ul>
              <li>Hold the camera steady and close to the barcode</li>
              <li>Ensure good lighting - avoid shadows</li>
              <li>Keep barcode flat and clear (not blurry)</li>
              <li>Try different distances (6-12 inches usually works best)</li>
              <li>Make sure the entire barcode is visible in the frame</li>
              <li>If scanning fails, use manual entry below</li>
            </ul>
            
            <div className="scanner-note">
              <p><strong>Note:</strong> The scanner works best with CODE128 barcodes. If you see "No MultiFormat Readers" error, try adjusting the distance and lighting, or use manual entry.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;