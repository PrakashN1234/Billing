import { useState, useEffect, useRef } from 'react';
import { Camera, X, CheckCircle, AlertCircle, Keyboard, Zap, QrCode } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

const QRCodeScanner = ({ onScan, onClose, isActive }) => {
  const [manualCode, setManualCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentScans, setRecentScans] = useState([]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [scanSuccess, setScanSuccess] = useState(false);
  const inputRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const scannerIdRef = useRef('qr-reader');

  useEffect(() => {
    if (isActive && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }

    return () => {
      stopCamera();
    };
  }, [isActive]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      setIsCameraActive(true);

      // Initialize Html5Qrcode
      html5QrCodeRef.current = new Html5Qrcode(scannerIdRef.current);

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };

      await html5QrCodeRef.current.start(
        { facingMode: 'environment' }, // Use back camera
        config,
        (decodedText) => {
          // QR code successfully scanned
          console.log('QR Code scanned:', decodedText);
          handleScannedCode(decodedText);
        },
        (errorMessage) => {
          // Scanning error (usually just "no QR code found")
          // Don't show these as errors
        }
      );
    } catch (error) {
      console.error('Camera error:', error);
      setCameraError(error.message || 'Failed to access camera');
      setIsCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current && isCameraActive) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current = null;
      } catch (error) {
        console.error('Error stopping camera:', error);
      }
    }
    setIsCameraActive(false);
  };

  const handleScannedCode = async (code) => {
    setScanSuccess(true);
    
    // Vibrate if supported
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }

    // Add to recent scans
    setRecentScans(prev => {
      const newScans = [code, ...prev.filter(s => s !== code)].slice(0, 5);
      return newScans;
    });

    // Stop camera and submit
    await stopCamera();
    
    setTimeout(() => {
      setScanSuccess(false);
    }, 1000);

    handleSubmit(code);
  };

  const handleSubmit = async (code) => {
    setIsSubmitting(true);
    
    try {
      console.log('Submitting code:', code);
      await onScan(code);
      setManualCode('');
    } catch (error) {
      console.error('Error processing code:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualSubmit = () => {
    const code = manualCode.trim();
    if (!code) return;
    handleSubmit(code);
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
    <div className="qrcode-scanner-overlay">
      <div className="qrcode-scanner-modal">
        <div className="scanner-header">
          <div className="header-content">
            <QrCode size={24} />
            <h3>QR Code Scanner</h3>
            {scanSuccess && (
              <div className="scan-success-badge">
                <CheckCircle size={16} />
                <span>Scanned!</span>
              </div>
            )}
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="scanner-content">
          {/* Camera Scanner Section */}
          <div className="camera-scanner-section">
            <div className="section-header">
              <Camera size={20} />
              <h4>Camera Scanner</h4>
            </div>

            {!isCameraActive && !cameraError && (
              <div className="camera-start">
                <div className="start-content">
                  <QrCode size={48} />
                  <p>Scan QR codes with your camera for quick product entry</p>
                  <button onClick={startCamera} className="start-camera-btn">
                    <Camera size={16} />
                    Start Camera
                  </button>
                </div>
              </div>
            )}

            {cameraError && (
              <div className="camera-error">
                <AlertCircle size={32} />
                <h4>Camera Access Failed</h4>
                <p>{cameraError}</p>
                <div className="error-tips">
                  <p>Try these solutions:</p>
                  <ul>
                    <li>Grant camera permissions</li>
                    <li>Use HTTPS connection</li>
                    <li>Close other apps using camera</li>
                    <li>Use manual entry below</li>
                  </ul>
                </div>
                <button onClick={startCamera} className="retry-btn">
                  Try Again
                </button>
              </div>
            )}

            {isCameraActive && (
              <div className="camera-active">
                <div id={scannerIdRef.current} className="qr-reader"></div>
                <div className="camera-controls">
                  <button onClick={stopCamera} className="stop-camera-btn">
                    <X size={16} />
                    Stop Camera
                  </button>
                </div>
                <div className="scanning-tips">
                  <p>📱 Hold steady • 💡 Good lighting • 🎯 Center QR code</p>
                </div>
              </div>
            )}
          </div>

          {/* Manual Entry Section */}
          <div className="manual-entry-section">
            <div className="section-header">
              <Keyboard size={20} />
              <h4>Manual Entry</h4>
            </div>
            
            <div className="input-group">
              <input
                ref={inputRef}
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type QR code or product code..."
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
                <span>QR code data (e.g., ST001_GRAIN_000123)</span>
              </div>
              <div className="tip-row">
                <span className="tip-icon">🏷️</span>
                <span>Product codes (e.g., RICE001, MILK001)</span>
              </div>
              <div className="tip-row">
                <span className="tip-icon">🔍</span>
                <span>Product names (e.g., "rice", "milk")</span>
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

          {/* Help Section */}
          <div className="help-section">
            <h4>Why QR Codes?</h4>
            <div className="help-grid">
              <div className="help-item">
                <CheckCircle size={16} />
                <div>
                  <strong>Better mobile scanning</strong>
                  <p>QR codes work much better with phone cameras than traditional barcodes.</p>
                </div>
              </div>
              <div className="help-item">
                <CheckCircle size={16} />
                <div>
                  <strong>More reliable</strong>
                  <p>Faster detection and works in various lighting conditions.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeScanner;