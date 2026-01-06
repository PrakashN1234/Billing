import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Header from './components/Header';
import BillingTable from './components/BillingTable';
import InventorySidebar from './components/InventorySidebar';
import LoadingSpinner from './components/LoadingSpinner';
import { subscribeToInventory } from './services/firebaseService';
import { initializeInventory } from './utils/initializeData';
import './utils/testConnection'; // This makes testFirebaseConnection available globally
import './App.css';

const MainApp = () => {
  const { currentUser } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    
    let unsubscribe;
    
    const setupInventory = async () => {
      // Subscribe to real-time inventory updates
      unsubscribe = subscribeToInventory(
        (inventoryData) => {
          // If inventory is empty, auto-initialize with sample data
          if (inventoryData.length === 0 && !isInitializing) {
            setIsInitializing(true);
            initializeInventory()
              .then(() => {
                console.log('✅ Sample inventory initialized automatically');
                setIsInitializing(false);
              })
              .catch((error) => {
                console.error('❌ Failed to initialize inventory:', error);
                setError('Failed to initialize inventory');
                setIsInitializing(false);
                setLoading(false);
              });
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
    };

    setupInventory();

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isInitializing, currentUser]);

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

  // Show login if user is not authenticated
  if (!currentUser) {
    return <Login />;
  }

  if (loading || isInitializing) {
    return (
      <LoadingSpinner 
        message={isInitializing ? "Setting up inventory..." : "Loading Praba Store..."} 
      />
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

  return (
    <div className="app-container">
      <Header inventory={inventory} />
      <main className="main-layout">
        <BillingTable 
          cart={cart} 
          inventory={inventory}
          updateQty={updateQty} 
          removeItem={removeItem} 
          clearCart={clearCart} 
        />
        <InventorySidebar 
          inventory={inventory} 
          addToCart={addToCart} 
        />
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