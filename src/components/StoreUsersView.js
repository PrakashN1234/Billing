import { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, Mail, Phone, Calendar, X, Save, Eye, EyeOff, ToggleLeft, ToggleRight, Key, Shield } from 'lucide-react';
import { 
  subscribeToUsers, 
  addUser, 
  updateUser, 
  deleteUser 
} from '../services/firebaseService';
import { useAuth } from '../contexts/AuthContext';
import { getUserStoreId, getUserStoreName } from '../utils/roleManager';

const StoreUsersView = () => {
  const { currentUser } = useAuth();
  const userStoreId = getUserStoreId(currentUser?.email);
  const userStoreName = getUserStoreName(currentUser?.email);
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [changingPasswordUser, setChangingPasswordUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Cashier',
    status: 'Active',
    password: ''
  });
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    // Subscribe to users for this store only
    const unsubscribe = subscribeToUsers(
      (usersData) => {
        // Filter users for this store only
        const storeUsers = usersData.filter(user => 
          user.storeId === userStoreId || 
          (user.email && user.email.includes('@mystore.com')) // Legacy users
        );
        setUsers(storeUsers);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading store users:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userStoreId]);

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'Cashier',
      status: 'Active',
      password: ''
    });
    setShowPassword(false);
  };

  const resetPasswordForm = () => {
    setPasswordData({
      newPassword: '',
      confirmPassword: ''
    });
    setShowNewPassword(false);
  };

  const handleChangePassword = (user) => {
    setChangingPasswordUser(user);
    resetPasswordForm();
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      alert('Please fill in both password fields');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    try {
      await updateUser(changingPasswordUser.id, { 
        password: passwordData.newPassword,
        passwordChangedAt: new Date().toISOString(),
        passwordChangedBy: currentUser.email
      });
      alert(`Password changed successfully for ${changingPasswordUser.name}`);
      setShowPasswordModal(false);
      setChangingPasswordUser(null);
      resetPasswordForm();
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Error changing password. Please try again.');
    }
  };

  const handleAddUser = () => {
    resetForm();
    setEditingUser(null);
    setShowAddModal(true);
  };

  const handleEditUser = (user) => {
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || 'Cashier',
      status: user.status || 'Active',
      password: ''
    });
    setEditingUser(user.id);
    setShowAddModal(true);
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    try {
      await updateUser(userId, { status: newStatus });
      alert(`User ${newStatus === 'Active' ? 'enabled' : 'disabled'} successfully!`);
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Error updating user status. Please try again.');
    }
  };

  const handleDeleteUser = async (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) {
      alert('User not found!');
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${user.name || 'this user'}? This action cannot be undone.`)) {
      try {
        await deleteUser(userId);
        alert('User deleted successfully!');
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error deleting user. Please try again.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.email || !formData.phone || (!editingUser && !formData.password)) {
      alert('Please fill in all required fields');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert('Please enter a valid email address');
      return;
    }

    // Phone validation
    const phoneRegex = /^\+?[\d\s-()]+$/;
    if (!phoneRegex.test(formData.phone)) {
      alert('Please enter a valid phone number');
      return;
    }

    // Password validation for new users
    if (!editingUser && formData.password.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    // Check for duplicate email
    const existingUser = users.find(user => 
      user.email && user.email.toLowerCase() === formData.email.toLowerCase() && 
      user.id !== editingUser
    );
    if (existingUser) {
      alert('A user with this email already exists');
      return;
    }

    try {
      const userData = {
        ...formData,
        storeId: userStoreId,
        storeName: userStoreName
      };

      if (editingUser) {
        // Update existing user
        if (!formData.password) {
          delete userData.password; // Don't update password if empty
        }
        await updateUser(editingUser, userData);
        alert('User updated successfully!');
      } else {
        // Add new user
        await addUser(userData);
        alert('User added successfully!');
      }

      setShowAddModal(false);
      resetForm();
      setEditingUser(null);
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Error saving user. Please try again.');
    }
  };

  const handleCancel = () => {
    setShowAddModal(false);
    resetForm();
    setEditingUser(null);
  };

  const handlePasswordCancel = () => {
    setShowPasswordModal(false);
    setChangingPasswordUser(null);
    resetPasswordForm();
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordInputChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'Administrator': return 'admin';
      case 'Manager': return 'manager';
      case 'Cashier': return 'cashier';
      default: return 'user';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === 'Never' || dateString === 'Unknown') return 'Never';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  if (loading) {
    return (
      <div className="users-view">
        <div className="loading-state">
          <Users size={48} />
          <p>Loading store users...</p>
        </div>
      </div>
    );
  }

  // Calculate user statistics
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
  const activeCashiers = cashiers.filter(user => {
    const status = user.status ? user.status.toLowerCase() : 'active';
    return status === 'active';
  });
  const inactiveCashiers = cashiers.filter(user => {
    const status = user.status ? user.status.toLowerCase() : 'active';
    return status === 'inactive';
  });

  // Debug logging
  console.log('👥 Store Users View - Users:', users);
  console.log('💰 Filtered cashiers:', cashiers);
  console.log('📊 User statistics:', {
    total: users.length,
    cashiers: cashiers.length,
    active: activeCashiers.length,
    inactive: inactiveCashiers.length
  });

  return (
    <div className="users-view">
      <div className="view-header">
        <div>
          <h1>Store Users Management</h1>
          <p>Managing users for {userStoreName}</p>
          <div className="user-stats">
            <span className="stat-item">
              <Users size={16} />
              Total: {users.length}
            </span>
            <span className="stat-item">
              <Shield size={16} />
              Cashiers: {cashiers.length}
            </span>
            <span className="stat-item active">
              Active: {activeCashiers.length}
            </span>
            <span className="stat-item inactive">
              Inactive: {inactiveCashiers.length}
            </span>
          </div>
        </div>
        <button className="btn-primary" onClick={handleAddUser}>
          <Plus size={20} />
          Add New Cashier
        </button>
      </div>

      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Contact</th>
              <th>Role</th>
              <th>Status</th>
              <th>Join Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users && users.length > 0 ? users.map((user) => (
              <tr key={user.id || Math.random()}>
                <td>
                  <div className="user-info">
                    <div className="user-avatar">
                      {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div>
                      <div className="user-name">{user.name || 'Unknown User'}</div>
                      <div className="user-email">{user.email || 'No email'}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="contact-info">
                    <div className="contact-item">
                      <Mail size={14} />
                      <span>{user.email || 'No email'}</span>
                    </div>
                    <div className="contact-item">
                      <Phone size={14} />
                      <span>{user.phone || 'No phone'}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`role-badge ${getRoleColor(user.role || 'user')}`}>
                    {user.role || 'User'}
                  </span>
                </td>
                <td>
                  <div className="status-controls">
                    <span className={`status-badge ${(user.status || 'active').toLowerCase()}`}>
                      {user.status || 'Active'}
                    </span>
                    <button
                      className="status-toggle"
                      onClick={() => handleToggleUserStatus(user.id, user.status || 'Active')}
                      title={`${user.status === 'Active' ? 'Disable' : 'Enable'} user`}
                    >
                      {user.status === 'Active' ? 
                        <ToggleRight size={20} className="toggle-on" /> : 
                        <ToggleLeft size={20} className="toggle-off" />
                      }
                    </button>
                  </div>
                </td>
                <td>
                  <div className="date-info">
                    <Calendar size={14} />
                    <span>{formatDate(user.joinDate || user.createdAt || 'Unknown')}</span>
                  </div>
                </td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="btn-icon"
                      onClick={() => handleEditUser(user)}
                      title="Edit User"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      className="btn-icon password"
                      onClick={() => handleChangePassword(user)}
                      title="Change Password"
                    >
                      <Key size={16} />
                    </button>
                    <button 
                      className="btn-icon danger"
                      onClick={() => handleDeleteUser(user.id)}
                      title="Delete User"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="6" className="no-data">
                  <div className="empty-state">
                    <Users size={48} />
                    <p>No users found for {userStoreName}</p>
                    <button className="btn-primary" onClick={handleAddUser}>
                      <Plus size={16} />
                      Add First Cashier
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit User Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingUser ? 'Edit User' : 'Add New User'} - {userStoreName}</h2>
              <button className="btn-close" onClick={handleCancel}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="user-form">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="name">Full Name *</label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="user@mystore.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone Number *</label>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+91 9876543210"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="role">Role *</label>
                  <select
                    id="role"
                    value={formData.role}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    required
                  >
                    <option value="Cashier">Cashier</option>
                    <option value="Manager">Manager</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password {!editingUser && '*'}</label>
                  <div className="password-input">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder={editingUser ? "Leave blank to keep current" : "Enter password (min 6 characters)"}
                      required={!editingUser}
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <small className="form-hint">
                    {editingUser ? 'Leave blank to keep current password' : 'Minimum 6 characters required'}
                  </small>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={handleCancel}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <Save size={16} />
                  {editingUser ? 'Update User' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && changingPasswordUser && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Change Password - {changingPasswordUser.name}</h2>
              <button className="btn-close" onClick={handlePasswordCancel}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="password-form">
              <div className="form-group">
                <label htmlFor="newPassword">New Password *</label>
                <div className="password-input">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    id="newPassword"
                    value={passwordData.newPassword}
                    onChange={(e) => handlePasswordInputChange('newPassword', e.target.value)}
                    placeholder="Enter new password (min 6 characters)"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password *</label>
                <div className="password-input">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={(e) => handlePasswordInputChange('confirmPassword', e.target.value)}
                    placeholder="Confirm new password"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div className="password-info">
                <div className="info-item">
                  <strong>User:</strong> {changingPasswordUser.name}
                </div>
                <div className="info-item">
                  <strong>Email:</strong> {changingPasswordUser.email}
                </div>
                <div className="info-item">
                  <strong>Role:</strong> {changingPasswordUser.role}
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={handlePasswordCancel}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <Key size={16} />
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreUsersView;