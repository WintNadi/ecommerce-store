import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
  ShoppingBag, 
  Users, 
  DollarSign, 
  Package, 
  TrendingUp, 
  TrendingDown,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { getOrderStats, getDailyOrderStats } from '../../store/slices/orderSlice';
import { getProductStats } from '../../store/slices/productSlice';

const DashboardPage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { stats: orderStats, dailyStats } = useSelector((state) => state.orders);
  const { stats: productStats } = useSelector((state) => state.products);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([
        dispatch(getOrderStats()),
        dispatch(getDailyOrderStats({ days: 7 })),
        dispatch(getProductStats())
      ]);
      setLoading(false);
    };
    fetchData();
  }, [dispatch]);

  const statsCards = [
    {
      title: 'Total Revenue',
      value: `$${orderStats?.totalRevenue?.toFixed(2) || '0.00'}`,
      icon: DollarSign,
      color: 'bg-green-500',
      change: '+12.5%',
      trend: 'up'
    },
    {
      title: 'Total Orders',
      value: orderStats?.totalOrders || 0,
      icon: ShoppingBag,
      color: 'bg-blue-500',
      change: '+8.2%',
      trend: 'up'
    },
    {
      title: 'Total Products',
      value: productStats?.totalProducts || 0,
      icon: Package,
      color: 'bg-purple-500',
      change: '+3.1%',
      trend: 'up'
    },
    {
      title: 'Total Users',
      value: 0,
      icon: Users,
      color: 'bg-orange-500',
      change: '+5.7%',
      trend: 'up'
    }
  ];

  const orderStatusCounts = [
    {
      status: 'Pending',
      count: orderStats?.pendingOrders || 0,
      icon: Clock,
      color: 'text-yellow-500',
      bg: 'bg-yellow-50 dark:bg-yellow-900/20'
    },
    {
      status: 'Processing',
      count: orderStats?.processingOrders || 0,
      icon: Clock,
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      status: 'Shipped',
      count: orderStats?.shippedOrders || 0,
      icon: Eye,
      color: 'text-indigo-500',
      bg: 'bg-indigo-50 dark:bg-indigo-900/20'
    },
    {
      status: 'Delivered',
      count: orderStats?.deliveredOrders || 0,
      icon: CheckCircle,
      color: 'text-green-500',
      bg: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      status: 'Cancelled',
      count: orderStats?.cancelledOrders || 0,
      icon: XCircle,
      color: 'text-red-500',
      bg: 'bg-red-50 dark:bg-red-900/20'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Dashboard
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Welcome back, {user?.name || 'Admin'}! Here's what's happening with your store.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Last updated: {new Date().toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((stat, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${stat.color} bg-opacity-10`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                {stat.trend === 'up' ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-sm ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                  {stat.change}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">from last month</span>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Link
                to="/admin/products"
                className="p-4 text-center border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Package className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Add Product</span>
              </Link>
              <Link
                to="/admin/orders"
                className="p-4 text-center border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <ShoppingBag className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">View Orders</span>
              </Link>
              <Link
                to="/admin/users"
                className="p-4 text-center border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Users className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Manage Users</span>
              </Link>
            </div>
          </div>

          {/* Order Status Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Order Status
            </h2>
            <div className="space-y-3">
              {orderStatusCounts.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded ${item.bg}`}>
                      <item.icon className={`h-4 w-4 ${item.color}`} />
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{item.status}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Orders
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Order ID</th>
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Customer</th>
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Total</th>
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Date</th>
                  <th className="text-right py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {dailyStats && dailyStats.length > 0 ? (
                  dailyStats.slice(0, 5).map((stat, index) => (
                    <tr key={index} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="py-3 px-4 text-indigo-600 dark:text-indigo-400 font-medium">
                        #ORD-{String(stat._id.year).slice(2)}{String(stat._id.month).padStart(2, '0')}{String(stat._id.day).padStart(2, '0')}-{String(index + 1).padStart(4, '0')}
                      </td>
                      <td className="py-3 px-4 text-gray-900 dark:text-white">Customer Name</td>
                      <td className="py-3 px-4 text-gray-900 dark:text-white font-medium">
                        ${stat.revenue.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                          Pending
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                        {new Date(stat._id.year, stat._id.month - 1, stat._id.day).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/admin/orders`}
                          className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 text-sm font-medium"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-gray-500 dark:text-gray-400">
                      No recent orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;  // ← ဒါကိုထည့်ပါ