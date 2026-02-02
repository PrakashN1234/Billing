import { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, Mail, Phone, Calendar, X, Save, Eye, EyeOff, ToggleLeft, ToggleRight } from 'lucide-react';
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
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Cashier',
    status: 'Active',
    password: ''
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

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
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

  return (
    <div className="users-view">
      <div className="view-header">
        <div>
          <h1>Store Users Management</h1>
          <p>Managing users for {userStoreName}</p>
        </div>
        <button className="btn-primary" onClick={handleAddUser}>
          <Plus size={20} />
          Add New User
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
                      Add First User
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
    </div>
  );
};

export default StoreUsersView;