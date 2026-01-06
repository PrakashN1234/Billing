import { useState } from 'react';
import { ShoppingBasket, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AdminPanel from './AdminPanel';

const Header = ({ inventory }) => {
  const [showAdmin, setShowAdmin] = useState(false);
  const { logout, currentUser } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  return (
    <>
      <header className="header">
        <h1><ShoppingBasket size={28} /> Praba <span>Store</span></h1>
        <div className="header-controls">
          <div className="user-info">
            <span>Welcome, {currentUser?.email}</span>
          </div>
          <div className="status">System Active</div>
          <button 
            className="btn-admin" 
            onClick={() => setShowAdmin(true)}
            title="Admin Panel"
          >
            <Settings size={20} />
          </button>
          <button 
            className="btn-logout" 
            onClick={handleLogout}
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>
      
      {showAdmin && (
        <AdminPanel 
          inventory={inventory} 
          onClose={() => setShowAdmin(false)} 
        />
      )}
    </>
  );
};

export default Header;

