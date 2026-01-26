# Role-Based Access Control System

## Overview
The billing system now includes a comprehensive role-based access control system with three user levels: Super Admin, Admin, and Cashier. Each role has specific permissions and access to different features.

## User Roles

### 1. Super Administrator
- **Email**: `nprakash315349@gmail.com`, `draupathiitsolutions@gmail.com`, `ututhay@gmail.com`
- **Full System Access**: Complete control over all features
- **Permissions**: All system functions including user management, system settings, and data deletion

### 2. Administrator  
- **Email**: `admin@mystore.com`, `manager@mystore.com`
- **Store Management**: Can manage stores, inventory, reports, and barcodes
- **Permissions**: Everything except user management and system-level settings

### 3. Cashier
- **Email**: `cashier@mystore.com`, `cashier1@mystore.com`, `cashier2@mystore.com`
- **Billing Focus**: Primarily for billing operations and basic inventory viewing
- **Permissions**: Billing, inventory viewing only

## Features by Role

### Super Admin Dashboard
- User management and role assignment
- System-wide statistics and analytics
- Advanced system tools and diagnostics
- Complete access to all features
- System configuration and settings

### Admin Dashboard  
- Store and inventory management
- Sales reports and analytics
- Barcode and product code generation
- Staff oversight (except user creation)
- Business operations focus

### Cashier Dashboard
- Streamlined billing interface
- Today's sales statistics
- Inventory viewing (read-only)
- Stock alerts and notifications
- Customer service focus

## Authorization System

### Email-Based Authentication
- Only pre-authorized email addresses can access the system
- Unauthorized users see a clear access denied message
- Contact information provided for access requests

### Dynamic Navigation
- Sidebar shows only accessible features for each role
- Automatic redirection if unauthorized access attempted
- Role indicator in sidebar and dashboard headers

## Security Features

### Access Control
- Route-level permission checking
- View-specific authorization
- Automatic logout for unauthorized access
- Clear error messages and guidance

### User Experience
- Role-specific welcome messages
- Customized dashboard layouts
- Relevant quick actions per role
- Appropriate feature visibility

## Adding New Users

To add a new user, update the `AUTHORIZED_USERS` object in `src/utils/roleManager.js`:

```javascript
export const AUTHORIZED_USERS = {
  'newuser@mystore.com': USER_ROLES.CASHIER,
  // Add more users as needed
};
```

## Customizing Permissions

Modify the `ROLE_PERMISSIONS` object to adjust what each role can access:

```javascript
export const ROLE_PERMISSIONS = {
  [USER_ROLES.CASHIER]: [
    'view_dashboard',
    'manage_billing',
    'view_inventory'
    // Add or remove permissions
  ]
};
```

The system provides secure, role-appropriate access while maintaining ease of use for each user type.