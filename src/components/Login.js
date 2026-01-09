import { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { Eye, EyeOff, Store, User, Lock } from 'lucide-react';
import '../utils/testAuth'; // Import test functions
import './Login.css';

const Login = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Basic validation
    if (!email || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      console.log('Attempting authentication...', { isLogin, email });
      
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('✅ Login successful:', userCredential.user.email);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log('✅ Account created:', userCredential.user.email);
      }
      onLogin();
    } catch (error) {
      console.error('❌ Authentication error:', error);
      
      // Provide user-friendly error messages
      let errorMessage = error.message;
      
      switch (error.code) {
        case 'auth/configuration-not-found':
          errorMessage = 'Authentication service not configured. Please contact support.';
          break;
        case 'auth/email-already-in-use':
          errorMessage = 'An account with this email already exists. Try signing in instead.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak. Please use at least 6 characters.';
          break;
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email. Try creating an account.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password. Please try again.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection.';
          break;
        default:
          errorMessage = `Authentication failed: ${error.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, 'demo@mystore.com', 'demo123');
      onLogin();
    } catch (error) {
      setError('Demo login failed. Please use manual login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <Store size={40} className="store-icon" />
          <h1>My Store</h1>
          <p>Supermarket Billing System</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <h2>{isLogin ? 'Sign In' : 'Create Account'}</h2>
          
          {error && <div className="error-message">{error}</div>}
          
          <div className="input-group">
            <User size={20} className="input-icon" />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <Lock size={20} className="input-icon" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>

          <button type="button" className="demo-btn" onClick={handleDemoLogin} disabled={loading}>
            Try Demo Login
          </button>

          <p className="switch-mode">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              className="link-btn"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </form>

        <div className="demo-credentials">
          <h4>Demo Credentials:</h4>
          <p>Email: demo@mystore.com</p>
          <p>Password: demo123</p>
          
        </div>
      </div>
    </div>
  );
};

export default Login;