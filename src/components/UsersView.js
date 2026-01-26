import { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, Mail, Phone, Calendar, X, Save, Eye, EyeOff } from 'lucide-react';
import { 
  subscribeToUsers, 
  addUser, 
  updateUser, 
  deleteUser, 
  initializeUsers 
} from '../services/firebaseService';

const UsersView = () => {
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
    // Initialize default users if none exist
    initializeUsers();

    // Subscribe to real-time updates
    const unsubscribe = subscribeToUsers(
      (usersData) => {
        setUsers(usersData);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading users:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

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
      password: user.password || ''
    });
    setEditingUser(user.id);
    setShowAddModal(true);
  };

  const handleDeleteUser = async (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) {
      alert('User not found!');
      return;
    }
    
    if (user.role === 'Administrator' && users.filter(u => u.role === 'Administrator').length === 1) {
      alert('Cannot delete the last administrator user!');
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
    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
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

    // Password validation
    if (formData.password.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    // Check for duplicate email
    const existingUser = users.find(user => 
      user.email.toLowerCase() === formData.email.toLowerCase() && 
      user.id !== editingUser
    );
    if (existingUser) {
      alert('A user with this email already exists');
      return;
    }

    try {
      if (editingUser) {
        // Update existing user
        await updateUser(editingUser, formData);
        alert('User updated successfully!');
      } else {
        // Add new user
        await addUser(formData);
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
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="users-view">
      <div className="view-header">
        <h1>Users Management</h1>
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
              <th>Last Login</th>
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
                  <span className={`status-badge ${(user.status || 'active').toLowerCase()}`}>
                    {user.status || 'Active'}
                  </span>
                </td>
                <td>
                  <div className="date-info">
                    <Calendar size={14} />
                    <span>{formatDate(user.joinDate || 'Unknown')}</span>
                  </div>
                </td>
                <td>
                  <span className="last-login">
                    {formatDate(user.lastLogin || 'Never')}
                  </span>
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
                <td colSpan="7" className="no-data">
                  <div className="empty-state">
                    <Users size={48} />
                    <p>No users found</p>
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
              <h2>{editingUser ? 'Edit User' : 'Add New User'}</h2>
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
                    <option value="Administrator">Administrator</option>
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
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password *</label>
                  <div className="password-input">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="Enter password (min 6 characters)"
                      required
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

export default UsersView;