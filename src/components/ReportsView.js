import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Download,
  DollarSign,
  Package,
  Users,
  ShoppingCart
} from 'lucide-react';
import { getSales } from '../services/firebaseService';

const ReportsView = ({ inventory }) => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7days');
  const [reportStats, setReportStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    topSellingProduct: '',
    revenueGrowth: 0,
    orderGrowth: 0
  });

  useEffect(() => {
    loadReportsData();
  }, [dateRange]);

  const loadReportsData = async () => {
    setLoading(true);
    try {
      const salesData = await getSales(100);
      setSales(salesData);
      
      // Calculate stats
      const totalRevenue = salesData.reduce((sum, sale) => sum + sale.total, 0);
      const totalOrders = salesData.length;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      
      // Find top selling product
      const productSales = {};
      salesData.forEach(sale => {
        sale.items.forEach(item => {
          productSales[item.name] = (productSales[item.name] || 0) + item.qty;
        });
      });
      
      const topSellingProduct = Object.keys(productSales).reduce((a, b) => 
        productSales[a] > productSales[b] ? a : b, ''
      );

      setReportStats({
        totalRevenue,
        totalOrders,
        avgOrderValue,
        topSellingProduct,
        revenueGrowth: 12.5, // Mock data
        orderGrowth: 8.3 // Mock data
      });
    } catch (error) {
      console.error('Error loading reports data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    // Mock export functionality
    alert('Report exported successfully!');
  };

  const recentSales = sales.slice(0, 10);

  return (
    <div className="reports-view">
      <div className="view-header">
        <h1>Reports & Analytics</h1>
        <div className="header-actions">
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className="date-range-select"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="1year">Last Year</option>
          </select>
          <button className="btn-primary" onClick={exportReport}>
            <Download size={20} />
            Export Report
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Loading reports...</div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="metrics-grid">
            <div className="metric-card revenue">
              <div className="metric-icon">
                <DollarSign size={24} />
              </div>
              <div className="metric-content">
                <div className="metric-value">₹{reportStats.totalRevenue.toFixed(2)}</div>
                <div className="metric-label">Total Revenue</div>
                <div className="metric-change positive">
                  <TrendingUp size={16} />
                  +{reportStats.revenueGrowth}%
                </div>
              </div>
            </div>

            <div className="metric-card orders">
              <div className="metric-icon">
                <ShoppingCart size={24} />
              </div>
              <div className="metric-content">
                <div className="metric-value">{reportStats.totalOrders}</div>
                <div className="metric-label">Total Orders</div>
                <div className="metric-change positive">
                  <TrendingUp size={16} />
                  +{reportStats.orderGrowth}%
                </div>
              </div>
            </div>

            <div className="metric-card avg-order">
              <div className="metric-icon">
                <BarChart3 size={24} />
              </div>
              <div className="metric-content">
                <div className="metric-value">₹{reportStats.avgOrderValue.toFixed(2)}</div>
                <div className="metric-label">Avg Order Value</div>
                <div className="metric-change neutral">
                  <TrendingUp size={16} />
                  +2.1%
                </div>
              </div>
            </div>

            <div className="metric-card products">
              <div className="metric-icon">
                <Package size={24} />
              </div>
              <div className="metric-content">
                <div className="metric-value">{inventory.length}</div>
                <div className="metric-label">Active Products</div>
                <div className="metric-change positive">
                  <TrendingUp size={16} />
                  +5.2%
                </div>
              </div>
            </div>
          </div>

          {/* Charts and Tables */}
          <div className="reports-content">
            <div className="chart-section">
              <div className="section-header">
                <h3>Sales Trend</h3>
                <div className="chart-filters">
                  <button className="chart-btn active">Revenue</button>
                  <button className="chart-btn">Orders</button>
                  <button className="chart-btn">Products</button>
                </div>
              </div>
              <div className="chart-placeholder">
                <BarChart3 size={48} />
                <p>Sales chart visualization would appear here</p>
                <small>Integration with Chart.js or similar library needed</small>
              </div>
            </div>

            <div className="top-products">
              <h3>Top Selling Products</h3>
              <div className="products-list">
                {inventory.slice(0, 5).map((product, index) => (
                  <div key={product.id} className="product-item">
                    <div className="product-rank">#{index + 1}</div>
                    <div className="product-info">
                      <div className="product-name">{product.name}</div>
                      <div className="product-price">₹{product.price}</div>
                    </div>
                    <div className="product-sales">
                      <div className="sales-count">{Math.floor(Math.random() * 50) + 10} sold</div>
                      <div className="sales-revenue">₹{(product.price * (Math.floor(Math.random() * 50) + 10)).toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Sales Table */}
          <div className="recent-sales">
            <h3>Recent Sales</h3>
            <div className="sales-table">
              <table>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Date</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.map((sale, index) => (
                    <tr key={sale.id || index}>
                      <td>#{sale.id || `ORD${index + 1000}`}</td>
                      <td>
                        {sale.timestamp ? 
                          new Date(sale.timestamp.seconds * 1000).toLocaleDateString() : 
                          new Date().toLocaleDateString()
                        }
                      </td>
                      <td>{sale.itemCount} items</td>
                      <td>₹{sale.total.toFixed(2)}</td>
                      <td>
                        <span className="status-badge completed">Completed</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ReportsView;