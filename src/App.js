import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import AdminDashboard from './components/AdminDashboard';
import CashierDashboard from './components/CashierDashboard';
import UnauthorizedAccess from './components/UnauthorizedAccess';
import StoresView from './components/StoresView';
import UserManagement from './components/UserManagement';
import StoreUsersView from './components/StoreUsersView';
import StoreSettings from './components/StoreSettings';
import ReportsView from './components/ReportsView';
import LowStockView from './components/LowStockView';
import ActivityView from './components/ActivityView';
import BillingTable from './components/BillingTable';
import InventorySidebar from './components/InventorySidebar';
import AdminPanel from './components/AdminPanel';
import BarcodeManager from './components/BarcodeManager';
import BarcodeTestPage from './components/BarcodeTestPage';
import LoadingSpinner from './components/LoadingSpinner';
import { subscribeToInventoryByStore } from './services/firebaseService';
import { initializeInventory, updateExistingProductCodes } from './utils/initializeData';
import { 
  initializeDefaultUsers, 
  isUserAuthorized, 
  getUserRole, 
  getUserStoreId, 
  isSuperAdmin,
  USER_ROLES 
} from './utils/dynamicRoleManager';
import './App.css';

const MainApp = () => {
  const { currentUser } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [userAuthorized, setUserAuthorized] = useState(null); // null = checking, true = authorized, false = not authorized
  const [userRole, setUserRole] = useState(null);
  const [userStoreId, setUserStoreId] = useState(null);
  const [isSuper, setIsSuper] = useState(false);

  // Check user authorization when currentUser changes
  useEffect(() => {
    const checkUserAuth = async () => {
      if (!currentUser) {
        setUserAuthorized(false);
        return;
      }

      try {
        const authorized = await isUserAuthorized(currentUser.email);
        const role = await getUserRole(currentUser.email);
        const storeId = await getUserStoreId(currentUser.email);
        const superAdmin = await isSuperAdmin(currentUser.email);

        setUserAuthorized(authorized);
        setUserRole(role);
        setUserStoreId(storeId);
        setIsSuper(superAdmin);
      } catch (error) {
        console.error('Error checking user authorization:', error);
        setUserAuthorized(false);
      }
    };

    checkUserAuth();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || userAuthorized === null) return;
    
    // Initialize default users in database
    initializeDefaultUsers();
    
    let unsubscribe;
    
    const setupInventory = async () => {
      try {
        unsubscribe = subscribeToInventoryByStore(
          isSuper ? null : userStoreId, // null for super admin = all stores
          (inventoryData) => {
            console.log(`📦 Inventory updated: ${inventoryData.length} products loaded`);
            if (inventoryData.length > 0) {
              console.log(`📊 Categories found:`, [...new Set(inventoryData.map(p => p.category))]);
            }
            
            if (inventoryData.length === 0 && !isInitializing) {
              // Only initialize if explicitly needed
              setInventory([]);
              setLoading(false);
              setError(null);
            } else {
              setInventory(inventoryData);
              setLoading(false);
              setError(null);
            }
          },
          (error) => {
            console.error('Error loading inventory:', error);
            setError('Failed to load inventory data');
            setLoading(false);
          }
        );
      } catch (error) {
        console.error('Error setting up inventory listener:', error);
        setError('Failed to connect to inventory system');
        setLoading(false);
      }
    };

    setupInventory();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isInitializing, currentUser, userAuthorized, isSuper, userStoreId]);

  const addToCart = (product) => {
    if (product.stock <= 0) {
      alert('Product is out of stock!');
      return;
    }

    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      if (existing.qty >= product.stock) {
        alert('Cannot add more items than available in stock!');
        return;
      }
      setCart(cart.map(item => 
        item.id === product.id ? { ...item, qty: item.qty + 1 } : item
      ));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  const updateQty = (id, qty) => {
    const product = inventory.find(p => p.id === id);
    const newQty = Math.max(1, parseInt(qty) || 1);
    
    if (newQty > product.stock) {
      alert('Cannot exceed available stock!');
      return;
    }
    
    setCart(cart.map(item => 
      item.id === id ? { ...item, qty: newQty } : item
    ));
  };

  const removeItem = (id) => setCart(cart.filter(item => item.id !== id));
  const clearCart = () => setCart([]);

  if (!currentUser) {
    return <Login />;
  }

  // Show loading while checking authorization
  if (userAuthorized === null) {
    return (
      <LoadingSpinner 
        message="Checking authorization..." 
      />
    );
  }

  // Check if user is authorized
  if (!userAuthorized) {
    return <UnauthorizedAccess />;
  }

  if (loading) {
    return (
      <LoadingSpinner 
        message="Loading My Store..." 
      />
    );
  }

  // Show inventory management options if products exist but need code updates
  if (inventory.length > 0 && !loading) {
    // Check if products have proper codes (not random Firebase IDs)
    const hasRandomIds = inventory.some(item => 
      item.id && item.id.length > 10 && /[a-z]/.test(item.id) && /[A-Z]/.test(item.id)
    );
    
    if (hasRandomIds) {
      return (
        <div className="app-container">
          <Sidebar 
            activeView={activeView} 
            setActiveView={setActiveView}
            userEmail={currentUser.email}
          />
          <main className="main-content">
            <div className="inventory-fix-state">
              <div className="fix-content">
                <h2>Product Code Update Required</h2>
                <p>Your inventory has <strong>{inventory.length} products</strong> with random Firebase IDs. Update them to use smart product codes like <strong>RICE001</strong>, <strong>MILK001</strong>, etc.</p>
                
                <div className="inventory-actions">
                  <button 
                    className="btn-fix-codes"
                    onClick={async () => {
                      const confirmed = window.confirm(
                        `This will update all ${inventory.length} products with smart product codes based on their names. Continue?`
                      );
                      if (!confirmed) return;
                      
                      setIsInitializing(true);
                      try {
                        const result = await updateExistingProductCodes();
                        console.log('✅ Product codes updated:', result);
                        
                        const sampleCodesText = result.sampleCodes 
                          ? result.sampleCodes.map(p => `${p.name}: ${p.oldId} → ${p.newCode}`).join('\n')
                          : '';
                        
                        alert(`Successfully updated ${result.updated} products with smart codes!\n\nSample Updates:\n${sampleCodesText}`);
                      } catch (error) {
                        console.error('❌ Failed to update codes:', error);
                        alert('Failed to update product codes. Please try again.');
                      } finally {
                        setIsInitializing(false);
                      }
                    }}
                    disabled={isInitializing}
                  >
                    {isInitializing ? 'Updating Product Codes...' : 'Fix Product Codes'}
                  </button>
                  
                  <button 
                    className="btn-continue"
                    onClick={() => {
                      // Continue with current inventory
                      console.log('Continuing with current inventory');
                    }}
                  >
                    Continue with Current Codes
                  </button>
                </div>
                
                <p className="fix-note">Smart codes make products easier to search and manage</p>
              </div>
            </div>
          </main>
        </div>
      );
    }
  }

  // Show empty inventory state with option to initialize
  if (inventory.length === 0 && !loading) {
    return (
      <div className="app-container">
        <Sidebar 
          activeView={activeView} 
          setActiveView={setActiveView}
          userEmail={currentUser.email}
        />
        <main className="main-content">
          <div className="empty-inventory-state">
            <div className="empty-content">
              <h2>Welcome to My Store!</h2>
              <p>Your inventory is empty. Add our comprehensive supermarket inventory with <strong>150+ real products</strong> across 15+ categories including fresh produce, dairy, meat, bakery, beverages, snacks, household items, and more!</p>
              
              <div className="inventory-actions">
                <button 
                  className="btn-add-sample"
                  onClick={async () => {
                    setIsInitializing(true);
                    try {
                      const result = await initializeInventory(false); // Don't clear, just add
                      console.log('✅ Comprehensive inventory added:', result);
                      
                      // Show sample codes in alert
                      const sampleCodesText = result.sampleCodes 
                        ? result.sampleCodes.map(p => `${p.name} → ${p.code}`).join('\n')
                        : '';
                      
                      alert(`Successfully added ${result.count || '150+'} products to your inventory!\n\nSample Product Codes:\n${sampleCodesText}`);
                    } catch (error) {
                      console.error('❌ Failed to add inventory:', error);
                      alert('Failed to add inventory. Please try again.');
                    } finally {
                      setIsInitializing(false);
                    }
                  }}
                  disabled={isInitializing}
                >
                  {isInitializing ? 'Adding 150+ Products...' : 'Add Complete Supermarket Inventory'}
                </button>
                
                <button 
                  className="btn-replace-sample"
                  onClick={async () => {
                    const confirmed = window.confirm(
                      'This will clear all existing inventory and add 150+ new products with smart product codes. Are you sure?'
                    );
                    if (!confirmed) return;
                    
                    setIsInitializing(true);
                    try {
                      const result = await initializeInventory(true); // Clear first, then add
                      console.log('✅ Inventory replaced:', result);
                      
                      // Show sample codes in alert
                      const sampleCodesText = result.sampleCodes 
                        ? result.sampleCodes.map(p => `${p.name} → ${p.code}`).join('\n')
                        : '';
                      
                      alert(`Successfully replaced inventory with ${result.count || '150+'} new products!\n\nSample Product Codes:\n${sampleCodesText}`);
                    } catch (error) {
                      console.error('❌ Failed to replace inventory:', error);
                      alert('Failed to replace inventory. Please try again.');
                    } finally {
                      setIsInitializing(false);
                    }
                  }}
                  disabled={isInitializing}
                >
                  {isInitializing ? 'Replacing Inventory...' : 'Replace Current Inventory'}
                </button>
              </div>
              
              <p className="empty-note">This will add products from all major supermarket categories</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error loading application</h2>
        <p>{error}</p>
        <button 
          className="btn-retry" 
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  const renderActiveView = () => {
    // Check if user can access the current view (we'll handle this synchronously with state)
    // For now, we'll trust the userRole state that was set during authorization
    
    switch (activeView) {
      case 'dashboard':
        return renderDashboard(userRole);
      case 'stores':
        return <StoresView />;
      case 'users':
        return <UserManagement />;
      case 'store-users':
        return <StoreUsersView />;
      case 'inventory':
        // Show different inventory views based on user role
        if (userRole === USER_ROLES.ADMIN || userRole === USER_ROLES.SUPER_ADMIN) {
          // Admins and Super Admins can manage inventory
          return <AdminPanel inventory={inventory} onClose={() => setActiveView('dashboard')} />;
        } else {
          // Cashiers get a read-only inventory view
          return (
            <div className="inventory-view">
              <div className="inventory-header">
                <h2>Inventory ({inventory.length} items)</h2>
                <p>View-only access - Contact admin to make changes</p>
              </div>
              <InventorySidebar 
                inventory={inventory} 
                addToCart={addToCart}
                readOnly={true}
              />
            </div>
          );
        }
      case 'barcode':
        return <BarcodeManager inventory={inventory} onClose={() => setActiveView('dashboard')} />;
      case 'barcode-test':
        return <BarcodeTestPage />;
      case 'billing':
        return (
          <div className="billing-layout">
            <BillingTable 
              cart={cart} 
              inventory={inventory}
              updateQty={updateQty} 
              removeItem={removeItem} 
              clearCart={clearCart}
              addToCart={addToCart}
            />
            <InventorySidebar 
              inventory={inventory} 
              addToCart={addToCart} 
            />
          </div>
        );
      case 'reports':
        return <ReportsView inventory={inventory} />;
      case 'lowstock':
        return <LowStockView inventory={inventory} />;
      case 'activity':
        return <ActivityView inventory={inventory} />;
      case 'settings':
        // Only store admins can access settings
        if (userRole === USER_ROLES.ADMIN) {
          return <StoreSettings />;
        } else {
          return <UnauthorizedAccess />;
        }
      default:
        return renderDashboard(userRole);
    }
  };

  const renderDashboard = (userRole) => {
    switch (userRole) {
      case USER_ROLES.SUPER_ADMIN:
        return <SuperAdminDashboard setActiveView={setActiveView} />;
      case USER_ROLES.ADMIN:
        return <AdminDashboard inventory={inventory} setActiveView={setActiveView} />;
      case USER_ROLES.CASHIER:
        return <CashierDashboard inventory={inventory} setActiveView={setActiveView} />;
      default:
        return <UnauthorizedAccess />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView}
        userEmail={currentUser.email}
      />
      <main className="main-content">
        {renderActiveView()}
      </main>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default App;