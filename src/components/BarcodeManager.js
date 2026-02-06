import { useState } from 'react';
import { 
  BarChart3, 
  RefreshCw, 
  Download, 
  Search, 
  Filter,
  Package,
  AlertCircle,
  CheckCircle,
  X,
  QrCode
} from 'lucide-react';
import BarcodeDisplay from './BarcodeDisplay';
import QRCodeDisplay from './QRCodeDisplay';
import { 
  generateUniqueBarcode,
  parseBarcodeInfo
} from '../utils/barcodeGenerator';
import { 
  generateUniqueQRCode,
  parseQRCode
} from '../utils/qrcodeGenerator';
import { updateProduct } from '../services/firebaseService';

const BarcodeManager = ({ inventory, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Filter inventory based on search and category
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || 
      (filterCategory === 'with-barcode' && item.barcode) ||
      (filterCategory === 'without-barcode' && !item.barcode) ||
      (filterCategory === 'with-qrcode' && item.qrcode) ||
      (filterCategory === 'without-qrcode' && !item.qrcode);
    return matchesSearch && matchesCategory;
  });

  // Statistics
  const stats = {
    total: inventory.length,
    withBarcode: inventory.filter(item => item.barcode).length,
    withoutBarcode: inventory.filter(item => !item.barcode).length,
    withQRCode: inventory.filter(item => item.qrcode).length,
    withoutQRCode: inventory.filter(item => !item.qrcode).length,
    withBoth: inventory.filter(item => item.barcode && item.qrcode).length,
    selected: selectedItems.length
  };

  const handleGenerateSingleBarcode = async (product) => {
    setIsGenerating(true);
    try {
      const barcode = generateUniqueBarcode(product.name, product.id, inventory, product.code);
      await updateProduct(product.id, { barcode });
      alert(`Barcode generated for ${product.name}: ${barcode}`);
      // Refresh would happen automatically due to real-time listeners
    } catch (error) {
      console.error('Error generating barcode:', error);
      alert('Failed to generate barcode');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateSingleQRCode = async (product) => {
    setIsGenerating(true);
    try {
      const qrcode = generateUniqueQRCode(product.name, product.id, inventory, product.storeId || '001', product.code);
      await updateProduct(product.id, { qrcode });
      alert(`QR Code generated for ${product.name}: ${qrcode}`);
      // Refresh would happen automatically due to real-time listeners
    } catch (error) {
      console.error('Error generating QR code:', error);
      alert('Failed to generate QR code');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateBoth = async (product) => {
    setIsGenerating(true);
    try {
      const productCode = product.code;
      const barcode = generateUniqueBarcode(product.name, product.id, inventory, productCode);
      const qrcode = generateUniqueQRCode(product.name, product.id, inventory, product.storeId || '001', productCode);
      await updateProduct(product.id, { barcode, qrcode });
      alert(`Barcode and QR Code generated for ${product.name}\nCode: ${barcode}`);
    } catch (error) {
      console.error('Error generating codes:', error);
      alert('Failed to generate codes');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateBulkBarcodes = async () => {
    if (selectedItems.length === 0) {
      alert('Please select items to generate codes for');
      return;
    }

    const confirmed = window.confirm(
      `Generate both barcode and QR code for ${selectedItems.length} selected items?`
    );
    if (!confirmed) return;

    setIsGenerating(true);
    try {
      const updatePromises = selectedItems.map(async (itemId) => {
        const product = inventory.find(p => p.id === itemId);
        if (product) {
          const updates = {};
          // Use product code for both barcode and QR code
          const productCode = product.code;
          if (!product.barcode) {
            updates.barcode = generateUniqueBarcode(product.name, product.id, inventory, productCode);
          }
          if (!product.qrcode) {
            updates.qrcode = generateUniqueQRCode(product.name, product.id, inventory, product.storeId || '001', productCode);
          }
          if (Object.keys(updates).length > 0) {
            return updateProduct(product.id, updates);
          }
        }
      });

      await Promise.all(updatePromises);
      alert(`Successfully generated codes for ${selectedItems.length} items!`);
      setSelectedItems([]);
    } catch (error) {
      console.error('Error generating bulk codes:', error);
      alert('Failed to generate some codes');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectItem = (itemId) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    const itemsWithoutCodes = filteredInventory
      .filter(item => !item.barcode || !item.qrcode)
      .map(item => item.id);
    setSelectedItems(itemsWithoutCodes);
  };

  const handleDeselectAll = () => {
    setSelectedItems([]);
  };

  const handleViewBarcode = (product) => {
    setSelectedProduct(product);
    setShowBarcodeModal(true);
  };

  const exportBarcodeList = () => {
    const barcodeData = inventory
      .filter(item => item.barcode)
      .map(item => ({
        name: item.name,
        barcode: item.barcode,
        price: item.price,
        stock: item.stock
      }));

    const csvContent = [
      ['Product Name', 'Barcode', 'Price', 'Stock'],
      ...barcodeData.map(item => [item.name, item.barcode, item.price, item.stock])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `barcode_list_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="barcode-manager-overlay">
      <div className="barcode-manager">
        <div className="manager-header">
          <div className="header-left">
            <BarChart3 size={24} />
            <div>
              <h2>Barcode & QR Code Management</h2>
              <p>Generate and manage product barcodes and QR codes</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Statistics */}
        <div className="barcode-stats">
          <div className="stat-card">
            <Package size={20} />
            <div>
              <span className="stat-number">{stats.total}</span>
              <span className="stat-label">Total Products</span>
            </div>
          </div>
          <div className="stat-card success">
            <CheckCircle size={20} />
            <div>
              <span className="stat-number">{stats.withBarcode}</span>
              <span className="stat-label">With Barcode</span>
            </div>
          </div>
          <div className="stat-card success">
            <QrCode size={20} />
            <div>
              <span className="stat-number">{stats.withQRCode}</span>
              <span className="stat-label">With QR Code</span>
            </div>
          </div>
          <div className="stat-card info">
            <CheckCircle size={20} />
            <div>
              <span className="stat-number">{stats.withBoth}</span>
              <span className="stat-label">With Both</span>
            </div>
          </div>
          <div className="stat-card warning">
            <AlertCircle size={20} />
            <div>
              <span className="stat-number">{stats.selected}</span>
              <span className="stat-label">Selected</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="manager-controls">
          <div className="search-filter">
            <div className="search-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="filter-box">
              <Filter size={16} />
              <select 
                value={filterCategory} 
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="all">All Products</option>
                <option value="with-barcode">With Barcode</option>
                <option value="without-barcode">Without Barcode</option>
                <option value="with-qrcode">With QR Code</option>
                <option value="without-qrcode">Without QR Code</option>
              </select>
            </div>
          </div>

          <div className="action-buttons">
            <button 
              className="btn-secondary"
              onClick={handleSelectAll}
              disabled={filteredInventory.filter(item => !item.barcode || !item.qrcode).length === 0}
            >
              Select All Missing
            </button>
            <button 
              className="btn-secondary"
              onClick={handleDeselectAll}
              disabled={selectedItems.length === 0}
            >
              Deselect All
            </button>
            <button 
              className="btn-primary"
              onClick={handleGenerateBulkBarcodes}
              disabled={selectedItems.length === 0 || isGenerating}
            >
              {isGenerating ? <RefreshCw size={16} className="spinning" /> : <BarChart3 size={16} />}
              Generate Both ({selectedItems.length})
            </button>
            <button 
              className="btn-export"
              onClick={exportBarcodeList}
              disabled={stats.withBarcode === 0}
            >
              <Download size={16} />
              Export List
            </button>
          </div>
        </div>

        {/* Product List */}
        <div className="products-list">
          <div className="list-header">
            <span>Product</span>
            <span>Barcode</span>
            <span>QR Code</span>
            <span>Status</span>
            <span>Actions</span>
          </div>
          
          <div className="list-content">
            {filteredInventory.map(product => (
              <div key={product.id} className="product-row">
                <div className="product-info">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(product.id)}
                    onChange={() => handleSelectItem(product.id)}
                    disabled={product.barcode && product.qrcode}
                  />
                  <div className="product-details">
                    <span className="product-name">{product.name}</span>
                    <span className="product-price">₹{product.price}</span>
                  </div>
                </div>

                <div className="barcode-info">
                  {product.barcode ? (
                    <div className="barcode-display-small">
                      <BarcodeDisplay 
                        barcode={product.barcode}
                        size="small"
                        showControls={false}
                      />
                    </div>
                  ) : (
                    <span className="no-barcode">No barcode</span>
                  )}
                </div>

                <div className="qrcode-info">
                  {product.qrcode ? (
                    <div className="qrcode-display-small">
                      <QrCode size={16} />
                      <span className="qrcode-text">{product.qrcode}</span>
                    </div>
                  ) : (
                    <span className="no-qrcode">No QR code</span>
                  )}
                </div>

                <div className="status-info">
                  {product.barcode && product.qrcode ? (
                    <span className="status-badge success">
                      <CheckCircle size={14} />
                      Both
                    </span>
                  ) : product.barcode || product.qrcode ? (
                    <span className="status-badge warning">
                      <AlertCircle size={14} />
                      Partial
                    </span>
                  ) : (
                    <span className="status-badge error">
                      <AlertCircle size={14} />
                      Missing
                    </span>
                  )}
                </div>

                <div className="action-buttons">
                  {product.barcode && product.qrcode ? (
                    <button 
                      className="btn-view"
                      onClick={() => handleViewBarcode(product)}
                    >
                      View Both
                    </button>
                  ) : (
                    <>
                      {!product.barcode && (
                        <button 
                          className="btn-generate"
                          onClick={() => handleGenerateSingleBarcode(product)}
                          disabled={isGenerating}
                        >
                          + Barcode
                        </button>
                      )}
                      {!product.qrcode && (
                        <button 
                          className="btn-generate"
                          onClick={() => handleGenerateSingleQRCode(product)}
                          disabled={isGenerating}
                        >
                          + QR
                        </button>
                      )}
                      {!product.barcode && !product.qrcode && (
                        <button 
                          className="btn-generate-both"
                          onClick={() => handleGenerateBoth(product)}
                          disabled={isGenerating}
                        >
                          + Both
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Barcode & QR Code Modal */}
        {showBarcodeModal && selectedProduct && (
          <div className="barcode-modal-overlay">
            <div className="barcode-modal">
              <div className="modal-header">
                <h3>{selectedProduct.name}</h3>
                <button onClick={() => setShowBarcodeModal(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className="modal-content">
                {selectedProduct.barcode && (
                  <div className="code-section">
                    <h4>Barcode</h4>
                    <BarcodeDisplay 
                      barcode={selectedProduct.barcode}
                      productName={selectedProduct.name}
                      size="large"
                      showControls={true}
                    />
                    <p className="code-value">{selectedProduct.barcode}</p>
                  </div>
                )}
                {selectedProduct.qrcode && (
                  <div className="code-section">
                    <h4>QR Code</h4>
                    <QRCodeDisplay 
                      qrcode={selectedProduct.qrcode}
                      productName={selectedProduct.name}
                    />
                    <p className="code-value">{selectedProduct.qrcode}</p>
                  </div>
                )}
                <div className="barcode-details">
                  <p><strong>Price:</strong> ₹{selectedProduct.price}</p>
                  <p><strong>Stock:</strong> {selectedProduct.stock} units</p>
                  {selectedProduct.barcode && parseBarcodeInfo(selectedProduct.barcode) && (
                    <p><strong>Barcode Category:</strong> {parseBarcodeInfo(selectedProduct.barcode).categoryName}</p>
                  )}
                  {selectedProduct.qrcode && parseQRCode(selectedProduct.qrcode) && (
                    <p><strong>QR Category:</strong> {parseQRCode(selectedProduct.qrcode).category}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BarcodeManager;