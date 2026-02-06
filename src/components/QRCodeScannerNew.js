import { useState, useEffect, useRef } from 'react';
import { Camera, X, CheckCircle, AlertCircle, Keyboard, Zap, QrCode } from 'lucide-react';
import { BrowserMultiFormatReader } from '@zxing/browser';

const QRCodeScannerNew = ({ onScan, onClose, isActive }) => {
  const [manualCode, setManualCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentScans, setRecentScans] = useState([]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState('');
  const inputRef = useRef(null);
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);

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

      // Initialize ZXing code reader
      codeReaderRef.current = new BrowserMultiFormatReader();

      // Get available video devices
      const videoInputDevices = await codeReaderRef.current.listVideoInputDevices();
      
      if (videoInputDevices.length === 0) {
        throw new Error('No camera found on this device');
      }

      // Prefer back camera on mobile
      const backCamera = videoInputDevices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear')
      );
      const selectedDeviceId = backCamera ? backCamera.deviceId : videoInputDevices[0].deviceId;

      console.log('📷 Starting camera:', selectedDeviceId);

      // Start decoding from video device
      await codeReaderRef.current.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current,
        (result, error) => {
          if (result) {
            const scannedCode = result.getText();
            console.log('✅ QR Code detected:', scannedCode);
            
            // Prevent duplicate scans
            if (scannedCode !== lastScannedCode) {
              setLastScannedCode(scannedCode);
              handleScannedCode(scannedCode);
            }
          }
          
          // Ignore errors (they happen constantly when no QR code is in view)
          if (error && error.name !== 'NotFoundException') {
            console.warn('Scanner error:', error);
          }
        }
      );

      console.log('✅ Camera started successfully');
    } catch (error) {
      console.error('❌ Camera error:', error);
      setCameraError(error.message || 'Failed to access camera');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (codeReaderRef.current) {
      try {
        codeReaderRef.current.reset();
        console.log('📷 Camera stopped');
      } catch (error) {
        console.error('Error stopping camera:', error);
      }
    }
    setIsCameraActive(false);
    setLastScannedCode('');
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
    stopCamera();
    
    setTimeout(() => {
      setScanSuccess(false);
    }, 1000);

    handleSubmit(code);
  };

  const handleSubmit = async (code) => {
    setIsSubmitting(true);
    
    try {
      console.log('📤 Submitting code:', code);
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
                    <li>✅ Grant camera permissions in browser settings</li>
                    <li>✅ Use HTTPS connection (required for camera)</li>
                    <li>✅ Close other apps using camera</li>
                    <li>✅ Try a different browser (Chrome/Safari recommended)</li>
                    <li>✅ Use manual entry below as alternative</li>
                  </ul>
                </div>
                <button onClick={startCamera} className="retry-btn">
                  Try Again
                </button>
              </div>
            )}

            {isCameraActive && (
              <div className="camera-active">
                <div className="video-container">
                  <video 
                    ref={videoRef} 
                    className="scanner-video"
                    playsInline
                    muted
                  />
                  <div className="scan-overlay">
                    <div className="scan-frame"></div>
                  </div>
                </div>
                <div className="camera-controls">
                  <button onClick={stopCamera} className="stop-camera-btn">
                    <X size={16} />
                    Stop Camera
                  </button>
                </div>
                <div className="scanning-tips">
                  <p>📱 Hold steady • 💡 Good lighting • 🎯 Center QR code in frame</p>
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
                placeholder="Type QR code, barcode, or product code..."
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
                <span className="tip-icon">📊</span>
                <span>Barcode (e.g., RICE_000001)</span>
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
            <h4>Troubleshooting</h4>
            <div className="help-grid">
              <div className="help-item">
                <CheckCircle size={16} />
                <div>
                  <strong>Product not found?</strong>
                  <p>Make sure QR codes are generated for your products. Go to Admin Dashboard → Manage Barcodes → Generate QR Codes.</p>
                </div>
              </div>
              <div className="help-item">
                <CheckCircle size={16} />
                <div>
                  <strong>Camera not working?</strong>
                  <p>Ensure you're using HTTPS and have granted camera permissions. Use manual entry as a reliable alternative.</p>
                </div>
              </div>
              <div className="help-item">
                <CheckCircle size={16} />
                <div>
                  <strong>Why ZXing Scanner?</strong>
                  <p>More reliable QR code detection, works with various code formats, and better mobile compatibility.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeScannerNew;
