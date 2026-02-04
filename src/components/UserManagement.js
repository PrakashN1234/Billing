import { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2,
  X, 
  Save, 
  UserCheck,
  UserX,
  Store,
  Mail,
  Phone
} from 'lucide-react';
import { 
  getAllUsersFromDB, 
  addUserToDB, 
  updateUserInDB, 
  subscribeToUsers,
  USER_ROLES,
  getRoleDisplayName 
} from '../utils/dynamicRoleManager';
import { getStores, deleteUser } from '../services/firebaseService';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: USER_ROLES.CASHIER,
    storeId: '',
    storeName: '',
    isActive: true
  });

  useEffect(() => {
    loadStores();
    loadUsers();
    
    // Subscribe to real-time user updates
    const unsubscribe = subscribeToUsers((usersData) => {
      setUsers(usersData);
    });

    return () => unsubscribe();
  }, []);

  const loadStores = async () => {
    try {
      const storesData = await getStores();
      setStores(storesData);
    } catch (error) {
      console.error('Error loading stores:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const usersData = await getAllUsersFromDB();
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: USER_ROLES.CASHIER,
      storeId: '',
      storeName: '',
      isActive: true
    });
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
      role: user.role || USER_ROLES.CASHIER,
      storeId: user.storeId || '',
      storeName: user.storeName || '',
      isActive: user.isActive !== false
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

    // Prevent deleting super admins
    if (user.role === USER_ROLES.SUPER_ADMIN) {
      alert('Cannot delete Super Administrator accounts!');
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${user.name || user.email}? This action cannot be undone.`)) {
      try {
        await deleteUser(userId);
        alert('User deleted successfully!');
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error deleting user. Please try again.');
      }
    }
  };

  const handleStoreChange = (storeId) => {
    const selectedStore = stores.find(store => store.id === storeId);
    setFormData(prev => ({
      ...prev,
      storeId: storeId,
      storeName: selectedStore ? selectedStore.name : ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.email) {
      alert('Please fill in all required fields');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert('Please enter a valid email address');
      return;
    }

    // Store validation for non-super admin roles
    if (formData.role !== USER_ROLES.SUPER_ADMIN && !formData.storeId) {
      alert('Please select a store for this user');
      return;
    }

    try {
      const userData = {
        ...formData,
        email: formData.email.toLowerCase()
      };

      // If super admin, clear store data
      if (formData.role === USER_ROLES.SUPER_ADMIN) {
        userData.storeId = null;
        userData.storeName = 'Company Admin';
      }

      if (editingUser) {
        // Update existing user
        await updateUserInDB(editingUser, userData);
        alert('User updated successfully!');
      } else {
        // Add new user
        await addUserToDB(userData);
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

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      await updateUserInDB(userId, { isActive: !currentStatus });
      alert(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Error updating user status. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="user-management">
        <div className="loading-state">
          <Users size={48} />
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-management">
      <div className="view-header">
        <h1>User Management</h1>
        <button className="btn-primary" onClick={handleAddUser}>
          <Plus size={20} />
          Add New User
        </button>
      </div>

      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>User Info</th>
              <th>Contact</th>
              <th>Role</th>
              <th>Store</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="user-info">
                    <div className="user-avatar">
                      {(user.name || user.email).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="user-name">{user.name || user.email.split('@')[0]}</div>
                      <div className="user-email">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="contact-info">
                    {user.phone && (
                      <div className="contact-item">
                        <Phone size={14} />
                        <span>{user.phone}</span>
                      </div>
                    )}
                    <div className="contact-item">
                      <Mail size={14} />
                      <span>{user.email}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`role-badge ${user.role}`}>
                    {getRoleDisplayName(user.role)}
                  </span>
                </td>
                <td>
                  <div className="store-info">
                    {user.storeId ? (
                      <>
                        <Store size={14} />
                        <span>{user.storeName}</span>
                      </>
                    ) : (
                      <span className="no-store">All Stores</span>
                    )}
                  </div>
                </td>
                <td>
                  <button
                    className={`status-toggle ${user.isActive !== false ? 'active' : 'inactive'}`}
                    onClick={() => toggleUserStatus(user.id, user.isActive !== false)}
                  >
                    {user.isActive !== false ? (
                      <>
                        <UserCheck size={14} />
                        Active
                      </>
                    ) : (
                      <>
                        <UserX size={14} />
                        Inactive
                      </>
                    )}
                  </button>
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
            ))}
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
                    placeholder="user@example.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+91 9876543210"
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
                    <option value={USER_ROLES.CASHIER}>Cashier</option>
                    <option value={USER_ROLES.ADMIN}>Administrator</option>
                    <option value={USER_ROLES.SUPER_ADMIN}>Super Administrator</option>
                  </select>
                </div>

                {formData.role !== USER_ROLES.SUPER_ADMIN && (
                  <div className="form-group full-width">
                    <label htmlFor="store">Store Assignment *</label>
                    <select
                      id="store"
                      value={formData.storeId}
                      onChange={(e) => handleStoreChange(e.target.value)}
                      required
                    >
                      <option value="">Select a store</option>
                      {stores.map(store => (
                        <option key={store.id} value={store.id}>
                          {store.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    value={formData.isActive}
                    onChange={(e) => handleInputChange('isActive', e.target.value === 'true')}
                  >
                    <option value={true}>Active</option>
                    <option value={false}>Inactive</option>
                  </select>
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

export default UserManagement;