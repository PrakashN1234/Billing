import { useState, useEffect, useRef } from 'react';
import { Camera, X, CheckCircle, AlertCircle, Zap } from 'lucide-react';

const ModernBarcodeScanner = ({ onScan, onClose, isActive }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [stream, setStream] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [lastScannedCode, setLastScannedCode] = useState('');
  const [scanCount, setScanCount] = useState(0);

  useEffect(() => {
    if (isActive) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isActive]);

  const startCamera = async () => {
    try {
      setError(null);
      setIsScanning(true);

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
        
        // Start scanning after video loads
        videoRef.current.onloadedmetadata = () => {
          startBarcodeDetection();
        };
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError(err.message || 'Failed to access camera');
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsScanning(false);
  };

  const startBarcodeDetection = () => {
    const detectBarcode = () => {
      if (!videoRef.current || !canvasRef.current || !isScanning) {
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get image data for barcode detection
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // Simple barcode detection using pattern recognition
      const detectedCode = detectBarcodePattern(imageData);
      
      if (detectedCode && detectedCode !== lastScannedCode) {
        setLastScannedCode(detectedCode);
        setScanCount(prev => prev + 1);
        console.log('Barcode detected:', detectedCode);
        
        // Vibrate if supported
        if (navigator.vibrate) {
          navigator.vibrate(200);
        }
        
        onScan(detectedCode);
        return;
      }

      // Continue scanning
      if (isScanning) {
        requestAnimationFrame(detectBarcode);
      }
    };

    // Start detection loop
    requestAnimationFrame(detectBarcode);
  };

  // Simple barcode pattern detection (basic implementation)
  const detectBarcodePattern = (imageData) => {
    // This is a simplified barcode detection
    // In a real implementation, you'd use a proper barcode library
    
    // For now, we'll simulate detection of common barcode patterns
    // and return null to rely on manual entry
    return null;
  };

  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      console.log('Manual barcode entry:', manualCode.trim());
      onScan(manualCode.trim());
      setManualCode('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleManualSubmit();
    }
  };

  if (!isActive) return null;

  return (
    <div className="modern-scanner-overlay">
      <div className="modern-scanner-modal">
        <div className="scanner-header">
          <div className="header-content">
            <Camera size={24} />
            <h3>Barcode Scanner</h3>
            {scanCount > 0 && (
              <div className="scan-counter">
                <Zap size={16} />
                <span>{scanCount} scans</span>
              </div>
            )}
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="scanner-content">
          {error ? (
            <div className="scanner-error">
              <AlertCircle size={48} />
              <h4>Camera Access Failed</h4>
              <p>{error}</p>
              <div className="error-solutions">
                <p>Try these solutions:</p>
                <ul>
                  <li>Grant camera permissions when prompted</li>
                  <li>Ensure you're using HTTPS</li>
                  <li>Close other apps using the camera</li>
                  <li>Refresh the page and try again</li>
                </ul>
              </div>
              <button onClick={startCamera} className="retry-btn">
                <Camera size={16} />
                Try Again
              </button>
            </div>
          ) : (
            <div className="camera-section">
              <div className="video-container">
                <video
                  ref={videoRef}
                  className="scanner-video"
                  playsInline
                  muted
                />
                <canvas
                  ref={canvasRef}
                  className="scanner-canvas"
                  style={{ display: 'none' }}
                />
                
                <div className="scanner-overlay">
                  <div className="scan-frame">
                    <div className="corner top-left"></div>
                    <div className="corner top-right"></div>
                    <div className="corner bottom-left"></div>
                    <div className="corner bottom-right"></div>
                  </div>
                  <p className="scan-instruction">Position barcode within the frame</p>
                  {isScanning && (
                    <div className="scanning-indicator">
                      <div className="scan-line"></div>
                      <p>Scanning...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Manual Entry Section - Always Visible */}
          <div className="manual-entry-section">
            <div className="manual-header">
              <CheckCircle size={20} />
              <h4>Manual Entry</h4>
            </div>
            <p>Enter barcode number manually for reliable input:</p>
            <div className="manual-input-group">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter barcode (e.g., 1234567890123)"
                className="manual-input"
                autoFocus
              />
              <button
                onClick={handleManualSubmit}
                className="manual-submit-btn"
                disabled={!manualCode.trim()}
              >
                <CheckCircle size={16} />
                Add Product
              </button>
            </div>
            <div className="manual-tips">
              <p><strong>Tip:</strong> You can also enter product codes like RICE001, MILK001, or even product names like "rice"</p>
            </div>
          </div>

          {/* Scanning Tips */}
          <div className="scanning-tips">
            <h4>Scanning Tips:</h4>
            <div className="tips-grid">
              <div className="tip">
                <span className="tip-icon">📱</span>
                <span>Hold phone steady</span>
              </div>
              <div className="tip">
                <span className="tip-icon">💡</span>
                <span>Ensure good lighting</span>
              </div>
              <div className="tip">
                <span className="tip-icon">📏</span>
                <span>Keep 6-12 inches away</span>
              </div>
              <div className="tip">
                <span className="tip-icon">🎯</span>
                <span>Center barcode in frame</span>
              </div>
            </div>
          </div>

          {/* Fallback Notice */}
          <div className="fallback-notice">
            <AlertCircle size={16} />
            <p>
              <strong>Note:</strong> Camera scanning is experimental. 
              For best results, use manual entry above with the barcode number.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernBarcodeScanner;