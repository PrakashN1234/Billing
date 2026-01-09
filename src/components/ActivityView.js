import { useState, useEffect } from 'react';
import { 
  Activity, 
  User, 
  Package, 
  ShoppingCart, 
  Settings, 
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  Calendar
} from 'lucide-react';
import { getSales } from '../services/firebaseService';

const ActivityView = ({ inventory }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [dateFilter, setDateFilter] = useState('today');

  useEffect(() => {
    loadActivityData();
  }, []);

  const loadActivityData = async () => {
    setLoading(true);
    try {
      const salesData = await getSales(20);
      
      // Generate mock activity data based on sales and inventory
      const mockActivities = [
        {
          id: 1,
          type: 'sale',
          action: 'Sale Completed',
          description: 'Order #1001 completed successfully',
          user: 'admin@mystore.com',
          timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
          status: 'success',
          details: { amount: '₹250.00', items: 3 }
        },
        {
          id: 2,
          type: 'inventory',
          action: 'Stock Updated',
          description: 'Product "Rice" stock updated',
          user: 'admin@mystore.com',
          timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
          status: 'info',
          details: { product: 'Rice', oldStock: 45, newStock: 50 }
        },
        {
          id: 3,
          type: 'user',
          action: 'User Login',
          description: 'Admin user logged in',
          user: 'admin@mystore.com',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
          status: 'info',
          details: { ip: '192.168.1.1', device: 'Desktop' }
        },
        {
          id: 4,
          type: 'inventory',
          action: 'Low Stock Alert',
          description: 'Product "Milk" is running low',
          user: 'system',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
          status: 'warning',
          details: { product: 'Milk', currentStock: 5, threshold: 10 }
        },
        {
          id: 5,
          type: 'sale',
          action: 'Sale Completed',
          description: 'Order #1000 completed successfully',
          user: 'demo@mystore.com',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
          status: 'success',
          details: { amount: '₹180.50', items: 2 }
        },
        {
          id: 6,
          type: 'system',
          action: 'System Backup',
          description: 'Daily backup completed successfully',
          user: 'system',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
          status: 'success',
          details: { size: '2.5 MB', duration: '30 seconds' }
        },
        {
          id: 7,
          type: 'inventory',
          action: 'Product Added',
          description: 'New product "Bread" added to inventory',
          user: 'admin@mystore.com',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 hours ago
          status: 'success',
          details: { product: 'Bread', price: '₹25.00', stock: 30 }
        }
      ];

      // Add sales activities
      const salesActivities = salesData.slice(0, 5).map((sale, index) => ({
        id: `sale_${index}`,
        type: 'sale',
        action: 'Sale Completed',
        description: `Order completed with ${sale.itemCount} items`,
        user: 'cashier@mystore.com',
        timestamp: sale.timestamp ? new Date(sale.timestamp.seconds * 1000) : new Date(),
        status: 'success',
        details: { amount: `₹${sale.total.toFixed(2)}`, items: sale.itemCount }
      }));

      setActivities([...mockActivities, ...salesActivities]);
    } catch (error) {
      console.error('Error loading activity data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'sale': return ShoppingCart;
      case 'inventory': return Package;
      case 'user': return User;
      case 'system': return Settings;
      default: return Activity;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return CheckCircle;
      case 'warning': return AlertCircle;
      case 'error': return AlertCircle;
      default: return Clock;
    }
  };

  const filteredActivities = activities.filter(activity => {
    if (filterType === 'all') return true;
    return activity.type === filterType;
  });

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours < 24) return `${hours} hours ago`;
    return `${days} days ago`;
  };

  const activityStats = {
    total: activities.length,
    sales: activities.filter(a => a.type === 'sale').length,
    inventory: activities.filter(a => a.type === 'inventory').length,
    users: activities.filter(a => a.type === 'user').length,
    system: activities.filter(a => a.type === 'system').length
  };

  return (
    <div className="activity-view">
      <div className="view-header">
        <h1>Activity Log</h1>
        <div className="header-actions">
          <button className="btn-secondary" onClick={loadActivityData}>
            <Activity size={20} />
            Refresh
          </button>
        </div>
      </div>

      {/* Activity Stats */}
      <div className="activity-stats">
        <div className="stat-item">
          <div className="stat-icon total">
            <Activity size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{activityStats.total}</div>
            <div className="stat-label">Total Activities</div>
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-icon sales">
            <ShoppingCart size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{activityStats.sales}</div>
            <div className="stat-label">Sales</div>
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-icon inventory">
            <Package size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{activityStats.inventory}</div>
            <div className="stat-label">Inventory</div>
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-icon users">
            <User size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{activityStats.users}</div>
            <div className="stat-label">User Actions</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="activity-filters">
        <div className="filter-group">
          <Filter size={16} />
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">All Activities</option>
            <option value="sale">Sales</option>
            <option value="inventory">Inventory</option>
            <option value="user">User Actions</option>
            <option value="system">System</option>
          </select>
        </div>

        <div className="filter-group">
          <Calendar size={16} />
          <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="activity-timeline">
        {loading ? (
          <div className="loading-state">
            <Activity size={48} />
            <p>Loading activities...</p>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="no-activities">
            <Activity size={48} />
            <p>No activities found</p>
            <small>Activities will appear here as they occur</small>
          </div>
        ) : (
          filteredActivities.map((activity) => {
            const ActivityIcon = getActivityIcon(activity.type);
            const StatusIcon = getStatusIcon(activity.status);
            
            return (
              <div key={activity.id} className={`activity-item ${activity.status}`}>
                <div className="activity-icon">
                  <ActivityIcon size={20} />
                </div>
                
                <div className="activity-content">
                  <div className="activity-header">
                    <div className="activity-title">
                      <span className="action">{activity.action}</span>
                      <div className="activity-status">
                        <StatusIcon size={16} />
                      </div>
                    </div>
                    <div className="activity-time">
                      {formatTimeAgo(activity.timestamp)}
                    </div>
                  </div>
                  
                  <div className="activity-description">
                    {activity.description}
                  </div>
                  
                  <div className="activity-meta">
                    <span className="activity-user">
                      <User size={14} />
                      {activity.user}
                    </span>
                    
                    {activity.details && (
                      <div className="activity-details">
                        {Object.entries(activity.details).map(([key, value]) => (
                          <span key={key} className="detail-item">
                            <strong>{key}:</strong> {value}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ActivityView;