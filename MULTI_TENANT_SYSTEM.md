# Multi-Tenant Store Management System - Updated Access Structure

## Overview
The billing system implements a strict role-based access control system with clear separation of responsibilities:

## User Hierarchy & Access Rights

### 1. Super Admin (Company Level)
- **Emails**: `nprakash315349@gmail.com`, `draupathiitsolutions@gmail.com`, `ututhay@gmail.com`
- **Primary Focus**: User and Store Management
- **Access**:
  - ✅ Create and manage stores
  - ✅ Create and manage users
  - ✅ System administration
  - ❌ **NO ACCESS** to sales history
  - ❌ **NO ACCESS** to billing operations
  - ❌ **NO ACCESS** to inventory management

### 2. Admin/Store Manager (Store Level)
- **Example**: `admin@store1.com` (assigned to Store 001)
- **Primary Focus**: Store Operations and Sales Management
- **Access**:
  - ✅ View sales history for their store
  - ✅ Manage inventory for their store
  - ✅ View and manage low stock items
  - ✅ Generate reports and analytics
  - ✅ Manage barcodes and product codes
  - ✅ View activity logs
  - ❌ **NO ACCESS** to user management
  - ❌ **NO ACCESS** to store creation
  - ❌ **NO ACCESS** to billing operations

### 3. Cashier (Store Level)
- **Example**: `cashier@store1.com` (assigned to Store 001)
- **Primary Focus**: Customer Service and Billing
- **Access**:
  - ✅ Process billing and transactions
  - ✅ View inventory (read-only)
  - ✅ View low stock items
  - ❌ **NO ACCESS** to sales history/reports
  - ❌ **NO ACCESS** to inventory management
  - ❌ **NO ACCESS** to user/store management

## Dashboard Differences

### Super Admin Dashboard
**Focus**: System Administration
- **Stats**: Total stores, total users, active stores, active users
- **Quick Actions**: Add Store, Add User, Manage Stores, Manage Users
- **Features**: 
  - Store network overview
  - User base management
  - System settings
  - No sales or inventory data

### Admin Dashboard
**Focus**: Store Operations
- **Stats**: Total products, total sales, total bills, low stock items, products with codes
- **Quick Actions**: Add Product, Sales Reports, Manage Barcodes, View Activity, Low Stock
- **Features**:
  - Sales history and analytics
  - Inventory management
  - Low stock alerts
  - Barcode/product code generation
  - Activity monitoring

### Cashier Dashboard
**Focus**: Customer Service
- **Stats**: Today's sales, today's bills, average bill, available products
- **Quick Actions**: New Bill, View Inventory, Low Stock Items
- **Features**:
  - Today's performance metrics
  - Billing interface access
  - Inventory viewing (read-only)
  - Low stock awareness
  - Shift information

## Updated Permissions Structure

```javascript
export const ROLE_PERMISSIONS = {
  [USER_ROLES.SUPER_ADMIN]: [
    'view_dashboard',
    'manage_users',      // Only Super Admin
    'manage_stores',     // Only Super Admin
    'system_settings'
  ],
  [USER_ROLES.ADMIN]: [
    'view_dashboard',
    'manage_inventory',  // Admin only
    'view_reports',      // Admin only
    'manage_barcodes',   // Admin only
    'view_activity',     // Admin only
    'export_data'        // Admin only
  ],
  [USER_ROLES.CASHIER]: [
    'view_dashboard',
    'manage_billing',    // Cashier only
    'view_inventory'     // Read-only for Cashier
  ]
};
```

## Navigation Structure

### Super Admin Navigation
- Dashboard
- Stores (management)
- Users (management)

### Admin Navigation  
- Dashboard
- Inventory (management)
- Reports
- Barcodes
- Activity
- Low Stock

### Cashier Navigation
- Dashboard
- Billing
- Inventory (view only)
- Low Stock (view only)

## Key Benefits

### 1. Clear Separation of Concerns
- **Super Admin**: Focuses on business expansion and user management
- **Admin**: Focuses on store operations and performance
- **Cashier**: Focuses on customer service and transactions

### 2. Data Security
- Super Admins cannot access sensitive sales data
- Admins cannot create users or stores
- Cashiers cannot access historical sales data

