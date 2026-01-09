import { useState, useEffect } from 'react';
import { 
  Store, 
  Package, 
  TrendingUp, 
  Receipt,
  Plus,
  Users,
  FileText,
  CreditCard,
  BarChart3,
  AlertTriangle
} from 'lucide-react';
import { getSales, getInventory } from '../services/firebaseService';

const Dashboard = ({ inventory, currentUser }) => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStores: 1,
    totalProducts: 0,
    totalSales: 0,
    totalBills: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, [inventory]);

  const loadDashboardData = async () => {
    try {
      const salesData = await getSales(50);
      setSales(salesData);
      
      const totalSales = salesData.reduce((sum, sale) => sum + sale.total, 0);
      
      setStats({
        totalStores: 1,
        totalProducts: inventory.length,
        totalSales: totalSales,
        totalBills: salesData.length
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { id: 'store', label: 'Add Store', icon: Store, color: 'blue' },
    { id: 'user', label: 'Add User', icon: Users, color: 'purple' },
    { id: 'product', label: 'Add Product', icon: Plus, color: 'green' },
    { id: 'bill', label: 'New Bill', icon: CreditCard, color: 'orange' },
    { id: 'reports', label: 'View Reports', icon: BarChart3, color: 'indigo' }
  ];

  const lowStockItems = inventory.filter(item => item.stock < 10);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>Dashboard</h1>
          <div className="welcome-banner">
            <span>Welcome back, admin!</span>
          </div>
        </div>
        <div className="user-profile">
          <div className="avatar">A</div>
          <div className="user-info">
            <span className="user-name">admin</span>
            <span className="user-role">Admin</span>
            <span className="user-email">admin@mystore.com</span>
          </div>
          <button className="logout-btn">Logout</button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card stores">
          <div className="stat-icon">
            <Store size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">TOTAL STORES</div>
            <div className="stat-value">{stats.totalStores}</div>
          </div>
        </div>

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
      </div>

      <div className="dashboard-content">
        <div className="quick-actions">
          <h3>Quick Actions</h3>
          <div className="actions-grid">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button key={action.id} className={`action-card ${action.color}`}>
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
              <span>Low Stock</span>
            </div>
            <div className="low-stock-items">
              {lowStockItems.slice(0, 5).map((item) => (
                <div key={item.id} className="low-stock-item">
                  <span className="item-name">{item.name}</span>
                  <span className="item-stock">{item.stock} left</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;