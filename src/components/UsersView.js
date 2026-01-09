import { useState } from 'react';
import { Users, Plus, Edit, Trash2, Mail, Phone, Calendar } from 'lucide-react';

const UsersView = () => {
  const [users] = useState([
    {
      id: 1,
      name: 'Admin User',
      email: 'admin@mystore.com',
      phone: '+91 9876543210',
      role: 'Administrator',
      status: 'Active',
      joinDate: '2024-01-15',
      lastLogin: '2024-01-09'
    },
    {
      id: 2,
      name: 'Demo User',
      email: 'demo@mystore.com',
      phone: '+91 9876543211',
      role: 'Cashier',
      status: 'Active',
      joinDate: '2024-01-20',
      lastLogin: '2024-01-08'
    }
  ]);

  const getRoleColor = (role) => {
    switch (role) {
      case 'Administrator': return 'admin';
      case 'Manager': return 'manager';
      case 'Cashier': return 'cashier';
      default: return 'user';
    }
  };

  return (
    <div className="users-view">
      <div className="view-header">
        <h1>Users Management</h1>
        <button className="btn-primary">
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
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="user-info">
                    <div className="user-avatar">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <div className="user-name">{user.name}</div>
                      <div className="user-email">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="contact-info">
                    <div className="contact-item">
                      <Mail size={14} />
                      <span>{user.email}</span>
                    </div>
                    <div className="contact-item">
                      <Phone size={14} />
                      <span>{user.phone}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`role-badge ${getRoleColor(user.role)}`}>
                    {user.role}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${user.status.toLowerCase()}`}>
                    {user.status}
                  </span>
                </td>
                <td>
                  <div className="date-info">
                    <Calendar size={14} />
                    <span>{new Date(user.joinDate).toLocaleDateString()}</span>
                  </div>
                </td>
                <td>
                  <span className="last-login">
                    {new Date(user.lastLogin).toLocaleDateString()}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-icon">
                      <Edit size={16} />
                    </button>
                    <button className="btn-icon danger">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersView;