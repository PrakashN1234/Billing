import { useState } from 'react';
import { Store, MapPin, Phone, Mail, Edit, Trash2, Plus } from 'lucide-react';

const StoresView = () => {
  const [stores] = useState([
    {
      id: 1,
      name: 'Praba Store Main Branch',
      address: '123 Main Street, City Center',
      phone: '+91 9876543210',
      email: 'main@prabastore.com',
      status: 'Active',
      manager: 'John Doe'
    }
  ]);

  return (
    <div className="stores-view">
      <div className="view-header">
        <h1>Stores Management</h1>
        <button className="btn-primary">
          <Plus size={20} />
          Add New Store
        </button>
      </div>

      <div className="stores-grid">
        {stores.map((store) => (
          <div key={store.id} className="store-card">
            <div className="store-header">
              <div className="store-icon">
                <Store size={24} />
              </div>
              <div className="store-actions">
                <button className="btn-icon">
                  <Edit size={16} />
                </button>
                <button className="btn-icon danger">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <div className="store-content">
              <h3>{store.name}</h3>
              <div className="store-details">
                <div className="detail-item">
                  <MapPin size={16} />
                  <span>{store.address}</span>
                </div>
                <div className="detail-item">
                  <Phone size={16} />
                  <span>{store.phone}</span>
                </div>
                <div className="detail-item">
                  <Mail size={16} />
                  <span>{store.email}</span>
                </div>
              </div>
              
              <div className="store-footer">
                <span className={`status ${store.status.toLowerCase()}`}>
                  {store.status}
                </span>
                <span className="manager">Manager: {store.manager}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StoresView;