### 3. Role-Appropriate Interfaces
- Each role sees only relevant information
- Simplified interfaces reduce confusion
- Better user experience for each role type

### 4. Scalable Architecture
- Easy to add new stores and users
- Clear hierarchy and responsibilities
- Flexible permission system

This structure ensures that each user type has access only to the features they need for their specific role, improving security and user experience.

## Data Isolation

### Store-Based Filtering
All data is filtered based on user's store assignment:

```javascript
// Super Admin - sees all data
const salesData = await getSalesByStore(null, 50); // null = all stores

// Store Admin/Cashier - sees only their store's data
const salesData = await getSalesByStore(userStoreId, 50);
```

### Database Structure
Each document includes a `storeId` field for proper data isolation:

```javascript
// Inventory Item
{
  id: "product_123",
  name: "Rice 1kg",
  price: 50,
  stock: 100,
  storeId: "store_001", // Associates with specific store
  createdAt: timestamp,
  updatedAt: timestamp
}

// Sales Record
{
  id: "sale_456",
  items: [...],
  total: 500,
  storeId: "store_001", // Associates with specific store
  timestamp: timestamp
}
```

## User Management

### Authorization Structure
```javascript
export const AUTHORIZED_USERS = {
  // Super Admin (Company Level)
  'nprakash315349@gmail.com': { 
    role: 'super_admin', 
    storeId: null, // null = access to all stores
    storeName: 'Company Admin'
  },
  
  // Store Admin (Store Level)
  'admin@store1.com': { 
    role: 'admin', 
    storeId: 'store_001', 
    storeName: 'Main Store'
  },
  
  // Cashier (Store Level)
  'cashier@store1.com': { 
    role: 'cashier', 
    storeId: 'store_001', 
    storeName: 'Main Store'
  }
};
```

### Adding New Users
Only Super Admins can add new users through the system:

1. Navigate to Users section (only visible to Super Admin)
2. Click "Add User"
3. Assign role and store
4. User gets access only to their assigned store's data

### Adding New Stores
Only Super Admins can create new stores:

1. Navigate to Stores section (only visible to Super Admin)
2. Click "Add Store"
3. Configure store details
4. Assign users to the new store

## Security Features

### Access Control
- **Route-level protection**: Users can only access views they have permissions for
- **Data-level filtering**: All queries are filtered by store access
- **UI restrictions**: Navigation items are filtered based on role and permissions

### Store Isolation
- Store Admins cannot see other stores' data
- Sales reports are filtered by store
- Inventory is filtered by store
- User management is restricted to Super Admins

## Dashboard Differences

### Super Admin Dashboard
- **Global metrics**: Total stores, users, sales across all stores
- **System management**: User creation, store creation, system tools
- **All-store access**: Can view and manage data from any store

### Store Admin Dashboard
- **Store-specific metrics**: Only their store's products, sales, inventory
- **Store management**: Inventory, barcodes, reports for their store only
- **No user management**: Cannot create users or access other stores

### Cashier Dashboard
- **Billing focus**: Streamlined interface for customer service
- **Store-specific data**: Only their store's inventory and today's sales
- **Limited access**: Cannot manage inventory or view detailed reports

## Implementation Benefits

### 1. Data Security
- Complete isolation between stores
- No accidental data leakage
- Role-based access control

### 2. Scalability
- Easy to add new stores
- Simple user management
- Flexible permission system

### 3. User Experience
- Clean, focused interfaces
- Relevant data only
- Store-specific branding and messaging

### 4. Business Logic
- Company can manage multiple stores
- Store managers focus on their store only
- Clear hierarchy and responsibilities

## Technical Implementation

### Key Functions
- `getUserStoreId(email)`: Get user's assigned store
- `canAccessStore(email, storeId)`: Check store access permissions
- `filterDataByStoreAccess(email, data)`: Filter data by store access
- `subscribeToInventoryByStore(storeId)`: Real-time store-specific data

### Database Queries
All queries include store filtering:
```javascript
// Firestore query with store filter
query(collection(db, 'inventory'), where('storeId', '==', userStoreId))
```

This multi-tenant system ensures proper data isolation while maintaining a seamless user experience for each role level.