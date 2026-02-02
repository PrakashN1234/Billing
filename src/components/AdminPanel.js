import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, RefreshCw } from 'lucide-react';
import { addProduct, updateProduct, deleteProduct, getSales } from '../services/firebaseService';
import { generateUniqueProductCode, suggestProductCodes } from '../utils/productCodeGenerator';
import { useAuth } from '../contexts/AuthContext';
import { getUserStoreId, getUserStoreName } from '../utils/roleManager';

const AdminPanel = ({ inventory, onClose }) => {
  const { currentUser } = useAuth();
  const userStoreId = getUserStoreId(currentUser?.email);
  const userStoreName = getUserStoreName(currentUser?.email);
  const [activeTab, setActiveTab] = useState('inventory');
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    stock: '',
    code: ''
  });
  const [suggestedCodes, setSuggestedCodes] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'sales') {
      loadSales();
    }
  }, [activeTab]);

  const loadSales = async () => {
    setLoading(true);
    try {
      const salesData = await getSales(20);
      setSales(salesData);
    } catch (error) {
      console.error('Error loading sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price || !newProduct.stock) {
      alert('Please fill all fields');
      return;
    }

    try {
      // Generate product code if not provided
      const productCode = newProduct.code || generateUniqueProductCode(newProduct.name, inventory);
      
      await addProduct({
        name: newProduct.name,
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock),
        code: productCode,
        storeId: userStoreId, // Associate with admin's store
        storeName: userStoreName
      });
      
      setNewProduct({ name: '', price: '', stock: '', code: '' });
      setSuggestedCodes([]);
      alert(`Product added successfully to ${userStoreName} with code: ${productCode}`);
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Error adding product');
    }
  };

  const handleProductNameChange = (name) => {
    setNewProduct({...newProduct, name});
    
    if (name.trim().length > 2) {
      const suggestions = suggestProductCodes(name, 3);
      setSuggestedCodes(suggestions);
      
      // Auto-set the first suggestion as default
      if (!newProduct.code) {
        setNewProduct(prev => ({...prev, name, code: suggestions[0]}));
      }
    } else {
      setSuggestedCodes([]);
    }
  };

  const generateNewCode = () => {
    if (newProduct.name.trim()) {
      const newCode = generateUniqueProductCode(newProduct.name, inventory);
      setNewProduct({...newProduct, code: newCode});
    }
  };

  const handleUpdateProduct = async (productId, updates) => {
    try {
      await updateProduct(productId, updates);
      setEditingProduct(null);
      alert('Product updated successfully!');
    } catch (error) {
      alert('Error updating product');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(productId);
        alert('Product deleted successfully!');
      } catch (error) {
        alert('Error deleting product');
      }
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp.seconds * 1000).toLocaleString();
  };

  return (
    <div className="admin-overlay">
      <div className="admin-panel">
        <div className="admin-header">
          <h2>Admin Panel</h2>
          <button className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="admin-tabs">
          <button 
            className={activeTab === 'inventory' ? 'active' : ''}
            onClick={() => setActiveTab('inventory')}
          >
            Inventory Management
          </button>
          <button 
            className={activeTab === 'sales' ? 'active' : ''}
            onClick={() => setActiveTab('sales')}
          >
            Sales History
          </button>
        </div>

        {activeTab === 'inventory' && (
          <div className="admin-content">
            <div className="add-product-form">
              <h3>Add New Product</h3>
              <form onSubmit={handleAddProduct}>
                <div className="form-row">
                  <input
                    type="text"
                    placeholder="Product name (e.g., Basmati Rice 1kg)"
                    value={newProduct.name}
                    onChange={(e) => handleProductNameChange(e.target.value)}
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Price"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                  />
                  <input
                    type="number"
                    placeholder="Stock quantity"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                  />
                </div>
                
                <div className="product-code-section">
                  <div className="code-input-group">
                    <input
                      type="text"
                      placeholder="Product code (auto-generated)"
                      value={newProduct.code}
                      onChange={(e) => setNewProduct({...newProduct, code: e.target.value.toUpperCase()})}
                      className="code-input"
                    />
                    <button 
                      type="button" 
                      className="btn-generate-code"
                      onClick={generateNewCode}
                      title="Generate new code"
                    >
                      <RefreshCw size={16} />
                    </button>
                  </div>
                  
                  {suggestedCodes.length > 0 && (
                    <div className="code-suggestions">
                      <span className="suggestions-label">Suggestions:</span>
                      {suggestedCodes.map((code, index) => (
                        <button
                          key={index}
                          type="button"
                          className={`suggestion-btn ${newProduct.code === code ? 'active' : ''}`}
                          onClick={() => setNewProduct({...newProduct, code})}
                        >
                          {code}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button type="submit" className="btn-add">
                  <Plus size={16} /> Add Product
                </button>
              </form>
            </div>

            <div className="inventory-table">
              <h3>Current Inventory ({inventory.length} items)</h3>
              <table>
                <thead>
                  <tr>
                    <th>Product Code</th>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map(product => (
                    <tr key={product.id}>
                      <td>
                        <span className="product-code">
                          {product.code || product.id || 'N/A'}
                        </span>
                      </td>
                      <td>
                        {editingProduct === product.id ? (
                          <input
                            type="text"
                            defaultValue={product.name}
                            onBlur={(e) => handleUpdateProduct(product.id, { name: e.target.value })}
                          />
                        ) : (
                          product.name
                        )}
                      </td>
                      <td>
                        {editingProduct === product.id ? (
                          <input
                            type="number"
                            step="0.01"
                            defaultValue={product.price}
                            onBlur={(e) => handleUpdateProduct(product.id, { price: parseFloat(e.target.value) })}
                          />
                        ) : (
                          `₹${(product.price || 0).toFixed(2)}`
                        )}
                      </td>
                      <td>
                        {editingProduct === product.id ? (
                          <input
                            type="number"
                            defaultValue={product.stock}
                            onBlur={(e) => handleUpdateProduct(product.id, { stock: parseInt(e.target.value) })}
                          />
                        ) : (
                          product.stock
                        )}
                      </td>
                      <td>
                        <span className={`status ${product.stock === 0 ? 'out' : product.stock < 10 ? 'low' : 'good'}`}>
                          {product.stock === 0 ? 'Out of Stock' : product.stock < 10 ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn-edit"
                          onClick={() => setEditingProduct(editingProduct === product.id ? null : product.id)}
                        >
                          {editingProduct === product.id ? <Save size={14} /> : <Edit2 size={14} />}
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'sales' && (
          <div className="admin-content">
            <div className="sales-summary">
              <h3>Recent Sales</h3>
              {loading ? (
                <p>Loading sales data...</p>
              ) : (
                <div className="sales-list">
                  {sales.map(sale => (
                    <div key={sale.id} className="sale-item">
                      <div className="sale-header">
                        <span className="sale-total">₹{(sale.total || 0).toFixed(2)}</span>
                        <span className="sale-date">{formatDate(sale.timestamp)}</span>
                      </div>
                      <div className="sale-details">
                        <p>{sale.itemCount} items • Tax: ₹{(sale.tax || sale.gst || 0).toFixed(2)}</p>
                        <div className="sale-items">
                          {sale.items.map((item, index) => (
                            <span key={index} className="sale-item-tag">
                              {item.name} x{item.qty}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;