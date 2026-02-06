# Scanning Troubleshooting Guide

## Problem: "Product not found" when scanning barcodes or QR codes

### Root Cause
The products in your database likely don't have QR codes generated yet. When you scan a QR code or barcode, the system searches for a matching product, but if the `qrcode` or `barcode` field is empty in the database, it won't find anything.

### Solution Steps

#### Step 1: Check if Products Have QR Codes

1. **Login as Store Admin**
2. **Go to Admin Dashboard**
3. **Look at the statistics card** - it should show:
   - "WITH CODES" - how many products have product codes
   - Check if there's a warning about products needing QR codes

#### Step 2: Generate QR Codes for All Products

**Method 1: Using Admin Dashboard (Recommended)**

1. Login as **Store Admin**
2. Go to **Admin Dashboard**
3. Look for the alert box that says "X products need QR codes"
4. Click the **"Generate QR Codes"** button
5. Confirm the action
6. Wait for success message

**Method 2: Using Barcode Manager**

1. Login as **Store Admin**
2. Click **"Manage Barcodes"** from Quick Actions
3. You'll see statistics showing products with/without QR codes
4. Select products that need QR codes (or click "Select All Missing")
5. Click **"Generate Both"** button to generate both barcode and QR code
6. Wait for success message

**Method 3: Using Browser Console (Advanced)**

1. Open browser console (F12)
2. Run these commands:

```javascript
// Check current status
await checkProductQRCodes();

// Generate missing QR codes
await generateMissingQRCodes('001'); // Replace '001' with your store ID

// Test a specific scan
await testScanCode('ST001_GRAIN_000123'); // Replace with actual QR code
```

#### Step 3: Verify QR Codes Were Generated

1. Go to **Admin Dashboard**
2. Click **"Manage Barcodes"**
3. Check the statistics - "With QR Code" should equal "Total Products"
4. Look at individual products - you should see both barcode and QR code displayed

#### Step 4: Test Scanning

1. Login as **Cashier**
2. Go to **Billing**
3. Click the **Camera icon** to open scanner
4. Try scanning a QR code from the admin inventory display
5. Or manually type the QR code value (e.g., ST001_GRAIN_000123)

### Understanding QR Code Format

QR codes in this system use the format: `ST###_CATEGORY_######`

Example: `ST001_GRAIN_000123`
- `ST001` = Store ID (001)
- `GRAIN` = Product category (GRAIN, DAIRY, BAKERY, etc.)
- `000123` = Unique product sequence

### Common Issues and Fixes

#### Issue 1: QR Code Scans But Product Not Found

**Cause:** The QR code value doesn't match what's in the database

**Fix:**
1. Open browser console (F12)
2. When you scan, look for the log: `🔍 Searching for code: [value]`
3. Check if that value matches the product's `qrcode` field in database
4. If not, regenerate QR codes using Admin Dashboard

#### Issue 2: Camera Won't Start

**Cause:** Browser permissions or HTTPS requirement

**Fix:**
1. Make sure you're using HTTPS (required for camera access)
2. Grant camera permissions when prompted
3. Try a different browser (Chrome/Edge work best)
4. Use manual entry as fallback

#### Issue 3: Barcode Scans But Not QR Code

**Cause:** Traditional barcodes work differently than QR codes

**Fix:**
1. QR codes are recommended for mobile cameras
2. Traditional barcodes need dedicated barcode scanners
3. Generate QR codes for better mobile compatibility
4. Use manual entry if camera scanning fails

### Best Practices

1. **Always generate both barcode and QR code** for each product
2. **QR codes work better with mobile cameras** than traditional barcodes
3. **Test scanning after generating codes** to ensure they work
4. **Use manual entry as backup** if camera scanning fails
5. **Keep product codes simple** (e.g., RICE001, MILK001) for easy manual entry

### Admin Settings for Scanning

Store Admins can configure scanning preferences:

1. Go to **Store Settings**
2. Click **"Scanning Method"** tab
3. Configure:
   - Preferred scanning method (QR Code recommended)
   - Enable/disable QR code scanning
   - Enable/disable barcode scanning
   - Enable/disable manual entry

### Debug Mode

To see detailed scanning logs:

1. Open browser console (F12)
2. Go to Billing page
3. Try scanning - you'll see logs like:
   - `🔍 Searching for code: [value]`
   - `📦 Total inventory items: [count]`
   - `📋 Sample product structure: {...}`
   - `✅ Product added to cart` or `❌ Product not found`

### Quick Fix Checklist

- [ ] Products have QR codes generated
- [ ] QR codes are visible in Barcode Manager
- [ ] Camera permissions granted
- [ ] Using HTTPS connection
- [ ] Scanned code matches database value
- [ ] Product has stock available
- [ ] Logged in as correct user (Cashier for billing)

### Still Having Issues?

1. Check browser console for error messages
2. Verify Firebase connection is working
3. Ensure products exist in inventory
4. Try manual entry with product code (e.g., RICE001)
5. Regenerate all QR codes from Admin Dashboard

### Contact Support

If issues persist after following this guide:
1. Note the exact error message
2. Check browser console logs
3. Verify which step is failing
4. Document the QR code value being scanned
