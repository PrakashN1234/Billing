import { useState, useEffect, useRef, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, RotateCcw } from 'lucide-react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';

const BarcodeScanner = ({ onScan, onClose, isActive }) => {
  const [error, setError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const videoRef = useRef(null);
  const codeReader = useRef(null);

  useEffect(() => {
    // Initialize code reader
    codeReader.current = new BrowserMultiFormatReader();
    
    return () => {
      // Cleanup on unmount
      if (codeReader.current) {
        codeReader.current.reset();
      }
    };
  }, []);

  useEffect(() => {
    if (isActive) {
      initializeScanner();
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
  }, [isActive, initializeScanner]);

  const initializeScanner = useCallback(async () => {
    try {
      setError(null);
      setIsScanning(false);
      
      // Get available video devices
      const videoDevices = await codeReader.current.listVideoInputDevices();
      console.log('Available cameras:', videoDevices);
      
      if (videoDevices.length === 0) {
        throw new Error('No camera devices found. Please ensure a camera is connected and permissions are granted.');
      }

      setDevices(videoDevices);
      
      // Prefer back camera for mobile devices
      const backCamera = videoDevices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear') ||
        device.label.toLowerCase().includes('environment')
      );
      
      const deviceToUse = backCamera || videoDevices[0];
      setSelectedDevice(deviceToUse);
      
      await startScanning(deviceToUse.deviceId);
      
    } catch (err) {
      console.error('Scanner initialization error:', err);
      setError(err.message || 'Failed to initialize camera. Please check permissions.');
    }
  }, []);

  const startScanning = async (deviceId) => {
    try {
      setIsScanning(true);
      setError(null);
      
      console.log('Starting barcode scanning with device:', deviceId);
      
      // Start decoding from video device
      const result = await codeReader.current.decodeOnceFromVideoDevice(deviceId, videoRef.current);
      
      if (result) {
        const scannedText = result.getText();
        console.log('Barcode detected:', scannedText);
        
        setScanResult(scannedText);
        
        // Call the onScan callback with the result
        setTimeout(() => {
          onScan(scannedText);
        }, 500); // Small delay to show the result
      }
      
    } catch (err) {
      console.error('Scanning error:', err);
      
      if (err instanceof NotFoundException) {
        // This is normal - no barcode found, keep scanning
        if (isActive && isScanning) {
          // Retry scanning after a short delay
          setTimeout(() => {
            if (isActive && videoRef.current) {
              startScanning(deviceId);
            }
          }, 100);
        }
      } else {
        setError(err.message || 'Scanning failed. Please try again.');
        setIsScanning(false);
      }
    }
  };

  const stopScanning = () => {
    try {
      if (codeReader.current) {
        codeReader.current.reset();
      }
      setIsScanning(false);
      setScanResult(null);
    } catch (err) {
      console.error('Error stopping scanner:', err);
    }
  };

  const retryScanning = () => {
    if (selectedDevice) {
      startScanning(selectedDevice.deviceId);
    } else {
      initializeScanner();
    }
  };

  const switchCamera = async () => {
    if (devices.length > 1) {
      const currentIndex = devices.findIndex(d => d.deviceId === selectedDevice?.deviceId);
      const nextIndex = (currentIndex + 1) % devices.length;
      const nextDevice = devices[nextIndex];
      
      setSelectedDevice(nextDevice);
      stopScanning();
      await startScanning(nextDevice.deviceId);
    }
  };

  const handleManualInput = (code) => {
    if (code.trim()) {
      onScan(code.trim());
    }
  };

  if (!isActive) return null;

  return (
    <div className="scanner-overlay">
      <div className="scanner-modal">
        <div className="scanner-header">
          <h3>Barcode Scanner</h3>
          <div className="scanner-controls">
            {devices.length > 1 && (
              <button 
                className="switch-camera-btn" 
                onClick={switchCamera}
                title="Switch Camera"
              >
                <RotateCcw size={16} />
              </button>
            )}
            <button className="close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="scanner-content">
          {error ? (
            <div className="scanner-error">
              <div className="error-message">
                <AlertCircle size={48} />
                <h4>Camera Error</h4>
                <p>{error}</p>
                <div className="error-tips">
                  <p>Please ensure:</p>
                  <ul>
                    <li>Camera permissions are granted</li>
                    <li>No other app is using the camera</li>
                    <li>You're using HTTPS (required for camera access)</li>
                    <li>Your browser supports camera access</li>
                  </ul>
                </div>
                <button onClick={retryScanning} className="retry-btn">
                  <RotateCcw size={16} />
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <div className="camera-container">
              <video
                ref={videoRef}
                className="scanner-video"
                autoPlay
                playsInline
                muted
              />
              
              <div className="scanner-overlay-frame">
                <div className="scanner-frame">
                  <div className="corner top-left"></div>
                  <div className="corner top-right"></div>
                  <div className="corner bottom-left"></div>
                  <div className="corner bottom-right"></div>
                </div>
                
                {scanResult ? (
                  <div className="scan-result">
                    <CheckCircle size={24} />
                    <p>Barcode Detected!</p>
                    <code>{scanResult}</code>
                  </div>
                ) : (
                  <div className="scan-instructions">
                    <p>Position barcode within the frame</p>
                    <div className="scanner-status">
                      {isScanning ? (
                        <span className="scanning">📷 Scanning...</span>
                      ) : (
                        <span className="initializing">🔄 Initializing...</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="manual-input-section">
            <h4>Manual Entry</h4>
            <p>Can't scan? Enter the barcode manually:</p>
            <div className="manual-input-group">
              <input
                type="text"
                placeholder="Enter barcode number"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleManualInput(e.target.value);
                  }
                }}
                className="manual-input"
                autoFocus={!!error}
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

          <div className="scanner-info">
            <div className="scanner-tips">
              <h4>Scanning Tips:</h4>
              <ul>
                <li>Hold the camera steady and 6-12 inches from the barcode</li>
                <li>Ensure good lighting - avoid shadows and glare</li>
                <li>Keep the barcode flat and clearly visible</li>
                <li>Try different angles if scanning fails</li>
                <li>Use manual entry if camera scanning doesn't work</li>
              </ul>
            </div>
            
            <div className="supported-formats">
              <p><strong>Supported Formats:</strong> CODE128, CODE39, EAN13, EAN8, UPC-A, UPC-E, QR Code</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;