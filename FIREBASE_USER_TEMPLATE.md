# Complete Firebase User Document Template

## Required Fields for praba182589@gmail.com

Please add these **exact** fields to your Firebase document in the `authorized_users` collection:

### **Field Name: Field Type: Value**

```
email: string: praba182589@gmail.com
name: string: Praba
role: string: super_admin
isActive: boolean: true
storeId: null: null
storeName: string: Company Admin
phone: string: +91 9876543210
createdAt: timestamp: (current date/time)
updatedAt: timestamp: (current date/time)
```

## **Step-by-Step Firebase Console Instructions:**

1. **Go to your Firebase document** for praba182589@gmail.com
2. **Add missing fields** by clicking "Add field"
3. **Add each field with exact names and types:**

### **Add storeId field:**
- Field name: `storeId`
- Field type: `null`
- Value: (leave empty - it's null)

### **Add storeName field:**
- Field name: `storeName`
- Field type: `string`
- Value: `Company Admin`

### **Add phone field:**
- Field name: `phone`
- Field type: `string`
- Value: `+91 9876543210`

### **Add createdAt field:**
- Field name: `createdAt`
- Field type: `timestamp`
- Value: (current date/time)

### **Add updatedAt field:**
- Field name: `updatedAt`
- Field type: `timestamp`
- Value: (current date/time)

## **Final Document Should Look Like:**

```json
{
  "email": "praba182589@gmail.com",
  "name": "Praba", 
  "role": "super_admin",
  "isActive": true,
  "storeId": null,
  "storeName": "Company Admin",
  "phone": "+91 9876543210",
  "createdAt": "2024-02-02T10:00:00.000Z",
  "updatedAt": "2024-02-02T10:00:00.000Z"
}
```

## **Testing After Adding Fields:**

1. **Open browser console** on your website
2. **Run this command:**
```javascript
// Import and run debug function
import('./src/utils/debugAuth.js').then(module => {
  module.debugFirebaseAuth('praba182589@gmail.com');
});
```

3. **Check the console output** to see if the user is found
4. **Try logging in** with praba182589@gmail.com

## **Common Issues:**

- **Missing storeId field**: Must be `null` (not string "null")
- **Wrong role value**: Must be exactly `super_admin` (not "Super Admin")
- **Case sensitivity**: Email should be lowercase in database
- **Field types**: Make sure boolean fields are boolean, not strings