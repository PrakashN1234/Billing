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
  QrCode,
  Users,
  Settings
} from 'lucide-react';
import { getSalesByStore, getAccessibleStores, subscribeToUsers } from '../services/firebaseService';
import { useAuth } from '../contexts/AuthContext';
import { generateQRCodesForInventory } from '../utils/generateInventoryQRCodes';
import { generateCodesForInventory } from '../utils/generateProductCodes';
import { syncAllProductCodes, autoGenerateMissingCodes } from '../utils/syncProductCodes';
import { getRoleDisplayName, getUserRole, getUserInfo, getUserStoreId } from '../utils/roleManager';

const AdminDashboard = ({ inventory, setActiveView }) => {
  const { currentUser, logout } = useAuth();
  const [sales, setSales] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSales: 0,
    totalBills: 0,
    lowStockItems: 0,
    productsWithQRCodes: 0,
    productsWithoutQRCodes: 0,
    productsWithCodes: 0,
    productsWithoutCodes: 0,
    totalCashiers: 0,
    activeCashiers: 0,
    inactiveCashiers: 0
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

  // Load users for this store
  useEffect(() => {
    const unsubscribe = subscribeToUsers(
      (usersData) => {
        // Filter users for this store only
        const storeUsers = usersData.filter(user => 
          user.storeId === userStoreId || 
          (user.email && user.email.includes('@mystore.com')) // Legacy users
        );
        setUsers(storeUsers);
      },
      (error) => {
        console.error('Error loading store users:', error);
      }
    );

    return () => unsubscribe();
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
    const productsWithQRCodes = storeInventory.filter(item => item.qrcode || item.barcode).length;
    const productsWithoutQRCodes = storeInventory.length - productsWithQRCodes;
    const productsWithCodes = storeInventory.filter(item => item.code).length;
    const productsWithoutCodes = storeInventory.length - productsWithCodes;
    const lowStockItems = storeInventory.filter(item => item.stock < 10).length;
    
    // Debug: Log user data to understand the structure
    console.log('👥 Users data for stats calculation:', users);
    console.log('🏪 Current store ID:', userStoreId);
    
    // Calculate cashier statistics with more flexible role matching
    const cashiers = users.filter(user => {
      const role = user.role ? user.role.toLowerCase() : '';
      const email = user.email ? user.email.toLowerCase() : '';
      
      // Match various role formats and patterns:
      // 1. Explicit cashier roles
      if (role === 'cashier' || role.includes('cashier')) {
        return true;
      }
      
      // 2. Generic "user" role but email suggests cashier
      if (role === 'user' && email.includes('cashier')) {
        return true;
      }
      
      // 3. No specific role but email suggests cashier
      if (!role && email.includes('cashier')) {
        return true;
      }
      
      // 4. For legacy users, assume non-admin emails are cashiers
      if ((role === 'user' || !role) && 
          !email.includes('admin') && 
          !email.includes('manager') &&
          email.includes('@mystore.com')) {
        return true;
      }
      
      return false;
    });
    
    console.log('💰 Filtered cashiers:', cashiers);
    
    const activeCashiers = cashiers.filter(user => {
      const status = user.status ? user.status.toLowerCase() : 'active';
      return status === 'active';
    }).length;
    
    const inactiveCashiers = cashiers.length - activeCashiers;
    
    console.log('📊 Cashier stats:', {
      total: cashiers.length,
      active: activeCashiers,
      inactive: inactiveCashiers
    });
    
    const newStats = {
      totalProducts: storeInventory.length,
      totalSales: totalSales,
      totalBills: sales.length,
      lowStockItems,
      productsWithQRCodes,
      productsWithoutQRCodes,
      productsWithCodes,
      productsWithoutCodes,
      totalCashiers: cashiers.length,
      activeCashiers,
      inactiveCashiers
    };
    
    setStats(newStats);
  }, [inventory, sales, users, userStoreId]);

  useEffect(() => {
    updateStats();
  }, [inventory, sales, users, updateStats]);

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
      case 'settings':
        setActiveView('settings');
        break;
      case 'generate-codes':
        await handleGenerateAllCodes();
        break;
      case 'generate-qrcodes':
        await handleGenerateAllQRCodes();
        break;
      case 'sync-codes':
        await handleSyncAllCodes();
        break;
      case 'auto-generate':
        await handleAutoGenerateCodes();
        break;
      default:
        console.log('Unknown action:', actionId);
    }
  };

  const handleSyncAllCodes = async () => {
    const confirmed = window.confirm(
      `Sync all products to have matching code, barcode, and QR code?\n\nThis will set barcode = code and qrcode = code for all products.`
    );
    
    if (!confirmed) return;

    try {
      setLoading(true);
      const result = await syncAllProductCodes();
      
      if (result.success) {
        alert(`Success! Synced ${result.updated} products.\n\nAll products now have matching codes.`);
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error syncing codes:', error);
      alert('Failed to sync codes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoGenerateCodes = async () => {
    const itemsWithoutCodes = inventory.filter(item => !item.code);
    
    if (itemsWithoutCodes.length === 0) {
      alert('All products already have codes!');
      return;
    }

    const confirmed = window.confirm(
      `Auto-generate codes for ${itemsWithoutCodes.length} products?\n\nThis will create product codes, barcodes, and QR codes automatically.`
    );
    
    if (!confirmed) return;

    try {
      setLoading(true);
      const result = await autoGenerateMissingCodes();
      
      if (result.success) {
        alert(`Success! Generated codes for ${result.generated} products.`);
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error auto-generating codes:', error);
      alert('Failed to auto-generate codes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAllQRCodes = async () => {
    const itemsWithoutQRCodes = inventory.filter(item => !item.qrcode);
    
    if (itemsWithoutQRCodes.length === 0) {
      alert('All products already have QR codes!');
      return;
    }

    const confirmed = window.confirm(
      `Generate QR codes for ${itemsWithoutQRCodes.length} products without QR codes?`
    );
    
    if (!confirmed) return;

    try {
      setLoading(true);
      const result = await generateQRCodesForInventory(inventory, userStoreId || '001');
      
      if (result.success) {
        alert(`Success! Generated QR codes for ${result.updated} products.`);
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error generating QR codes:', error);
      alert('Failed to generate QR codes. Please try again.');
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
    { id: 'lowstock', label: 'Low Stock', icon: AlertTriangle, color: 'orange' },
    { id: 'settings', label: 'Store Settings', icon: Settings, color: 'gray' }
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
      {/* Store Context Header */}
      <div className="store-context-header">
        <div className="store-info-card">
          <div className="store-icon">
            <Package size={24} />
          </div>
          <div className="store-details">
            <h2>Currently Managing</h2>
            <h1>{userInfo?.storeName || 'ABC'}</h1>
            <div className="store-meta">
              <span className="store-id">Store ID: {userStoreId || 'store_001'}</span>
              <span className="admin-role">Administrator Access</span>
            </div>
          </div>
          <div className="store-status">
            <div className="status-indicator active"></div>
            <span>Active</span>
          </div>
        </div>
      </div>

      <div className="dashboard-header">
        <div className="welcome-section">
          <div className="role-badge admin">
            <UserCheck size={16} />
            <span>{getRoleDisplayName(userRole)}</span>
          </div>
          <h1>Admin Dashboard</h1>
          <div className="welcome-banner">
            <span>Welcome back, {getUserDisplayName()}! Managing {userInfo?.storeName || 'ABC'} efficiently.</span>
          </div>
        </div>
        <div className="user-profile">
          <div className="avatar admin">{getUserDisplayName().charAt(0).toUpperCase()}</div>
          <div className="user-info">
            <span className="user-name">{getUserDisplayName()}</span>
            <span className="user-role">Administrator</span>
            <span className="user-email">{currentUser?.email}</span>
            <span className="user-store">{userInfo?.storeName || 'ABC'}</span>
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

        <div className="stat-card users">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">TOTAL CASHIERS</div>
            <div className="stat-value">{stats.totalCashiers}</div>
            <div className="stat-detail">
              {stats.activeCashiers} active, {stats.inactiveCashiers} inactive
            </div>
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

        {(stats.productsWithoutQRCodes > 0 || stats.productsWithoutCodes > 0) && (
          <div className="barcode-alert">
            <div className="alert-header">
              <BarChart3 size={20} />
              <span>Product Code Management</span>
            </div>
            <div className="barcode-info">
              {stats.productsWithoutCodes > 0 && (
                <p>⚠️ {stats.productsWithoutCodes} products need product codes</p>
              )}
              {stats.productsWithoutQRCodes > 0 && (
                <p>⚠️ {stats.productsWithoutQRCodes} products need QR codes</p>
              )}
              <p>💡 Tip: Use "Sync All Codes" to ensure barcode = qrcode = product code</p>
            </div>
            <div className="barcode-actions">
              {stats.productsWithoutCodes > 0 && (
                <button 
                  className="generate-all-btn"
                  onClick={() => handleQuickAction('auto-generate')}
                  title="Auto-generate codes for products missing them"
                >
                  🔄 Auto-Generate Codes
                </button>
              )}
              <button 
                className="generate-all-btn sync-btn"
                onClick={() => handleQuickAction('sync-codes')}
                title="Sync all products: barcode = qrcode = product code"
              >
                ✨ Sync All Codes
              </button>
              <button 
                className="manage-btn"
                onClick={() => setActiveView('barcode')}
              >
                📊 Manage Barcodes
              </button>
            </div>
          </div>
        )}

        {/* Always show sync option if there are products */}
        {stats.totalProducts > 0 && stats.productsWithoutCodes === 0 && stats.productsWithoutQRCodes === 0 && (
          <div className="barcode-alert success">
            <div className="alert-header">
              <BarChart3 size={20} />
              <span>All Products Have Codes ✅</span>
            </div>
            <div className="barcode-info">
              <p>All {stats.totalProducts} products have product codes, barcodes, and QR codes</p>
              <p>💡 Use "Sync All Codes" if you want to ensure they all match</p>
            </div>
            <div className="barcode-actions">
              <button 
                className="generate-all-btn sync-btn"
                onClick={() => handleQuickAction('sync-codes')}
                title="Sync all products: barcode = qrcode = product code"
              >
                ✨ Sync All Codes
              </button>
              <button 
                className="manage-btn"
                onClick={() => setActiveView('barcode')}
              >
                📊 View Barcodes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;