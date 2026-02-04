import { 
  LayoutDashboard, 
  Store, 
  Users, 
  Package, 
  Receipt, 
  BarChart3, 
  AlertTriangle, 
  Activity,
  LogOut,
  QrCode,
  Settings
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getNavigationItems, getUserRole, getRoleDisplayName, getUserInfo } from '../utils/roleManager';

const Sidebar = ({ activeView, setActiveView, userEmail }) => {
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  // Get navigation items based on user role
  const navigationItems = getNavigationItems(userEmail);
  const userRole = getUserRole(userEmail);
  const roleDisplayName = getRoleDisplayName(userRole);
  const userInfo = getUserInfo(userEmail);

  // Icon mapping
  const iconMap = {
    'Home': LayoutDashboard,
    'CreditCard': Receipt,
    'Package': Package,
    'Store': Store,
    'Users': Users,
    'BarChart3': BarChart3,
    'QrCode': QrCode,
    'Activity': Activity,
    'AlertTriangle': AlertTriangle,
    'Settings': Settings
  };

  const getUserDisplayName = () => {
    if (userEmail) {
      return userEmail.split('@')[0];
    }
    return 'user';
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <Store size={24} />
          <span>My Store</span>
        </div>
        <div className="user-role-badge">
          <span className={`role-indicator ${userRole}`}>{roleDisplayName}</span>
          <span className="user-name">{getUserDisplayName()}</span>
          {userInfo?.storeName && userInfo.storeName !== 'Company Admin' && (
            <span className="store-name">{userInfo.storeName}</span>
          )}
        </div>
      </div>

      <nav className="sidebar-nav">
        {navigationItems.map((item) => {
          const Icon = iconMap[item.icon] || Package;
          return (
            <button
              key={item.id}
              className={`nav-item ${activeView === item.id ? 'active' : ''}`}
              onClick={() => setActiveView(item.id)}
              title={item.label}
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