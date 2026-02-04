import { useState, useEffect, useCallback } from 'react';
import { 
  Store, 
  Users,
  Shield,
  Settings,
  UserPlus,
  Building
} from 'lucide-react';
import { subscribeToStores, subscribeToUsers } from '../services/firebaseService';
import { useAuth } from '../contexts/AuthContext';
import { getRoleDisplayName, getUserInfoFromDB } from '../utils/dynamicRoleManager';

const SuperAdminDashboard = ({ setActiveView }) => {
  const { currentUser, logout } = useAuth();
  const [stores, setStores] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  const [stats, setStats] = useState({
    totalStores: 0,
    totalUsers: 0,
    activeStores: 0,
    activeUsers: 0
  });

  // Get user info from database
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (currentUser?.email) {
        const info = await getUserInfoFromDB(currentUser.email);
        setUserInfo(info);
      }
    };
    fetchUserInfo();
  }, [currentUser]);

  useEffect(() => {
    const unsubscribeStores = subscribeToStores(
      (storesData) => {
        setStores(storesData);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading stores for dashboard:', error);
        setLoading(false);
      }
    );

    const unsubscribeUsers = subscribeToUsers(
      (usersData) => {
        setUsers(usersData);
      },
      (error) => {
        console.error('Error loading users for dashboard:', error);
      }
    );

    return () => {
      if (unsubscribeStores) unsubscribeStores();
      if (unsubscribeUsers) unsubscribeUsers();
    };
  }, []);

  const updateStats = useCallback(() => {
    // Handle different status formats (Active, active, etc.)
    const activeStores = stores.filter(store => 
      store.status && store.status.toLowerCase() === 'active'
    ).length;
    const activeUsers = users.filter(user => 
      user.status && user.status.toLowerCase() === 'active'
    ).length;
    
    const newStats = {
      totalStores: stores.length,
      totalUsers: users.length,
      activeStores,
      activeUsers
    };
    
    setStats(newStats);
  }, [stores, users]);

  useEffect(() => {
    updateStats();
  }, [stores, users, updateStats]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const handleQuickAction = async (actionId) => {
    switch (actionId) {
      case 'store':
        setActiveView('stores');
        break;
      case 'user':
        setActiveView('users');
        break;
      case 'add-store':
        setActiveView('stores');
        break;
      case 'add-user':
        setActiveView('users');
        break;
      case 'settings':
        setActiveView('settings');
        break;
      default:
        console.log('Unknown action:', actionId);
    }
  };

  const quickActions = [
    { id: 'add-store', label: 'Add Store', icon: Building, color: 'blue' },
    { id: 'add-user', label: 'Add User', icon: UserPlus, color: 'purple' },
    { id: 'store', label: 'Manage Stores', icon: Store, color: 'green' },
    { id: 'user', label: 'Manage Users', icon: Users, color: 'orange' }
  ];

  const getUserDisplayName = () => {
    if (userInfo?.name) {
      return userInfo.name;
    }
    if (currentUser?.email) {
      return currentUser.email.split('@')[0];
    }
    return 'superadmin';
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading-state">
          <Shield size={48} />
          <p>Loading Super Admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard super-admin-dashboard">
      <div className="dashboard-header">
        <div className="welcome-section">
          <div className="role-badge super-admin">
            <Shield size={16} />
            <span>{userInfo ? getRoleDisplayName(userInfo.role) : 'Loading...'}</span>
          </div>
          <h1>Super Admin Dashboard</h1>
          <div className="welcome-banner">
            <span>Welcome back, {getUserDisplayName()}! Manage users and stores across the system.</span>
          </div>
        </div>
        <div className="user-profile">
          <div className="avatar super-admin">{getUserDisplayName().charAt(0).toUpperCase()}</div>
          <div className="user-info">
            <span className="user-name">{getUserDisplayName()}</span>
            <span className="user-role">Super Administrator</span>
            <span className="user-email">{currentUser?.email}</span>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
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

        <div className="stat-card users">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">TOTAL USERS</div>
            <div className="stat-value">{stats.totalUsers}</div>
          </div>
        </div>

        <div className="stat-card stores">
          <div className="stat-icon">
            <Building size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">ACTIVE STORES</div>
            <div className="stat-value">{stats.activeStores}</div>
          </div>
        </div>

        <div className="stat-card users">
          <div className="stat-icon">
            <UserPlus size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">ACTIVE USERS</div>
            <div className="stat-value">{stats.activeUsers}</div>
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

        <div className="admin-tools">
          <h3>System Management</h3>
          <div className="admin-tools-grid">
            <button 
              className="admin-tool-card database"
              onClick={() => handleQuickAction('store')}
            >
              <Store size={24} />
              <div>
                <h4>Store Management</h4>
                <p>Create and manage stores across the system</p>
              </div>
            </button>
            
            <button 
              className="admin-tool-card barcode"
              onClick={() => handleQuickAction('user')}
            >
              <Users size={24} />
              <div>
                <h4>User Management</h4>
                <p>Create and manage user accounts and roles</p>
              </div>
            </button>
            
            <button 
              className="admin-tool-card settings"
              onClick={() => setActiveView('settings')}
            >
              <Settings size={24} />
              <div>
                <h4>System Settings</h4>
                <p>Configure system-wide settings</p>
              </div>
            </button>
          </div>
        </div>

        <div className="system-overview">
          <h3>System Overview</h3>
          <div className="overview-grid">
            <div className="overview-card">
              <div className="overview-header">
                <Store size={20} />
                <span>Store Network</span>
              </div>
              <div className="overview-content">
                <p>{stats.totalStores} stores in the system</p>
                <p>{stats.activeStores} currently active</p>
                <button 
                  className="overview-btn"
                  onClick={() => setActiveView('stores')}
                >
                  Manage Stores
                </button>
              </div>
            </div>

            <div className="overview-card">
              <div className="overview-header">
                <Users size={20} />
                <span>User Base</span>
              </div>
              <div className="overview-content">
                <p>{stats.totalUsers} users in the system</p>
                <p>{stats.activeUsers} currently active</p>
                <button 
                  className="overview-btn"
                  onClick={() => setActiveView('users')}
                >
                  Manage Users
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;