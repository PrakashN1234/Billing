import { useState, useEffect } from 'react';
import { Store, MapPin, Phone, Mail, Edit, Trash2, Plus, X, Save, User, Settings, Package, Users } from 'lucide-react';
import { 
  subscribeToStores, 
  addStore, 
  updateStore, 
  deleteStore, 
  initializeStores 
} from '../services/firebaseService';
import { createStoreWithWizard } from '../utils/storeSetupManager';

const StoresView = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showWizardModal, setShowWizardModal] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [wizardStep, setWizardStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    status: 'Active',
    manager: ''
  });
  const [wizardData, setWizardData] = useState({
    // Store Information
    storeName: '',
    storeAddress: '',
    storePhone: '',
    storeEmail: '',
    
    // Admin Information
    adminName: '',
    adminEmail: '',
    adminPhone: '',
    adminPassword: '',
    
    // Options
    createSampleCashier: true,
    initializeInventory: true,
    setupFeatures: true
  });

  useEffect(() => {
    // Initialize default stores if none exist
    initializeStores();

    // Subscribe to real-time updates
    const unsubscribe = subscribeToStores(
      (storesData) => {
        setStores(storesData);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading stores:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      phone: '',
      email: '',
      status: 'Active',
      manager: ''
    });
  };

  const resetWizardData = () => {
    setWizardData({
      storeName: '',
      storeAddress: '',
      storePhone: '',
      storeEmail: '',
      adminName: '',
      adminEmail: '',
      adminPhone: '',
      adminPassword: '',
      createSampleCashier: true,
      initializeInventory: true,
      setupFeatures: true
    });
    setWizardStep(1);
  };

  const handleCreateWithWizard = () => {
    resetWizardData();
    setShowWizardModal(true);
  };

  const handleWizardNext = () => {
    if (wizardStep < 3) {
      setWizardStep(wizardStep + 1);
    }
  };

  const handleWizardPrev = () => {
    if (wizardStep > 1) {
      setWizardStep(wizardStep - 1);
    }
  };

  const handleWizardSubmit = async () => {
    try {
      setLoading(true);
      
      const result = await createStoreWithWizard(wizardData);
      
      if (result.success) {
        alert(`Store created successfully!\n\nStore: ${result.storeName}\nAdmin Email: ${result.adminCredentials.email}\nAdmin Password: ${result.adminCredentials.password}\n\n${result.cashierCredentials ? `Cashier Email: ${result.cashierCredentials.email}\nCashier Password: ${result.cashierCredentials.password}` : ''}`);
        setShowWizardModal(false);
        resetWizardData();
      } else {
        alert(`Error creating store: ${result.error}`);
      }
    } catch (error) {
      console.error('Error in wizard:', error);
      alert(`Error creating store: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleWizardInputChange = (field, value) => {
    setWizardData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddStore = () => {
    resetForm();
    setEditingStore(null);
    setShowAddModal(true);
  };

  const handleEditStore = (store) => {
    setFormData({
      name: store.name,
      address: store.address,
      phone: store.phone,
      email: store.email,
      status: store.status,
      manager: store.manager
    });
    setEditingStore(store.id);
    setShowAddModal(true);
  };

  const handleDeleteStore = async (storeId) => {
    if (window.confirm('Are you sure you want to delete this store? This action cannot be undone.')) {
      try {
        await deleteStore(storeId);
        alert('Store deleted successfully!');
      } catch (error) {
        console.error('Error deleting store:', error);
        alert('Error deleting store. Please try again.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.address || !formData.phone || !formData.email || !formData.manager) {
      alert('Please fill in all required fields');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert('Please enter a valid email address');
      return;
    }

    // Phone validation
    const phoneRegex = /^\+?[\d\s-()]+$/;
    if (!phoneRegex.test(formData.phone)) {
      alert('Please enter a valid phone number');
      return;
    }

    try {
      if (editingStore) {
        // Update existing store
        await updateStore(editingStore, formData);
        alert('Store updated successfully!');
      } else {
        // Add new store
        await addStore(formData);
        alert('Store added successfully!');
      }

      setShowAddModal(false);
      resetForm();
      setEditingStore(null);
    } catch (error) {
      console.error('Error saving store:', error);
      
      // Show detailed error message
      let errorMessage = 'Error saving store. ';
      if (error.message.includes('Permission denied')) {
        errorMessage += 'Please check your Firebase permissions or try logging in again.';
      } else if (error.message.includes('unavailable')) {
        errorMessage += 'Database is currently unavailable. Please try again later.';
      } else {
        errorMessage += error.message || 'Please try again.';
      }
      
      alert(errorMessage);
    }
  };

  const handleCancel = () => {
    setShowAddModal(false);
    resetForm();
    setEditingStore(null);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="stores-view">
        <div className="loading-state">
          <Store size={48} />
          <p>Loading stores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="stores-view">
      <div className="view-header">
        <h1>Stores Management</h1>
        <div className="header-actions">
          <button className="btn-secondary" onClick={handleAddStore}>
            <Plus size={20} />
            Quick Add Store
          </button>
          <button className="btn-primary" onClick={handleCreateWithWizard}>
            <Settings size={20} />
            Create Store with Setup
          </button>
        </div>
      </div>

      <div className="stores-grid">
        {stores.map((store) => (
          <div key={store.id} className="store-card">
            <div className="store-header">
              <div className="store-icon">
                <Store size={24} />
              </div>
              <div className="store-actions">
                <button 
                  className="btn-icon"
                  onClick={() => handleEditStore(store)}
                  title="Edit Store"
                >
                  <Edit size={16} />
                </button>
                <button 
                  className="btn-icon danger"
                  onClick={() => handleDeleteStore(store.id)}
                  title="Delete Store"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <div className="store-content">
              <h3>{store.name}</h3>
              <div className="store-details">
                <div className="detail-item">
                  <MapPin size={16} />
                  <span>{store.address}</span>
                </div>
                <div className="detail-item">
                  <Phone size={16} />
                  <span>{store.phone}</span>
                </div>
                <div className="detail-item">
                  <Mail size={16} />
                  <span>{store.email}</span>
                </div>
              </div>
              
              <div className="store-footer">
                <span className={`status ${store.status.toLowerCase()}`}>
                  {store.status}
                </span>
                <span className="manager">Manager: {store.manager}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Store Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingStore ? 'Edit Store' : 'Add New Store'}</h2>
              <button className="btn-close" onClick={handleCancel}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="store-form">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="name">Store Name *</label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter store name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="manager">Manager Name *</label>
                  <input
                    type="text"
                    id="manager"
                    value={formData.manager}
                    onChange={(e) => handleInputChange('manager', e.target.value)}
                    placeholder="Enter manager name"
                    required
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="address">Address *</label>
                  <input
                    type="text"
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Enter store address"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone Number *</label>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+91 9876543210"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="store@mystore.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={handleCancel}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <Save size={16} />
                  {editingStore ? 'Update Store' : 'Add Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Store Creation Wizard Modal */}
      {showWizardModal && (
        <div className="modal-overlay">
          <div className="modal-content wizard-modal">
            <div className="modal-header">
              <h2>Create New Store - Step {wizardStep} of 3</h2>
              <button className="btn-close" onClick={() => setShowWizardModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="wizard-progress">
              <div className={`step ${wizardStep >= 1 ? 'active' : ''}`}>
                <Store size={16} />
                <span>Store Info</span>
              </div>
              <div className={`step ${wizardStep >= 2 ? 'active' : ''}`}>
                <User size={16} />
                <span>Admin User</span>
              </div>
              <div className={`step ${wizardStep >= 3 ? 'active' : ''}`}>
                <Settings size={16} />
                <span>Setup Options</span>
              </div>
            </div>

            <div className="wizard-content">
              {wizardStep === 1 && (
                <div className="wizard-step">
                  <h3>Store Information</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="storeName">Store Name *</label>
                      <input
                        type="text"
                        id="storeName"
                        value={wizardData.storeName}
                        onChange={(e) => handleWizardInputChange('storeName', e.target.value)}
                        placeholder="Enter store name"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="storeAddress">Address *</label>
                      <textarea
                        id="storeAddress"
                        value={wizardData.storeAddress}
                        onChange={(e) => handleWizardInputChange('storeAddress', e.target.value)}
                        placeholder="Enter store address"
                        rows="3"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="storePhone">Phone Number</label>
                      <input
                        type="tel"
                        id="storePhone"
                        value={wizardData.storePhone}
                        onChange={(e) => handleWizardInputChange('storePhone', e.target.value)}
                        placeholder="+91 9876543210"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="storeEmail">Email Address</label>
                      <input
                        type="email"
                        id="storeEmail"
                        value={wizardData.storeEmail}
                        onChange={(e) => handleWizardInputChange('storeEmail', e.target.value)}
                        placeholder="store@example.com"
                      />
                    </div>
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="wizard-step">
                  <h3>Store Administrator</h3>
                  <p className="step-description">Create the admin user who will manage this store</p>
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="adminName">Admin Name *</label>
                      <input
                        type="text"
                        id="adminName"
                        value={wizardData.adminName}
                        onChange={(e) => handleWizardInputChange('adminName', e.target.value)}
                        placeholder="Enter admin full name"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="adminEmail">Admin Email *</label>
                      <input
                        type="email"
                        id="adminEmail"
                        value={wizardData.adminEmail}
                        onChange={(e) => handleWizardInputChange('adminEmail', e.target.value)}
                        placeholder="admin@store.com"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="adminPhone">Admin Phone</label>
                      <input
                        type="tel"
                        id="adminPhone"
                        value={wizardData.adminPhone}
                        onChange={(e) => handleWizardInputChange('adminPhone', e.target.value)}
                        placeholder="+91 9876543210"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="adminPassword">Admin Password *</label>
                      <input
                        type="password"
                        id="adminPassword"
                        value={wizardData.adminPassword}
                        onChange={(e) => handleWizardInputChange('adminPassword', e.target.value)}
                        placeholder="Enter secure password"
                        minLength="6"
                        required
                      />
                      <small className="form-hint">Minimum 6 characters</small>
                    </div>
                  </div>
                </div>
              )}

              {wizardStep === 3 && (
                <div className="wizard-step">
                  <h3>Setup Options</h3>
                  <p className="step-description">Choose what to set up automatically</p>
                  
                  <div className="setup-options">
                    <div className="option-card">
                      <div className="option-header">
                        <Users size={20} />
                        <h4>Sample Cashier</h4>
                      </div>
                      <p>Create a sample cashier account for testing</p>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={wizardData.createSampleCashier}
                          onChange={(e) => handleWizardInputChange('createSampleCashier', e.target.checked)}
                        />
                        <span>Create sample cashier</span>
                      </label>
                    </div>

                    <div className="option-card">
                      <div className="option-header">
                        <Package size={20} />
                        <h4>Initial Inventory</h4>
                      </div>
                      <p>Add 20+ sample products with codes and barcodes</p>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={wizardData.initializeInventory}
                          onChange={(e) => handleWizardInputChange('initializeInventory', e.target.checked)}
                        />
                        <span>Initialize inventory</span>
                      </label>
                    </div>

                    <div className="option-card">
                      <div className="option-header">
                        <Settings size={20} />
                        <h4>Feature Setup</h4>
                      </div>
                      <p>Configure all dashboard features and settings</p>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={wizardData.setupFeatures}
                          onChange={(e) => handleWizardInputChange('setupFeatures', e.target.checked)}
                        />
                        <span>Setup all features</span>
                      </label>
                    </div>
                  </div>

                  <div className="setup-summary">
                    <h4>What will be created:</h4>
                    <ul>
                      <li>✅ New store: {wizardData.storeName || 'Store Name'}</li>
                      <li>✅ Admin user: {wizardData.adminEmail || 'admin@store.com'}</li>
                      {wizardData.createSampleCashier && <li>✅ Sample cashier account</li>}
                      {wizardData.initializeInventory && <li>✅ 20+ sample products with codes & barcodes</li>}
                      {wizardData.setupFeatures && <li>✅ All dashboard features configured</li>}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            <div className="wizard-actions">
              {wizardStep > 1 && (
                <button type="button" className="btn-secondary" onClick={handleWizardPrev}>
                  Previous
                </button>
              )}
              
              <div className="action-buttons">
                <button type="button" className="btn-secondary" onClick={() => setShowWizardModal(false)}>
                  Cancel
                </button>
                
                {wizardStep < 3 ? (
                  <button 
                    type="button" 
                    className="btn-primary" 
                    onClick={handleWizardNext}
                    disabled={
                      (wizardStep === 1 && (!wizardData.storeName || !wizardData.storeAddress)) ||
                      (wizardStep === 2 && (!wizardData.adminName || !wizardData.adminEmail || !wizardData.adminPassword))
                    }
                  >
                    Next
                  </button>
                ) : (
                  <button 
                    type="button" 
                    className="btn-primary" 
                    onClick={handleWizardSubmit}
                    disabled={loading}
                  >
                    {loading ? 'Creating Store...' : 'Create Store'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoresView;