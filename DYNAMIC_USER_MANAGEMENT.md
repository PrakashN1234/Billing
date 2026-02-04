# Dynamic User Management System

## Overview
The system now supports dynamic user management through Firebase database instead of hardcoded users in the code. This allows adding, editing, and managing users without code changes.

## Key Features

### ✅ **Database-Driven User Management**
- Users are stored in Firebase `authorized_users` collection
- No need to modify code to add new users
- Real-time updates when users are added/modified
- Automatic caching for better performance

### ✅ **User Management Interface**
- Super admins can add/edit users through the UI
- Form validation for email, phone, and required fields
- Store assignment for admins and cashiers
- User status management (active/inactive)

### ✅ **Role-Based Access Control**
- **Super Admin**: Full system access, can manage all users and stores
- **Admin**: Store-specific access, can manage their store's inventory and users
- **Cashier**: Limited access, can only process transactions and view inventory

## How to Add New Users

### Method 1: Through Super Admin Dashboard (Recommended)
1. Login as Super Admin (nprakash315349@gmail.com, draupathiitsolutions@gmail.com, or ututhay@gmail.com)
2. Go to "Users" section from the sidebar
3. Click "Add New User" button
4. Fill in the form:
   - **Full Name**: User's display name
   - **Email Address**: Login email (must be unique)
   - **Phone Number**: Contact number (optional)
   - **Role**: Select from Cashier, Administrator, or Super Administrator
   - **Store Assignment**: Required for non-super admin roles
   - **Status**: Active or Inactive
5. Click "Add User"

### Method 2: Direct Firebase Database Entry
If you need to add users directly to Firebase:

```javascript
// Add to 'authorized_users' collection
{
  name: "John Doe",
  email: "john@example.com",
  phone: "+91 9876543210",
  role: "admin", // or "cashier", "super_admin"
  storeId: "store_001", // null for super_admin
  storeName: "ABC", // "Company Admin" for super_admin
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
}
```

## User Roles and Permissions

### Super Administrator
- **Emails**: nprakash315349@gmail.com, draupathiitsolutions@gmail.com, ututhay@gmail.com
- **Access**: All stores and system-wide settings
- **Permissions**: 
  - Manage users across all stores
  - Manage stores
  - System settings
  - View all data

### Administrator
- **Store-Specific**: Each admin is assigned to one store
- **Access**: Only their assigned store's data
- **Permissions**:
  - Manage inventory for their store
  - View reports for their store
  - Manage barcodes and product codes
  - Manage store users (cashiers)
  - Export data

### Cashier
- **Store-Specific**: Each cashier is assigned to one store
- **Access**: Limited to billing and inventory viewing
- **Permissions**:
  - Process transactions (billing)
  - View inventory (read-only)
  - View dashboard

## Current Store Configuration

### Store 1: ABC (store_001)
- **Default Admin**: admin@mystore.com
- **Default Cashier**: cashier@mystore.com

### Store 2: XYZ Store (store_002)
- **Admin Emails**: admin@branch1.com, manager@branch1.com
- **Cashier Emails**: cashier@xyzstore.com, cashier1@xyzstore.com

### Store 3: PQR Store (store_003)
- **Admin Emails**: admin@branch2.com, manager@branch2.com
- **Cashier Emails**: cashier@pqrstore.com, cashier1@pqrstore.com

## Adding New Stores and Users

### Step 1: Add Store (Super Admin Only)
1. Go to "Stores" section
2. Click "Add New Store"
3. Fill in store details (name, address, phone, email, manager)
4. Save the store

### Step 2: Add Store Admin
1. Go to "Users" section
2. Click "Add New User"
3. Set role as "Administrator"
4. Select the newly created store
5. Provide admin email and details

### Step 3: Add Store Cashiers
1. Repeat the user creation process
2. Set role as "Cashier"
3. Select the same store
4. Add multiple cashiers as needed

## Security Features

### ✅ **Email Validation**
- Proper email format validation
- Duplicate email prevention
- Case-insensitive email handling

### ✅ **Role-Based Security**
- Users can only access their authorized views
- Store data isolation (admins/cashiers see only their store)
- Permission-based feature access

### ✅ **User Status Management**
- Active/Inactive status control
- Inactive users cannot access the system
- Real-time status updates

## Technical Implementation

### Database Structure
```
authorized_users/
├── {userId}/
│   ├── name: "John Doe"
│   ├── email: "john@example.com"
│   ├── phone: "+91 9876543210"
│   ├── role: "admin"
│   ├── storeId: "store_001"
│   ├── storeName: "ABC"
│   ├── isActive: true
│   ├── createdAt: timestamp
│   └── updatedAt: timestamp
```

### Caching System
- User data is cached for 5 minutes to improve performance
- Cache is automatically cleared when users are modified
- Fallback to database if cache expires

### Backward Compatibility
- Hardcoded super admin emails still work
- Existing role manager functions are preserved
- Gradual migration to dynamic system

## Benefits

1. **No Code Changes**: Add users without modifying and redeploying code
2. **Real-Time Updates**: Changes reflect immediately across the system
3. **Scalable**: Easily add hundreds of users and stores
4. **Secure**: Proper validation and role-based access control
5. **User-Friendly**: Intuitive interface for user management
6. **Audit Trail**: Track when users were created and modified

## Migration Guide

### For Existing Systems
1. The system automatically initializes default users in the database
2. Existing hardcoded users continue to work
3. New users should be added through the UI or database
4. Gradually migrate all users to the database system

### For New Deployments
1. System automatically creates default ABC store admin and cashier
2. Super admins can immediately start adding users through the UI
3. No manual code configuration required

This dynamic system makes the application truly multi-tenant and scalable without requiring technical knowledge to add new users or stores.