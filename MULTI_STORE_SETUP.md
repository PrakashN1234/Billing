# Multi-Store Setup Guide

## Overview
The system now supports three stores with dedicated admin and cashier accounts for each store. Each admin can only manage their assigned store, while super admins have access to all stores.

## Store Configuration

### Store 1: ABC
- **Store ID**: `store_001`
- **Store Name**: ABC
- **Admin Accounts**:
  - admin@mystore.com
  - manager@mystore.com
- **Cashier Accounts**:
  - cashier@mystore.com
  - cashier1@mystore.com

### Store 2: XYZ Store
- **Store ID**: `store_002`
- **Store Name**: XYZ Store
- **Admin Accounts**:
  - admin@branch1.com
  - manager@branch1.com
- **Cashier Accounts**:
  - cashier@xyzstore.com
  - cashier1@xyzstore.com

### Store 3: PQR Store
- **Store ID**: `store_003`
- **Store Name**: PQR Store
- **Admin Accounts**:
  - admin@branch2.com
  - manager@branch2.com
- **Cashier Accounts**:
  - cashier@pqrstore.com
  - cashier1@pqrstore.com

## Super Admin Accounts
Super admins have access to all stores and can manage the entire system:
- nprakash315349@gmail.com
- draupathiitsolutions@gmail.com
- ututhay@gmail.com

## Features

### Store Context Display
- **Admin Dashboard**: Shows a prominent store context header displaying which store the admin is managing
- **Cashier Dashboard**: Shows which store the cashier is working at
- **User Profile**: Displays store information in the user profile section

### Data Isolation
- Each admin can only see and manage data from their assigned store
- Inventory, sales, and reports are filtered by store
- Cashiers can only process transactions for their assigned store

### Visual Indicators
- Store information is prominently displayed at the top of admin and cashier dashboards
- Store ID and name are clearly visible
- Active status indicator shows the store is operational
- Color-coded headers distinguish between admin (purple gradient) and cashier (green gradient) interfaces

## Testing the Setup

To test the multi-store setup:

1. **Login as ABC Store Admin**: Use `admin@mystore.com` to see ABC store context
2. **Login as XYZ Store Admin**: Use `admin@branch1.com` to see XYZ Store context
3. **Login as PQR Store Admin**: Use `admin@branch2.com` to see PQR Store context
4. **Login as Super Admin**: Use any super admin email to see system-wide access

## Benefits

1. **Clear Store Context**: Admins always know which store they're managing
2. **Data Security**: Store data is isolated and secure
3. **Scalable Design**: Easy to add more stores by updating the role manager
4. **User-Friendly**: Prominent visual indicators prevent confusion
5. **Role-Based Access**: Proper permissions ensure users only access their authorized data

## Future Enhancements

- Store switching for super admins
- Store performance comparison dashboards
- Inter-store inventory transfers
- Centralized reporting across all stores