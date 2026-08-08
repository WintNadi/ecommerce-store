import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getOrderTracking, clearTracking } from '../../store/slices/orderSlice';
import { MapPin, Truck, CheckCircle, Clock, Package, ArrowLeft, Loader2, Calendar, Phone, Mail } from 'lucide-react';

const OrderTrackingPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { tracking, isLoading, error } = useSelector((state) => state.orders);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    dispatch(getOrderTracking(id));
    return () => {
      dispatch(clearTracking());
    };
  }, [dispatch, id]);

  // Tracking steps for timeline
  const trackingSteps = [
    { status: 'order_placed', label: 'Order Placed', icon: Package },
    { status: 'processing', label: 'Processing', icon: Clock },
    { status: 'shipped', label: 'Shipped', icon: Truck },
    { status: 'in_transit', label: 'In Transit', icon: MapPin },
    { status: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
    { status: 'delivered', label: 'Delivered', icon: CheckCircle }
  ];

  const getStatusIndex = (status) => {
    return trackingSteps.findIndex(step => step.status === status);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'order_placed': return 'border-gray-300 dark:border-gray-600';
      case 'processing': return 'border-blue-500';
      case 'shipped': return 'border-indigo-500';
      case 'in_transit': return 'border-yellow-500';
      case 'out_for_delivery': return 'border-orange-500';
      case 'delivered': return 'border-green-500';
      default: return 'border-gray-300 dark:border-gray-600';
    }
  };

  const getStatusBgColor = (status) => {
    switch (status) {
      case 'order_placed': return 'bg-gray-100 dark:bg-gray-700';
      case 'processing': return 'bg-blue-100 dark:bg-blue-900/30';
      case 'shipped': return 'bg-indigo-100 dark:bg-indigo-900/30';
      case 'in_transit': return 'bg-yellow-100 dark:bg-yellow-900/30';
      case 'out_for_delivery': return 'bg-orange-100 dark:bg-orange-900/30';
      case 'delivered': return 'bg-green-100 dark:bg-green-900/30';
      default: return 'bg-gray-100 dark:bg-gray-700';
    }
  };

  const getStatusTextColor = (status) => {
    switch (status) {
      case 'order_placed': return 'text-gray-600 dark:text-gray-400';
      case 'processing': return 'text-blue-600 dark:text-blue-400';
      case 'shipped': return 'text-indigo-600 dark:text-indigo-400';
      case 'in_transit': return 'text-yellow-600 dark:text-yellow-400';
      case 'out_for_delivery': return 'text-orange-600 dark:text-orange-400';
      case 'delivered': return 'text-green-600 dark:text-green-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'order_placed': return 'Order Placed';
      case 'processing': return 'Processing';
      case 'shipped': return 'Shipped';
      case 'in_transit': return 'In Transit';
      case 'out_for_delivery': return 'Out for Delivery';
      case 'delivered': return 'Delivered';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !tracking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md mx-auto px-4">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Tracking Not Found</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {error || 'Unable to find tracking information for this order.'}
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

  const { orderNumber, status, trackingNumber, trackingProvider, history, lastUpdate, estimatedDelivery } = tracking;
  const currentStepIndex = getStatusIndex(status);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/orders"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </Link>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Order #{orderNumber}
          </span>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          {/* Status Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Order Tracking
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-sm font-medium ${getStatusTextColor(status)}`}>
                    {getStatusText(status)}
                  </span>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBgColor(status)} ${getStatusTextColor(status)}`}>
                    {status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Last updated: {lastUpdate ? new Date(lastUpdate).toLocaleString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Tracking Info */}
          {(trackingNumber || trackingProvider || estimatedDelivery) && (
            <div className="p-6 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {trackingNumber && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Tracking Number
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                      {trackingNumber}
                    </p>
                  </div>
                )}
                {trackingProvider && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Carrier
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                      {trackingProvider}
                    </p>
                  </div>
                )}
                {estimatedDelivery && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Estimated Delivery
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                      {new Date(estimatedDelivery).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timeline - Progress Steps */}
          <div className="p-6">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-6">
              Tracking Timeline
            </h2>

            {/* Progress Bar */}
            <div className="relative mb-8">
              <div className="flex justify-between">
                {trackingSteps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = index <= currentStepIndex;
                  const isCurrent = index === currentStepIndex;

                  return (
                    <div key={step.status} className="flex flex-col items-center flex-1">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                          isActive
                            ? isCurrent
                              ? 'bg-indigo-600 text-white ring-4 ring-indigo-200 dark:ring-indigo-900/50'
                              : 'bg-indigo-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className={`text-xs mt-2 text-center ${
                        isActive ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-400 dark:text-gray-500'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Progress Line */}
              <div className="absolute top-5 left-0 right-0 h-0.5 -z-10">
                <div className="h-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-full bg-indigo-600 transition-all duration-500"
                    style={{ width: `${(currentStepIndex / (trackingSteps.length - 1)) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Tracking History */}
            {history && history.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                  History
                </h3>
                <div className="space-y-4">
                  {history.map((event, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className={`w-3 h-3 rounded-full mt-1.5 ${getStatusBgColor(event.status)}`} />
                        {index < history.length - 1 && (
                          <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700 mx-auto mt-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {getStatusText(event.status)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(event.timestamp).toLocaleString()}
                          </p>
                        </div>
                        {event.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            {event.description}
                          </p>
                        )}
                        {event.location && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {event.location}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to={`/orders/${id}`}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            View Order Details
          </Link>
          <a
            href={`mailto:support@ecommerce.com?subject=Order%20${orderNumber}`}
            className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
          >
            <Mail className="h-4 w-4" />
            Contact Support
          </a>
          <Link
            to="/shop"
            className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderTrackingPage;