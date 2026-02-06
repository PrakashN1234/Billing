import { useState, useEffect } from 'react';
import { Download, Copy, CheckCircle } from 'lucide-react';
import { generateQRCodeImage } from '../utils/qrcodeGenerator';

const QRCodeDisplay = ({ qrcode, productName, size = 'medium', showControls = true }) => {
  const [qrImageUrl, setQrImageUrl] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const generateImage = async () => {
      if (qrcode) {
        const sizeMap = {
          small: 100,
          medium: 200,
          large: 300
        };
        const imageUrl = await generateQRCodeImage(qrcode, { width: sizeMap[size] || 200 });
        setQrImageUrl(imageUrl);
      }
    };
    generateImage();
  }, [qrcode, size]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(qrcode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleDownload = () => {
    if (!qrImageUrl) return;

    const link = document.createElement('a');
    link.href = qrImageUrl;
    link.download = `qrcode_${productName || qrcode}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!qrcode || !qrImageUrl) {
    return <div className="qrcode-placeholder">No QR Code</div>;
  }

  return (
    <div className={`qrcode-display ${size}`}>
      <div className="qrcode-image-container">
        <img src={qrImageUrl} alt={`QR Code for ${productName || qrcode}`} />
      </div>
      {productName && <div className="qrcode-product-name">{productName}</div>}
      <div className="qrcode-value">{qrcode}</div>
      {showControls && (
        <div className="qrcode-controls">
          <button onClick={handleCopy} className="control-btn" title="Copy QR Code">
            {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button onClick={handleDownload} className="control-btn" title="Download QR Code">
            <Download size={16} />
            Download
          </button>
        </div>
      )}
    </div>
  );
};

export default QRCodeDisplay;
