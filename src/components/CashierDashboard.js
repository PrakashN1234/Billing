import { useState, useEffect, useCallback } from 'react';
import { 
  Package, 
  TrendingUp, 
  Receipt,
  CreditCard,
  AlertTriangle,
  User,
  Clock
} from 'lucide-react';
import { subscribeToSalesByStore } from '../services/firebaseService';
import { useAuth } from '../contexts/AuthContext';
import { getRoleDisplayName, getUserRole, getUserInfo, getUserStoreId } from '../utils/roleManager';

const CashierDashboard = ({ inventory, setActiveView }) => {
  const { currentUser, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [todayStats, setTodayStats] = useState({
    todaySales: 0,
    todayBills: 0,
    averageBill: 0
  });

  const userInfo = getUserInfo(currentUser?.email);
  const userStoreId = getUserStoreId(currentUser?.email);

  const calculateTodayStats = useCallback((salesData) => {
    console.log('📊 Calculating today stats from sales:', salesData.length);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();
    
    const todaySales = salesData.filter(sale => {
      // Handle both Firestore timestamp and regular timestamp
      let saleTimestamp;
      if (sale.timestamp?.seconds) {
        saleTimestamp = sale.timestamp.seconds * 1000;
      } else if (sale.timestamp) {
        saleTimestamp = sale.timestamp;
      } else {
        return false;
      }
      
      const saleDate = new Date(saleTimestamp);
      saleDate.setHours(0, 0, 0, 0);
      
      return saleDate.getTime() === todayTimestamp;
    });

    console.log('📅 Today\'s sales count:', todaySales.length);
    
    const todayTotal = todaySales.reduce((sum, sale) => sum + (sale.total || 0), 0);
    const todayCount = todaySales.length;
    const avgBill = todayCount > 0 ? todayTotal / todayCount : 0;

    console.log('💰 Today total:', todayTotal, 'Bills:', todayCount, 'Average:', avgBill);

    setTodayStats({
      todaySales: todayTotal,
      todayBills: todayCount,
      averageBill: avgBill
    });
  }, []);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(false); // Set loading false immediately, subscription will handle data
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setLoading(false);
    }
  }, [userStoreId]);

  // Subscribe to real-time sales updates
  useEffect(() => {
    if (!userStoreId) return;
    
    console.log('📊 Setting up sales subscription for store:', userStoreId);
    
    const unsubscribe = subscribeToSalesByStore(
      userStoreId,
      50,
      (salesData) => {
        console.log('💰 Sales data received:', salesData.length, 'sales');
        calculateTodayStats(salesData);
      },
      (error) => {
        console.error('Error in sales subscription:', error);
      }
    );

    return () => {
      console.log('🔌 Unsubscribing from sales');
      unsubscribe();
    };
  }, [userStoreId, calculateTodayStats]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const handleQuickAction = (actionId) => {
    switch (actionId) {
      case 'bill':
        setActiveView('billing');
        break;
      case 'inventory':
        setActiveView('inventory');
        break;
      case 'lowstock':
        setActiveView('lowstock');
        break;
      default:
        console.log('Unknown action:', actionId);
    }
  };

  const quickActions = [
    { id: 'bill', label: 'New Bill', icon: CreditCard, color: 'orange' },
    { id: 'inventory', label: 'View Inventory', icon: Package, color: 'blue' },
    { id: 'lowstock', label: 'Low Stock Items', icon: AlertTriangle, color: 'red' }
  ];

  const lowStockItems = inventory.filter(item => 
    item.stock < 10 && (!userStoreId || item.storeId === userStoreId)
  );
  const outOfStockItems = inventory.filter(item => 
    item.stock === 0 && (!userStoreId || item.storeId === userStoreId)
  );
  const userRole = getUserRole(currentUser?.email);

  const getUserDisplayName = () => {
    if (currentUser?.email) {
      return currentUser.email.split('@')[0];
    }
    return 'cashier';
  };

  const getCurrentShift = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 14) return 'Morning Shift';
    if (hour >= 14 && hour < 22) return 'Evening Shift';
    return 'Night Shift';
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading-state">
          <Package size={48} />
          <p>Loading Cashier dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard cashier-dashboard">
      {/* Store Context Header */}
      <div className="store-context-header">
        <div className="store-info-card cashier">
          <div className="store-icon">
            <Package size={24} />
          </div>
          <div className="store-details">
            <h2>Currently Working At</h2>
            <h1>{userInfo?.storeName || 'ABC'}</h1>
            <div className="store-meta">
              <span className="store-id">Store ID: {userStoreId || 'store_001'}</span>
              <span className="admin-role">{getCurrentShift()}</span>
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
          <div className="role-badge cashier">
            <User size={16} />
            <span>{getRoleDisplayName(userRole)}</span>
          </div>
          <h1>Cashier Dashboard</h1>
          <div className="welcome-banner">
            <span>Welcome, {getUserDisplayName()}! Ready to serve customers at {userInfo?.storeName || 'ABC'}.</span>
          </div>
          <div className="shift-info">
            <Clock size={16} />
            <span>{getCurrentShift()}</span>
          </div>
        </div>
        <div className="user-profile">
          <div className="avatar cashier">{getUserDisplayName().charAt(0).toUpperCase()}</div>
          <div className="user-info">
            <span className="user-name">{getUserDisplayName()}</span>
            <span className="user-role">Cashier</span>
            <span className="user-email">{currentUser?.email}</span>
            <span className="user-store">{userInfo?.storeName || 'ABC'}</span>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card sales">
          <div className="stat-icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">TODAY'S SALES</div>
            <div className="stat-value">₹{todayStats.todaySales.toFixed(0)}</div>
          </div>
        </div>

        <div className="stat-card bills">
          <div className="stat-icon">
            <Receipt size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">TODAY'S BILLS</div>
            <div className="stat-value">{todayStats.todayBills}</div>
          </div>
        </div>

        <div className="stat-card average">
          <div className="stat-icon">
            <CreditCard size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">AVERAGE BILL</div>
            <div className="stat-value">₹{todayStats.averageBill.toFixed(0)}</div>
          </div>
        </div>

        <div className="stat-card products">
          <div className="stat-icon">
            <Package size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">AVAILABLE PRODUCTS</div>
            <div className="stat-value">
              {inventory.filter(item => 
                item.stock > 0 && (!userStoreId || item.storeId === userStoreId)
              ).length}
            </div>
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
                  className={`action-card ${action.color} large`}
                  onClick={() => handleQuickAction(action.id)}
                  title={`Navigate to ${action.label}`}
                >
                  <Icon size={24} />
                  <span>{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {outOfStockItems.length > 0 && (
          <div className="out-of-stock-alert">
            <div className="alert-header">
              <AlertTriangle size={20} />
              <span>Out of Stock Items</span>
            </div>
            <div className="alert-content">
              <p>{outOfStockItems.length} items are currently out of stock</p>
              <div className="out-of-stock-items">
                {outOfStockItems.slice(0, 5).map((item) => (
                  <div key={item.id} className="out-of-stock-item">
                    <span className="item-name">{item.name}</span>
                    <span className="item-status">Out of Stock</span>
                  </div>
                ))}
                {outOfStockItems.length > 5 && (
                  <p className="more-items">...and {outOfStockItems.length - 5} more items</p>
                )}
              </div>
            </div>
          </div>
        )}

        {lowStockItems.length > 0 && (
          <div className="low-stock-alert">
            <div className="alert-header">
              <AlertTriangle size={20} />
              <span>Low Stock Alert</span>
            </div>
            <div className="alert-content">
              <p>{lowStockItems.length} items are running low on stock</p>
              <div className="low-stock-items">
                {lowStockItems.slice(0, 5).map((item) => (
                  <div key={item.id} className="low-stock-item">
                    <span className="item-name">{item.name}</span>
                    <span className="item-stock">{item.stock} left</span>
                  </div>
                ))}
                {lowStockItems.length > 5 && (
                  <p className="more-items">...and {lowStockItems.length - 5} more items</p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="cashier-tips">
          <h3>Cashier Tips</h3>
          <div className="tips-grid">
            <div className="tip-card">
              <h4>🔍 Quick Search</h4>
              <p>Use product codes (e.g., RICE001) or scan barcodes for faster billing</p>
            </div>
            <div className="tip-card">
              <h4>📱 Mobile Friendly</h4>
              <p>The billing system works great on tablets and mobile devices</p>
            </div>
            <div className="tip-card">
              <h4>🧾 Print Bills</h4>
              <p>After checkout, you can print, download, or save bills as PDF</p>
            </div>
            <div className="tip-card">
              <h4>⚠️ Stock Alerts</h4>
              <p>Check stock levels before adding items to avoid out-of-stock issues</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashierDashboard;