import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createOrder } from '../store/slices/orderSlice';
import { getCart, clearCart } from '../store/slices/cartSlice';
import { 
  ChevronLeft, 
  ChevronRight, 
  Truck, 
  CreditCard, 
  MapPin, 
  CheckCircle, 
  Shield,
  Clock,
  Package,
  User,
  Phone,
  Mail,
  Home,
  Building,
  Map
} from 'lucide-react';

const CheckoutPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, subtotal, shippingAmount, taxAmount, totalPrice, itemCount } = useSelector((state) => state.cart);
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { isLoading, error, success, order } = useSelector((state) => state.orders);

  const [step, setStep] = useState(1);
  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Myanmar',
    phone: user?.phone || ''
  });
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [saveAddress, setSaveAddress] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }
    if (!items || items.length === 0) {
      navigate('/cart');
    }
    dispatch(getCart());
  }, [dispatch, items, navigate, isAuthenticated]);

  useEffect(() => {
    if (success && order) {
      setOrderPlaced(true);
      dispatch(clearCart());
    }
  }, [success, order, dispatch]);

  const handleAddressChange = (e) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!address.street || !address.city || !address.state || !address.zipCode) {
        alert('Please fill in all address fields');
        return;
      }
    }
    if (step === 2) {
      if (!paymentMethod) {
        alert('Please select a payment method');
        return;
      }
    }
    setStep(step + 1);
  };

  const handlePreviousStep = () => {
    setStep(step - 1);
  };

  const handlePlaceOrder = async () => {
    const orderData = {
      shippingAddress: address,
      paymentMethod,
      shippingMethod,
      notes: ''
    };

    try {
      await dispatch(createOrder(orderData)).unwrap();
    } catch (error) {
      console.error('Order creation failed:', error);
    }
  };

  const shippingCosts = {
    standard: 5.99,
    express: 12.99,
    international: 25.99
  };

  const totalWithShipping = totalPrice + shippingCosts[shippingMethod];

  if (orderPlaced && order) {
    return (
      <OrderConfirmation order={order} />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-indigo-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700'
              }`}>
                1
              </div>
              <span className="text-sm font-medium hidden sm:block">Address</span>
            </div>
            <div className={`w-12 h-0.5 ${step >= 2 ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-700'}`} />
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-indigo-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700'
              }`}>
                2
              </div>
              <span className="text-sm font-medium hidden sm:block">Payment</span>
            </div>
            <div className={`w-12 h-0.5 ${step >= 3 ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-700'}`} />
            <div className={`flex items-center gap-2 ${step >= 3 ? 'text-indigo-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 3 ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700'
              }`}>
                3
              </div>
              <span className="text-sm font-medium hidden sm:block">Confirm</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              {step === 1 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-indigo-600" />
                    Shipping Address
                  </h2>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Street Address *
                      </label>
                      <input
                        type="text"
                        name="street"
                        value={address.street}
                        onChange={handleAddressChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                        placeholder="123 Main Street"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          City *
                        </label>
                        <input
                          type="text"
                          name="city"
                          value={address.city}
                          onChange={handleAddressChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                          placeholder="Yangon"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          State/Region *
                        </label>
                        <input
                          type="text"
                          name="state"
                          value={address.state}
                          onChange={handleAddressChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                          placeholder="Yangon"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Zip Code *
                        </label>
                        <input
                          type="text"
                          name="zipCode"
                          value={address.zipCode}
                          onChange={handleAddressChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                          placeholder="11111"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Country
                        </label>
                        <input
                          type="text"
                          name="country"
                          value={address.country}
                          onChange={handleAddressChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                          placeholder="Myanmar"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={address.phone}
                        onChange={handleAddressChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                        placeholder="+959123456789"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="saveAddress"
                        checked={saveAddress}
                        onChange={(e) => setSaveAddress(e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 rounded"
                      />
                      <label htmlFor="saveAddress" className="text-sm text-gray-700 dark:text-gray-300">
                        Save this address to my profile
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-indigo-600" />
                    Payment & Shipping
                  </h2>
                  <div className="space-y-6">
                    {/* Shipping Method */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        Shipping Method
                      </h3>
                      <div className="space-y-2">
                        {['standard', 'express', 'international'].map((method) => (
                          <label key={method} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                            shippingMethod === method 
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                              : 'border-gray-200 dark:border-gray-700'
                          }`}>
                            <input
                              type="radio"
                              name="shipping"
                              value={method}
                              checked={shippingMethod === method}
                              onChange={(e) => setShippingMethod(e.target.value)}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                            />
                            <div className="flex-1">
                              <span className="font-medium capitalize text-gray-900 dark:text-white">
                                {method}
                              </span>
                              <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                                ${shippingCosts[method].toFixed(2)}
                              </span>
                            </div>
                            <Truck className="h-5 w-5 text-gray-400" />
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Payment Method
                      </h3>
                      <div className="space-y-2">
                        <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                          paymentMethod === 'stripe' 
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                            : 'border-gray-200 dark:border-gray-700'
                        }`}>
                          <input
                            type="radio"
                            name="payment"
                            value="stripe"
                            checked={paymentMethod === 'stripe'}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                          />
                          <div className="flex-1">
                            <span className="font-medium text-gray-900 dark:text-white">Credit Card (Stripe)</span>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Secure payment with Stripe</p>
                          </div>
                          <Shield className="h-5 w-5 text-gray-400" />
                        </label>
                        <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                          paymentMethod === 'paypal' 
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                            : 'border-gray-200 dark:border-gray-700'
                        }`}>
                          <input
                            type="radio"
                            name="payment"
                            value="paypal"
                            checked={paymentMethod === 'paypal'}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                          />
                          <div className="flex-1">
                            <span className="font-medium text-gray-900 dark:text-white">PayPal</span>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Pay with your PayPal account</p>
                          </div>
                          <CreditCard className="h-5 w-5 text-gray-400" />
                        </label>
                        <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                          paymentMethod === 'cod' 
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                            : 'border-gray-200 dark:border-gray-700'
                        }`}>
                          <input
                            type="radio"
                            name="payment"
                            value="cod"
                            checked={paymentMethod === 'cod'}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                          />
                          <div className="flex-1">
                            <span className="font-medium text-gray-900 dark:text-white">Cash on Delivery</span>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Pay when you receive</p>
                          </div>
                          <Package className="h-5 w-5 text-gray-400" />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Order Confirmation
                  </h2>
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-indigo-600" />
                        Shipping Address
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {address.street}, {address.city}, {address.state}, {address.zipCode}, {address.country}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Phone: {address.phone}</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-indigo-600" />
                        Payment & Shipping
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Method: {paymentMethod.toUpperCase()}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Shipping: {shippingMethod}</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                        <Package className="h-4 w-4 text-indigo-600" />
                        Order Items ({itemCount})
                      </h3>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {items.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm py-1 border-b border-gray-200 dark:border-gray-600 last:border-0">
                            <span className="text-gray-600 dark:text-gray-300">
                              {item.name} x {item.quantity}
                            </span>
                            <span className="text-gray-900 dark:text-white font-medium">
                              ${item.totalPrice.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                {step > 1 ? (
                  <button
                    onClick={handlePreviousStep}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </button>
                ) : (
                  <div />
                )}
                {step < 3 ? (
                  <button
                    onClick={handleNextStep}
                    className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Continue
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={handlePlaceOrder}
                    disabled={isLoading}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? 'Processing...' : 'Place Order'}
                  </button>
                )}
              </div>

              {error && (
                <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded dark:bg-red-900/30 dark:border-red-700 dark:text-red-300">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 sticky top-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Order Summary
              </h2>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    ${shippingCosts[shippingMethod].toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Tax</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    ${taxAmount.toFixed(2)}
                  </span>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-gray-900 dark:text-white">Total</span>
                    <span className="text-indigo-600 dark:text-indigo-400">
                      ${totalWithShipping.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-xs text-gray-600 dark:text-gray-300 space-y-1">
                <p>✅ Free shipping on orders over $50</p>
                <p>🛡️ Secure checkout with SSL encryption</p>
                <p>🔄 30-day money-back guarantee</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// ORDER CONFIRMATION COMPONENT
// ============================================

const OrderConfirmation = ({ order }) => {
  const navigate = useNavigate();
  const orderNumber = order.orderNumber || `ORD-${Date.now()}`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
          Order Confirmed! 🎉
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mt-2">
          Thank you for your order. We'll send you a confirmation email shortly.
        </p>

        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Order Number</span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              #{orderNumber}
            </span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Total</span>
            <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
              ${order.totalPrice?.toFixed(2) || '0.00'}
            </span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Payment Method</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
              {order.paymentMethod || 'COD'}
            </span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Shipping</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
              {order.shippingMethod || 'Standard'}
            </span>
          </div>
          <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
            <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
              {order.status || 'Pending'}
            </span>
          </div>
        </div>

        {/* Order Items Summary */}
        {order.orderItems && order.orderItems.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Order Items
            </h3>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {order.orderItems.map((item, index) => (
                <div key={index} className="flex justify-between text-sm py-1 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <span className="text-gray-600 dark:text-gray-300">
                    {item.name} x {item.quantity}
                  </span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    ${item.totalPrice?.toFixed(2) || '0.00'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate('/orders')}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            View My Orders
          </button>
          <button
            onClick={() => navigate('/shop')}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Continue Shopping
          </button>
        </div>

        <div className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
          <p>A confirmation email has been sent to your email address.</p>
          <p className="mt-1">You can track your order from the Orders page.</p>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;