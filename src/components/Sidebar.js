import { useState } from 'react';
import { 
  LayoutDashboard, 
  Store, 
  Users, 
  Package, 
  Receipt, 
  BarChart3, 
  AlertTriangle, 
  Activity,
  LogOut 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = ({ activeView, setActiveView }) => {
  const { logout, currentUser } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'stores', label: 'Stores', icon: Store },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'billing', label: 'Billing', icon: Receipt },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'lowstock', label: 'Low Stock', icon: AlertTriangle },
    { id: 'activity', label: 'Activity Log', icon: Activity },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <Store size={24} />
          <span>SuperMarket</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`nav-item ${activeView === item.id ? 'active' : ''}`}
              onClick={() => setActiveView(item.id)}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button className="nav-item logout" onClick={handleLogout}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;