// Bill generation and printing utilities

export const generateBillHTML = (billData, storeSettings = {}) => {
  console.log('📄 Generating bill HTML');
  console.log('Bill data:', billData);
  console.log('Store settings:', storeSettings);
  
  const { 
    items, 
    subtotal, 
    taxAmount, 
    taxRate,
    discount, 
    total, 
    paymentMode, 
    itemCount, 
    timestamp, 
    billNumber, 
    storeName,
    currency = 'INR',
    currencySymbol = '₹'
  } = billData;
  
  const currentDate = new Date(timestamp || Date.now());
  const displayBillNumber = billNumber || `BILL-${currentDate.getTime().toString().slice(-8)}`;
  const displayStoreName = storeSettings.businessName || storeName || 'PRABA STORE';
  const displayAddress = storeSettings.businessAddress || '123 Main Street, City';
  const displayPhone = storeSettings.businessPhone || '+91 98765 43210';
  const displayGST = storeSettings.gstNumber || 'GST: 29ABCDE1234F1Z5';
  const displayFooter = storeSettings.receiptFooter || 'Thank you for shopping with us!';
  const showLogo = storeSettings.printLogo === true;
  
  console.log('🏷️ Show logo:', showLogo, 'printLogo setting:', storeSettings.printLogo);
  
  // Get tax display name based on currency
  const getTaxName = (curr) => {
    switch (curr) {
      case 'INR': return 'GST';
      case 'USD': return 'Sales Tax';
      case 'EUR': return 'VAT';
      case 'GBP': return 'VAT';
      default: return 'Tax';
    }
  };
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Bill - ${displayBillNumber}</title>
      <style>
        body {
          font-family: 'Courier New', monospace;
          margin: 0;
          padding: 20px;
          background: white;
          color: black;
        }
        .bill-container {
          max-width: 400px;
          margin: 0 auto;
          border: 2px solid #000;
          padding: 20px;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #000;
          padding-bottom: 10px;
          margin-bottom: 15px;
        }
        .logo {
          width: 100px;
          height: 100px;
          margin: 0 auto 15px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: 3px solid #000;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: bold;
          color: white;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .store-name {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .store-details {
          font-size: 12px;
          line-height: 1.4;
        }
        .bill-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 15px;
          font-size: 12px;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
        }
        .items-table th,
        .items-table td {
          text-align: left;
          padding: 5px 2px;
          font-size: 12px;
          border-bottom: 1px dashed #000;
        }
        .items-table th {
          font-weight: bold;
          border-bottom: 2px solid #000;
        }
        .item-name {
          width: 50%;
        }
        .item-qty {
          width: 15%;
          text-align: center;
        }
        .item-price {
          width: 20%;
          text-align: right;
        }
        .item-total {
          width: 15%;
          text-align: right;
        }
        .totals-section {
          border-top: 2px solid #000;
          padding-top: 10px;
          margin-top: 15px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
          font-size: 12px;
        }
        .final-total {
          font-weight: bold;
          font-size: 16px;
          border-top: 1px solid #000;
          padding-top: 5px;
          margin-top: 10px;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          padding-top: 15px;
          border-top: 2px solid #000;
          font-size: 11px;
        }
        .thank-you {
          font-weight: bold;
          margin-bottom: 10px;
        }
        @media print {
          body { margin: 0; padding: 10px; }
          .bill-container { border: 1px solid #000; }
        }
      </style>
    </head>
    <body>
      <div class="bill-container">
        <div class="header">
          ${showLogo ? '<div class="logo">LOGO</div>' : ''}
          <div class="store-name">${displayStoreName.toUpperCase()}</div>
          <div class="store-details">
            ${displayAddress}<br>
            Phone: ${displayPhone}<br>
            ${displayGST}
          </div>
        </div>
        
        <div class="bill-info">
          <div>
            <strong>Bill No:</strong> ${displayBillNumber}<br>
            <strong>Date:</strong> ${currentDate.toLocaleDateString()}<br>
            <strong>Time:</strong> ${currentDate.toLocaleTimeString()}
          </div>
          <div>
            <strong>Payment:</strong> ${paymentMode}<br>
            <strong>Items:</strong> ${itemCount}
          </div>
        </div>
        
        <table class="items-table">
          <thead>
            <tr>
              <th class="item-name">Item</th>
              <th class="item-qty">Qty</th>
              <th class="item-price">Price</th>
              <th class="item-total">Total</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td class="item-name">${item.name}</td>
                <td class="item-qty">${item.qty}</td>
                <td class="item-price">${currencySymbol}${item.price.toFixed(2)}</td>
                <td class="item-total">${currencySymbol}${item.total.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="totals-section">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>${currencySymbol}${subtotal.toFixed(2)}</span>
          </div>
          <div class="total-row">
            <span>${getTaxName(currency)} (${taxRate}%):</span>
            <span>${currencySymbol}${taxAmount.toFixed(2)}</span>
          </div>
          ${discount > 0 ? `
            <div class="total-row">
              <span>Discount:</span>
              <span>-${currencySymbol}${discount.toFixed(2)}</span>
            </div>
          ` : ''}
          <div class="total-row final-total">
            <span>TOTAL:</span>
            <span>${currencySymbol}${total.toFixed(2)}</span>
          </div>
        </div>
        
        <div class="footer">
          <div class="thank-you">${displayFooter}</div>
          <div>Visit Again Soon</div>
          <div style="margin-top: 10px; font-size: 10px;">
            Generated on ${new Date().toLocaleString()}
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const printBill = (billData, storeSettings = {}) => {
  try {
    console.log('🖨️ Printing bill with data:', billData);
    console.log('⚙️ Store settings:', storeSettings);
    
    const billHTML = generateBillHTML(billData, storeSettings);
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) {
      alert('Please allow popups to print the bill');
      return;
    }
    
    printWindow.document.write(billHTML);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = () => {
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250); // Small delay to ensure content is rendered
      
      // Close the window after printing (optional)
      printWindow.onafterprint = () => {
        printWindow.close();
      };
    };
  } catch (error) {
    console.error('❌ Error printing bill:', error);
    alert('Error printing bill: ' + error.message);
  }
};

export const downloadBill = (billData, storeSettings = {}) => {
  const billHTML = generateBillHTML(billData, storeSettings);
  const currentDate = new Date(billData.timestamp || Date.now());
  const displayBillNumber = billData.billNumber || `BILL-${currentDate.getTime().toString().slice(-8)}`;
  
  // Create blob and download
  const blob = new Blob([billHTML], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${displayBillNumber}_${currentDate.toISOString().split('T')[0]}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  URL.revokeObjectURL(url);
};

export const generatePDF = async (billData, storeSettings = {}) => {
  // For PDF generation, we'll use the browser's print to PDF functionality
  const billHTML = generateBillHTML(billData, storeSettings);
  
  const printWindow = window.open('', '_blank', 'width=400,height=600');
  if (!printWindow) {
    alert('Please allow popups to save as PDF');
    return;
  }
  
  printWindow.document.write(billHTML);
  printWindow.document.close();
  
  printWindow.onload = () => {
    printWindow.focus();
    // User can manually save as PDF using Ctrl+P -> Save as PDF
    alert('Use Ctrl+P or Cmd+P and select "Save as PDF" to download as PDF');
    printWindow.print();
  };
};