import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getOrder, cancelOrder, clearOrderError } from '../../store/slices/orderSlice';
import { 
  ArrowLeft, 
  Package, 
  MapPin, 
  CreditCard, 
  Truck, 
  Clock, 
  CheckCircle, 
  XCircle,
  Loader2,
  Calendar,
  User,
  Mail,
  Phone
} from 'lucide-react';

const OrderDetailsPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { order, isLoading, error } = useSelector((state) => state.orders);
  const { user } = useSelector((state) => state.auth);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    dispatch(getOrder(id));
  }, [dispatch, id]);

  const handleCancelOrder = async () => {
    await dispatch(cancelOrder({ id, reason: cancelReason || 'Customer requested cancellation' })).unwrap();
    setShowCancelModal(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="h-6 w-6 text-yellow-500" />;
      case 'processing': return <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />;
      case 'shipped': return <Truck className="h-6 w-6 text-indigo-500" />;
      case 'delivered': return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'cancelled': return <XCircle className="h-6 w-6 text-red-500" />;
      default: return <Package className="h-6 w-6 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'processing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'shipped': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300';
      case 'delivered': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md mx-auto px-4">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Order Not Found</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {error || 'Unable to find this order.'}
          </p>
          <Link
            to="/orders"
            className="mt-6 inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/orders"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </Link>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Order #{order.orderNumber}
          </span>
        </div>

        {/* Status Banner */}
        <div className={`p-6 rounded-lg mb-6 ${getStatusColor(order.status)}`}>
          <div className="flex items-center gap-3">
            {getStatusIcon(order.status)}
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Order Status: {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </h2>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Placed on {new Date(order.createdAt).toLocaleDateString()} at{' '}
                {new Date(order.createdAt).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Order Items */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Order Items</h3>
            <div className="space-y-4">
              {order.orderItems.map((item, index) => (
                <div key={index} className="flex gap-4 pb-4 border-b border-gray-100 dark:border-gray-700 last:border-0 last:pb-0">
                  <img
                    src={item.image || 'https://via.placeholder.com/80x80?text=No+Image'}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <Link
                      to={`/product/${item.product}`}
                      className="font-medium text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400"
                    >
                      {item.name}
                    </Link>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Qty: {item.quantity}</p>
                    {item.variation && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {item.variation.name}: {item.variation.option}
                      </p>
                    )}
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      ${item.totalPrice.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Order Summary</h3>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                <span className="text-gray-900 dark:text-white">${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                <span className="text-gray-900 dark:text-white">${order.shippingPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Tax</span>
                <span className="text-gray-900 dark:text-white">${order.taxPrice.toFixed(2)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-${order.discountAmount.toFixed(2)}</span>
                </div>
              )}
              {order.couponDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Coupon ({order.couponCode})</span>
                  <span>-${order.couponDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-gray-900 dark:text-white">Total</span>
                  <span className="text-indigo-600 dark:text-indigo-400">
                    ${order.totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment</h4>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-900 dark:text-white capitalize">
                  {order.paymentMethod}
                </span>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPaymentStatusColor(order.paymentStatus)}`}>
                  {order.paymentStatus}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
              {order.status === 'pending' || order.status === 'processing' ? (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="w-full px-4 py-2 text-sm font-medium text-red-600 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  Cancel Order
                </button>
              ) : (
                order.status === 'shipped' && (
                  <Link
                    to={`/orders/${order._id}/tracking`}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                  >
                    <Truck className="h-4 w-4" />
                    Track Order
                  </Link>
                )
              )}
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Shipping Address
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Delivery Address</p>
              <p className="text-sm text-gray-900 dark:text-white mt-1">
                {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state}, {order.shippingAddress.zipCode}
              </p>
              <p className="text-sm text-gray-900 dark:text-white">{order.shippingAddress.country}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Contact Information</p>
              <p className="text-sm text-gray-900 dark:text-white mt-1 flex items-center gap-2">
                <Phone className="h-3 w-3 text-gray-400" />
                {order.shippingAddress.phone}
              </p>
              {order.user && (
                <p className="text-sm text-gray-900 dark:text-white flex items-center gap-2">
                  <Mail className="h-3 w-3 text-gray-400" />
                  {order.user.email}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Cancel Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Cancel Order
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Are you sure you want to cancel this order? This action cannot be undone.
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reason (Optional)
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Why are you cancelling?"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white resize-none h-20"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Keep Order
                </button>
                <button
                  onClick={handleCancelOrder}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Yes, Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetailsPage;