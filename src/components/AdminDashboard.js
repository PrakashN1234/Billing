import { useState, useEffect, useCallback } from 'react';
import { 
  Package, 
  TrendingUp, 
  Receipt,
  Plus,
  BarChart3,
  AlertTriangle,
  UserCheck,
  Activity,
  QrCode
} from 'lucide-react';
import { getSalesByStore, getAccessibleStores } from '../services/firebaseService';
import { useAuth } from '../contexts/AuthContext';
import { generateBarcodesForInventory } from '../utils/generateInventoryBarcodes';
import { generateCodesForInventory } from '../utils/generateProductCodes';
import { getRoleDisplayName, getUserRole, getUserInfo, getUserStoreId } from '../utils/roleManager';

const AdminDashboard = ({ inventory, setActiveView }) => {
  const { currentUser, logout } = useAuth();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSales: 0,
    totalBills: 0,
    lowStockItems: 0,
    productsWithBarcodes: 0,
    productsWithoutBarcodes: 0,
    productsWithCodes: 0,
    productsWithoutCodes: 0
  });

  const userInfo = getUserInfo(currentUser?.email);
  const userStoreId = getUserStoreId(currentUser?.email);

  const loadDashboardData = useCallback(async () => {
    try {
      // Admin can only see their store's sales
      const salesData = await getSalesByStore(userStoreId, 50);
      setSales(salesData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [userStoreId]);

  const loadStoreData = useCallback(async () => {
    try {
      // Admin can only see their own store
      const storesData = await getAccessibleStores(false, userStoreId);
      console.log('Store data loaded:', storesData); // For debugging
    } catch (error) {
      console.error('Error loading store data:', error);
    }
  }, [userStoreId]);

  useEffect(() => {
    loadDashboardData();
    loadStoreData();
  }, [loadDashboardData, loadStoreData]);

  const updateStats = useCallback(() => {
    // Filter inventory to only show products from user's store
    const storeInventory = inventory.filter(item => 
      !userStoreId || item.storeId === userStoreId
    );
    
    const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
    const productsWithBarcodes = storeInventory.filter(item => item.barcode).length;
    const productsWithoutBarcodes = storeInventory.length - productsWithBarcodes;
    const productsWithCodes = storeInventory.filter(item => item.code).length;
    const productsWithoutCodes = storeInventory.length - productsWithCodes;
    const lowStockItems = storeInventory.filter(item => item.stock < 10).length;
    
    const newStats = {
      totalProducts: storeInventory.length,
      totalSales: totalSales,
      totalBills: sales.length,
      lowStockItems,
      productsWithBarcodes,
      productsWithoutBarcodes,
      productsWithCodes,
      productsWithoutCodes
    };
    
    setStats(newStats);
  }, [inventory, sales, userStoreId]);

  useEffect(() => {
    updateStats();
  }, [inventory, sales, updateStats]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const handleQuickAction = async (actionId) => {
    switch (actionId) {
      case 'product':
        setActiveView('inventory');
        break;
      case 'barcode':
        setActiveView('barcode');
        break;
      case 'reports':
        setActiveView('reports');
        break;
      case 'activity':
        setActiveView('activity');
        break;
      case 'lowstock':
        setActiveView('lowstock');
        break;
      case 'users':
        setActiveView('store-users');
        break;
      case 'generate-codes':
        await handleGenerateAllCodes();
        break;
      case 'generate-barcodes':
        await handleGenerateAllBarcodes();
        break;
      default:
        console.log('Unknown action:', actionId);
    }
  };

  const handleGenerateAllBarcodes = async () => {
    const itemsWithoutBarcodes = inventory.filter(item => !item.barcode);
    
    if (itemsWithoutBarcodes.length === 0) {
      alert('All products already have barcodes!');
      return;
    }

    const confirmed = window.confirm(
      `Generate barcodes for ${itemsWithoutBarcodes.length} products without barcodes?`
    );
    
    if (!confirmed) return;

    try {
      setLoading(true);
      const result = await generateBarcodesForInventory(inventory);
      
      if (result.success) {
        alert(`Success! Generated barcodes for ${result.updated} products.`);
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error generating barcodes:', error);
      alert('Failed to generate barcodes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAllCodes = async () => {
    const itemsWithoutCodes = inventory.filter(item => !item.code);
    
    if (itemsWithoutCodes.length === 0) {
      alert('All products already have product codes!');
      return;
    }

    const confirmed = window.confirm(
      `Generate product codes for ${itemsWithoutCodes.length} products without codes?`
    );
    
    if (!confirmed) return;

    try {
      setLoading(true);
      const result = await generateCodesForInventory(inventory);
      
      if (result.success) {
        alert(`Success! Generated product codes for ${result.updated} products.`);
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error generating product codes:', error);
      alert('Failed to generate product codes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { id: 'product', label: 'Add Product', icon: Plus, color: 'green' },
    { id: 'reports', label: 'Sales Reports', icon: BarChart3, color: 'indigo' },
    { id: 'barcode', label: 'Manage Barcodes', icon: QrCode, color: 'teal' },
    { id: 'users', label: 'Manage Users', icon: UserCheck, color: 'purple' },
    { id: 'activity', label: 'View Activity', icon: Activity, color: 'blue' },
    { id: 'lowstock', label: 'Low Stock', icon: AlertTriangle, color: 'orange' }
  ];

  const lowStockItems = inventory.filter(item => item.stock < 10);
  const userRole = getUserRole(currentUser?.email);

  const getUserDisplayName = () => {
    if (currentUser?.email) {
      return currentUser.email.split('@')[0];
    }
    return 'admin';
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading-state">
          <Package size={48} />
          <p>Loading Admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard admin-dashboard">
      <div className="dashboard-header">
        <div className="welcome-section">
          <div className="role-badge admin">
            <UserCheck size={16} />
            <span>{getRoleDisplayName(userRole)}</span>
          </div>
          <h1>Admin Dashboard - {userInfo?.storeName || 'Main Store'}</h1>
          <div className="welcome-banner">
            <span>Welcome back, {getUserDisplayName()}! Managing {userInfo?.storeName || 'Main Store'} efficiently.</span>
          </div>
        </div>
        <div className="user-profile">
          <div className="avatar admin">{getUserDisplayName().charAt(0).toUpperCase()}</div>
          <div className="user-info">
            <span className="user-name">{getUserDisplayName()}</span>
            <span className="user-role">Administrator</span>
            <span className="user-email">{currentUser?.email}</span>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card products">
          <div className="stat-icon">
            <Package size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">TOTAL PRODUCTS</div>
            <div className="stat-value">{stats.totalProducts}</div>
          </div>
        </div>

        <div className="stat-card sales">
          <div className="stat-icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">TOTAL SALES</div>
            <div className="stat-value">₹{stats.totalSales.toFixed(0)}</div>
          </div>
        </div>

        <div className="stat-card bills">
          <div className="stat-icon">
            <Receipt size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">TOTAL BILLS</div>
            <div className="stat-value">{stats.totalBills}</div>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">LOW STOCK ITEMS</div>
            <div className="stat-value">{stats.lowStockItems}</div>
          </div>
        </div>

        <div className="stat-card codes">
          <div className="stat-icon">
            <Package size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">WITH CODES</div>
            <div className="stat-value">{stats.productsWithCodes}/{stats.totalProducts}</div>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="quick-actions">
          <h3>Quick Actions</h3>
          <div className="actions-grid">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button 
                  key={action.id} 
                  className={`action-card ${action.color}`}
                  onClick={() => handleQuickAction(action.id)}
                  title={`Navigate to ${action.label}`}
                >
                  <Icon size={20} />
                  <span>{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {lowStockItems.length > 0 && (
          <div className="low-stock-alert">
            <div className="alert-header">
              <AlertTriangle size={20} />
              <span>Low Stock Alert</span>
            </div>
            <div className="low-stock-items">
              {lowStockItems.slice(0, 5).map((item) => (
                <div key={item.id} className="low-stock-item">
                  <span className="item-name">{item.name}</span>
                  <span className="item-stock">{item.stock} left</span>
                </div>
              ))}
            </div>
            <button 
              className="view-all-btn"
              onClick={() => setActiveView('lowstock')}
            >
              View All Low Stock Items
            </button>
          </div>
        )}

        {(stats.productsWithoutBarcodes > 0 || stats.productsWithoutCodes > 0) && (
          <div className="barcode-alert">
            <div className="alert-header">
              <BarChart3 size={20} />
              <span>Product Management</span>
            </div>
            <div className="barcode-info">
              {stats.productsWithoutCodes > 0 && (
                <p>{stats.productsWithoutCodes} products need product codes</p>
              )}
              {stats.productsWithoutBarcodes > 0 && (
                <p>{stats.productsWithoutBarcodes} products need barcodes</p>
              )}
              <p>Generate codes and barcodes for better inventory management</p>
            </div>
            <div className="barcode-actions">
              {stats.productsWithoutCodes > 0 && (
                <button 
                  className="generate-all-btn"
                  onClick={() => handleQuickAction('generate-codes')}
                >
                  Generate Product Codes
                </button>
              )}
              {stats.productsWithoutBarcodes > 0 && (
                <button 
                  className="generate-all-btn"
                  onClick={() => handleQuickAction('generate-barcodes')}
                >
                  Generate Barcodes
                </button>
              )}
              <button 
                className="manage-btn"
                onClick={() => setActiveView('barcode')}
              >
                Manage Barcodes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;