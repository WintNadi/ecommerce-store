import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { createOrder } from '../store/slices/orderSlice';
import { getCart, clearCart } from '../store/slices/cartSlice';
import StripePayment from '../components/payment/StripePayment';
import {
  ChevronLeft,
  ChevronRight,
  Truck,
  CreditCard,
  MapPin,
  CheckCircle,
  Shield,
  Package,
  Loader2,
  AlertCircle,
  X
} from 'lucide-react';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const CheckoutPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { items, subtotal, taxAmount, totalPrice, itemCount } = useSelector(
    (state) => state.cart
  );

  const { user, isAuthenticated } = useSelector(
    (state) => state.auth
  );

  const { isLoading, error } = useSelector(
    (state) => state.orders
  );

  const [step, setStep] = useState(1);
  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Myanmar',
    phone: user?.phone || ''
  });

  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [shippingMethod, setShippingMethod] = useState('standard');

  // Order/payment states
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [createdOrderData, setCreatedOrderData] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);

  const [paymentError, setPaymentError] = useState(null);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showResumePage, setShowResumePage] = useState(false);

  // ✅ Track payment flow states
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [showStripeForm, setShowStripeForm] = useState(false);
  
  // ✅ Track if order is being created on payment success
  const [isProcessingSuccess, setIsProcessingSuccess] = useState(false);

  /*
   * ============================================================
   * CHECK IF WE'RE RETURNING FROM ORDERS
   * ============================================================
   */
  useEffect(() => {
    const fromOrders = location.state?.from === '/orders';
    const hasItems = items && items.length > 0;

    if (fromOrders && hasItems && !orderPlaced && !showConfirmation) {
      setShowResumePage(true);
    } else {
      setShowResumePage(false);
    }
  }, [location, items, orderPlaced, showConfirmation]);

  /*
   * ============================================================
   * LOAD CART
   * ============================================================
   */
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', {
        state: { from: '/checkout' }
      });
      return;
    }

    if (!cartLoaded) {
      dispatch(getCart()).then(() => {
        setCartLoaded(true);
      });
    }
  }, [dispatch, isAuthenticated, navigate, cartLoaded]);

  /*
   * ============================================================
   * CHECK EMPTY CART
   * ============================================================
   */
  useEffect(() => {
    if (
      cartLoaded &&
      step === 1 &&
      !orderPlaced &&
      !showConfirmation &&
      !showResumePage &&
      (!items || items.length === 0)
    ) {
      navigate('/cart');
    }
  }, [
    items,
    navigate,
    cartLoaded,
    orderPlaced,
    showConfirmation,
    showResumePage,
    step
  ]);

  /*
   * ============================================================
   * ADDRESS
   * ============================================================
   */
  const handleAddressChange = (e) => {
    setAddress({
      ...address,
      [e.target.name]: e.target.value
    });
  };

  /*
   * ============================================================
   * CREATE PAYMENT INTENT WITHOUT ORDER FIRST
   * ============================================================
   */
  const handleCreatePaymentIntent = async () => {
    // Prevent double submission
    if (isCreatingOrder || isProcessingPayment) {
      return;
    }

    if (!items || items.length === 0) {
      setPaymentError('Your cart is empty. Please add items to your cart.');
      return;
    }

    setIsCreatingOrder(true);
    setIsProcessingPayment(true);
    setPaymentError(null);

    try {
      // ✅ Calculate total
      const total = totalPrice + shippingCosts[shippingMethod];
      
      // ✅ Get clientSecret WITHOUT creating order
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No access token found. Please login again.');
      }

      console.log('🔄 Creating payment intent for amount:', total);
      
      const paymentResponse = await fetch('/api/payments/create-payment-intent-without-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          amount: Math.round(total * 100), // Convert to cents
          currency: 'usd',
          metadata: {
            items: JSON.stringify(items.map(i => ({ id: i._id, qty: i.quantity })))
          }
        })
      });

      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json();
        throw new Error(errorData.message || 'Payment initialization failed');
      }

      const paymentData = await paymentResponse.json();
      console.log('📦 Payment response:', paymentData);

      if (paymentData.success && paymentData.data?.clientSecret) {
        setClientSecret(paymentData.data.clientSecret);
        setShowStripeForm(true);
        console.log('✅ ClientSecret fetched successfully - showing card form');
      } else {
        throw new Error(paymentData.message || 'Failed to initialize payment');
      }

    } catch (error) {
      console.error('❌ Payment intent creation failed:', error);
      setPaymentError(error?.message || 'Failed to initialize payment');
      setClientSecret(null);
      setShowStripeForm(false);
    } finally {
      setIsCreatingOrder(false);
      setIsProcessingPayment(false);
    }
  };

  /*
   * ============================================================
   * CREATE ORDER AFTER PAYMENT SUCCESS
   * ============================================================
   */
  const handleCreateOrderAfterPayment = async (paymentIntent) => {
    if (isProcessingSuccess) {
      return;
    }

    setIsProcessingSuccess(true);
    setPaymentError(null);

    try {
      console.log('🔄 Creating order after successful payment...');
      console.log('💳 Payment Intent:', paymentIntent);

      const orderData = {
        shippingAddress: address,
        paymentMethod: 'stripe',
        shippingMethod,
        notes: '',
        paymentIntentId: paymentIntent.id,
        paymentStatus: 'paid',
        isPaid: true,
        paidAt: new Date().toISOString(),
        totalPrice: finalTotal,
        subtotal: subtotal,
        taxAmount: taxAmount,
        items: items
      };

      const result = await dispatch(createOrder(orderData)).unwrap();
      console.log('📦 Order creation result:', result);

      const newOrderId = result?.data?._id || result?.data?.id || result?._id;

      if (!newOrderId) {
        throw new Error('Order creation returned no order ID');
      }

      setOrderId(newOrderId);
      setCreatedOrderData(result.data || result);
      
      setOrderPlaced(true);
      setShowConfirmation(true);
      setStep(3);
      dispatch(clearCart());

    } catch (error) {
      console.error('❌ Order creation after payment failed:', error);
      setPaymentError('Payment succeeded but order creation failed. Please contact support.');
    } finally {
      setIsProcessingSuccess(false);
    }
  };

  /*
   * ============================================================
   * CREATE ORDER FOR COD
   * ============================================================
   */
  const createOrderForCOD = async () => {
    if (isProcessingPayment) {
      return;
    }

    if (!items || items.length === 0) {
      setPaymentError('Your cart is empty. Please add items to your cart.');
      return;
    }

    setIsProcessingPayment(true);
    setPaymentError(null);

    const orderData = {
      shippingAddress: address,
      paymentMethod: 'cod',
      shippingMethod,
      notes: ''
    };

    try {
      const result = await dispatch(createOrder(orderData)).unwrap();
      const newOrderId = result?.data?._id || result?.data?.id;

      if (!newOrderId) {
        throw new Error('Order creation returned no order ID');
      }

      setOrderId(newOrderId);
      setCreatedOrderData(result.data);

      setOrderPlaced(true);
      setShowConfirmation(true);
      setStep(3);
      dispatch(clearCart());

    } catch (error) {
      console.error('❌ COD order creation failed:', error);
      setPaymentError(error?.message || 'Failed to place order');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  /*
   * ============================================================
   * STRIPE PAYMENT SUCCESS
   * ============================================================
   */
  const handlePaymentSuccess = (paymentIntent) => {
    console.log('✅ Stripe payment successful:', paymentIntent?.id);
    handleCreateOrderAfterPayment(paymentIntent);
  };

  /*
   * ============================================================
   * STRIPE PAYMENT ERROR
   * ============================================================
   */
  const handlePaymentError = (error) => {
    console.error('❌ Stripe payment error:', error);
    setPaymentError(error || 'Payment failed. Please try again.');
    setShowStripeForm(false);
    setClientSecret(null);
  };

  /*
   * ============================================================
   * TRY AGAIN
   * ============================================================
   */
  const handleTryAgain = () => {
    setPaymentError(null);
    setShowResumePage(false);
    setOrderId(null);
    setCreatedOrderData(null);
    setClientSecret(null);
    setOrderPlaced(false);
    setShowConfirmation(false);
    setIsProcessingPayment(false);
    setIsCreatingOrder(false);
    setShowStripeForm(false);
    setIsProcessingSuccess(false);

    setStep(2);
    dispatch(getCart());
  };

  /*
   * ============================================================
   * CONTINUE TO CHECKOUT
   * ============================================================
   */
  const handleContinueToCheckout = () => {
    setShowResumePage(false);
    setOrderId(null);
    setCreatedOrderData(null);
    setClientSecret(null);
    setOrderPlaced(false);
    setShowConfirmation(false);
    setPaymentError(null);
    setShowStripeForm(false);
    setStep(1);
  };

  /*
   * ============================================================
   * HANDLE CONTINUE TO PAYMENT
   * ============================================================
   */
  const handleContinueToPayment = () => {
    if (step === 1) {
      if (
        !address.street ||
        !address.city ||
        !address.state ||
        !address.zipCode ||
        !address.phone
      ) {
        alert('Please fill in all address fields');
        return;
      }
      setPaymentError(null);
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!paymentMethod) {
        alert('Please select a payment method');
        return;
      }

      if (!items || items.length === 0) {
        setPaymentError('Your cart is empty. Please add items to your cart.');
        return;
      }

      if (paymentMethod === 'cod') {
        createOrderForCOD();
        return;
      }

      if (paymentMethod === 'stripe') {
        setOrderId(null);
        setCreatedOrderData(null);
        setClientSecret(null);
        setPaymentError(null);
        setShowStripeForm(false);
        setStep(3);
        return;
      }

      if (paymentMethod === 'paypal') {
        setPaymentError(
          'PayPal payment is not implemented yet. Please choose Stripe or Cash on Delivery.'
        );
      }
    }
  };

  /*
   * ============================================================
   * HANDLE PAYMENT METHOD CHANGE
   * ============================================================
   */
  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
    setPaymentError(null);
    setOrderId(null);
    setCreatedOrderData(null);
    setClientSecret(null);
    setShowStripeForm(false);
    
    if (step === 3 && method !== 'stripe') {
      setStep(2);
    }
  };

  const handlePreviousStep = () => {
    if (orderPlaced) {
      return;
    }

    if (step > 1) {
      setPaymentError(null);
      if (step === 3) {
        setOrderId(null);
        setCreatedOrderData(null);
        setClientSecret(null);
        setShowStripeForm(false);
      }
      setStep(step - 1);
    }
  };

  const handleCloseConfirmation = () => {
    setShowConfirmation(false);
    setOrderPlaced(false);
    navigate('/orders');
  };

  const handleViewOrders = () => {
    setShowConfirmation(false);
    setOrderPlaced(false);
    navigate('/orders');
  };

  const shippingCosts = {
    standard: 5.99,
    express: 12.99,
    international: 25.99
  };

  const finalTotal = totalPrice + shippingCosts[shippingMethod];

  /*
   * ============================================================
   * ORDER CONFIRMATION MODAL
   * ============================================================
   */
  if (orderPlaced && showConfirmation && createdOrderData) {
    return (
      <OrderConfirmation
        order={createdOrderData}
        onClose={handleCloseConfirmation}
        onViewOrders={handleViewOrders}
      />
    );
  }

  /*
   * ============================================================
   * RESUME PAYMENT PAGE
   * ============================================================
   */
  if (showResumePage) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 max-w-md w-full text-center">
          <Package className="h-16 w-16 text-indigo-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Resume Your Payment
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You have items in your cart. Click below to continue with your payment.
          </p>
          <button
            onClick={handleTryAgain}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Continue Payment
          </button>
        </div>
      </div>
    );
  }

  /*
   * ============================================================
   * MAIN CHECKOUT UI
   * ============================================================
   */
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* PROGRESS STEPS */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-2 ${
                step >= 1
                  ? 'text-indigo-600'
                  : 'text-gray-400'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= 1
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                1
              </div>
              <span className="text-sm font-medium hidden sm:block">
                Address
              </span>
            </div>

            <div
              className={`w-12 h-0.5 ${
                step >= 2
                  ? 'bg-indigo-600'
                  : 'bg-gray-300 dark:bg-gray-700'
              }`}
            />

            <div
              className={`flex items-center gap-2 ${
                step >= 2
                  ? 'text-indigo-600'
                  : 'text-gray-400'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= 2
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                2
              </div>
              <span className="text-sm font-medium hidden sm:block">
                Payment
              </span>
            </div>

            <div
              className={`w-12 h-0.5 ${
                step >= 3
                  ? 'bg-indigo-600'
                  : 'bg-gray-300 dark:bg-gray-700'
              }`}
            />

            <div
              className={`flex items-center gap-2 ${
                step >= 3
                  ? 'text-indigo-600'
                  : 'text-gray-400'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= 3
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                3
              </div>
              <span className="text-sm font-medium hidden sm:block">
                Pay
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* MAIN CONTENT */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">

              {paymentError && (
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium">Payment Error</p>
                      <p className="text-sm">{paymentError}</p>
                      <button
                        onClick={handleTryAgain}
                        className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 1 - Address */}
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
                  </div>
                </div>
              )}

              {/* STEP 2 - Payment Method Selection */}
              {step === 2 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-indigo-600" />
                    Payment & Shipping
                  </h2>

                  <div className="space-y-6">
                    {/* SHIPPING METHOD */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        Shipping Method
                      </h3>
                      <div className="space-y-2">
                        {['standard', 'express', 'international'].map((method) => (
                          <label
                            key={method}
                            className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                              shippingMethod === method
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                : 'border-gray-200 dark:border-gray-700'
                            }`}
                          >
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

                    {/* PAYMENT METHOD */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Payment Method
                      </h3>
                      <div className="space-y-2">
                        <label
                          className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                            paymentMethod === 'stripe'
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                              : 'border-gray-200 dark:border-gray-700'
                          }`}
                          onClick={() => handlePaymentMethodChange('stripe')}
                        >
                          <input
                            type="radio"
                            name="payment"
                            value="stripe"
                            checked={paymentMethod === 'stripe'}
                            onChange={() => {}}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                          />
                          <div className="flex-1">
                            <span className="font-medium text-gray-900 dark:text-white">
                              Credit Card (Stripe)
                            </span>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Secure payment with Stripe
                            </p>
                          </div>
                          <Shield className="h-5 w-5 text-gray-400" />
                        </label>

                        <label
                          className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                            paymentMethod === 'paypal'
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                              : 'border-gray-200 dark:border-gray-700'
                          }`}
                          onClick={() => handlePaymentMethodChange('paypal')}
                        >
                          <input
                            type="radio"
                            name="payment"
                            value="paypal"
                            checked={paymentMethod === 'paypal'}
                            onChange={() => {}}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                          />
                          <div className="flex-1">
                            <span className="font-medium text-gray-900 dark:text-white">
                              PayPal
                            </span>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Currently unavailable
                            </p>
                          </div>
                          <CreditCard className="h-5 w-5 text-gray-400" />
                        </label>

                        <label
                          className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                            paymentMethod === 'cod'
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                              : 'border-gray-200 dark:border-gray-700'
                          }`}
                          onClick={() => handlePaymentMethodChange('cod')}
                        >
                          <input
                            type="radio"
                            name="payment"
                            value="cod"
                            checked={paymentMethod === 'cod'}
                            onChange={() => {}}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                          />
                          <div className="flex-1">
                            <span className="font-medium text-gray-900 dark:text-white">
                              Cash on Delivery
                            </span>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Pay when you receive
                            </p>
                          </div>
                          <Package className="h-5 w-5 text-gray-400" />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3 - Payment Page - NO ORDER CREATED YET! */}
              {step === 3 && paymentMethod === 'stripe' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-indigo-600" />
                    Enter Card Details
                  </h2>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {showStripeForm 
                      ? 'Enter your card details to complete the payment. Order will be created after successful payment.' 
                      : 'Click the button below to proceed with payment. Your order will be created ONLY after successful payment.'}
                  </p>

                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    {isCreatingOrder || isProcessingPayment ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-indigo-600 mr-2" />
                        <span className="text-gray-600 dark:text-gray-400">
                          {isCreatingOrder ? 'Initializing payment...' : 'Processing...'}
                        </span>
                      </div>
                    ) : showStripeForm && clientSecret ? (
                      <Elements 
                        stripe={stripePromise} 
                        options={{ 
                          clientSecret,
                          appearance: {
                            theme: 'stripe',
                            variables: { 
                              colorPrimary: '#4F46E5',
                              colorBackground: '#ffffff',
                              colorText: '#1a202c'
                            }
                          }
                        }}
                      >
                        <StripePayment
                          clientSecret={clientSecret}
                          amount={finalTotal}
                          onSuccess={handlePaymentSuccess}
                          onError={handlePaymentError}
                        />
                      </Elements>
                    ) : (
                      // ✅ Updated Button - "Enter Card Details" instead of "Pay"
                      <div className="text-center py-4">
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                          Click the button below to start the payment process.
                          Your order will be created ONLY after successful payment.
                        </p>
                        <button
                          onClick={handleCreatePaymentIntent}
                          disabled={isCreatingOrder || isProcessingPayment}
                          className="px-8 py-4 bg-indigo-600 text-white text-lg font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {isCreatingOrder || isProcessingPayment ? (
                            <span className="flex items-center justify-center gap-2">
                              <Loader2 className="h-5 w-5 animate-spin" />
                              Initializing...
                            </span>
                          ) : (
                            `Enter Card Details - $${finalTotal.toFixed(2)}`
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* NAVIGATION */}
              <div className="flex justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                {step > 1 ? (
                  <button
                    onClick={handlePreviousStep}
                    disabled={isProcessingPayment || orderPlaced}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </button>
                ) : (
                  <div />
                )}

                {/* STEP 1 CONTINUE */}
                {step === 1 && (
                  <button
                    onClick={handleContinueToPayment}
                    className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Continue
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}

                {/* STEP 2 CONTINUE */}
                {step === 2 && (
                  <button
                    onClick={handleContinueToPayment}
                    disabled={isProcessingPayment}
                    className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {paymentMethod === 'cod' ? 'Place Order' : 'Continue to Payment'}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>

              {error && !paymentError && (
                <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded dark:bg-red-900/30 dark:border-red-700 dark:text-red-300">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* ORDER SUMMARY */}
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
                      ${finalTotal.toFixed(2)}
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

/*
 * ============================================================
 * ORDER CONFIRMATION MODAL
 * ============================================================
 */
const OrderConfirmation = ({ order, onClose, onViewOrders }) => {
  const navigate = useNavigate();

  const orderNumber = order?.orderNumber || order?._id || `ORD-${Date.now()}`;
  const orderItems = order?.orderItems || order?.items || [];

  const handleBackdropClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <X className="h-6 w-6 text-gray-500 dark:text-gray-400" />
        </button>

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
              ${order?.totalPrice?.toFixed(2) || '0.00'}
            </span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Payment Method</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
              {order?.paymentMethod || 'COD'}
            </span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Shipping</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
              {order?.shippingMethod || 'Standard'}
            </span>
          </div>
          <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
            <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
              {order?.status || 'Pending'}
            </span>
          </div>
        </div>

        {orderItems.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Order Items
            </h3>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {orderItems.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between text-sm py-1 border-b border-gray-100 dark:border-gray-700 last:border-0"
                >
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
            onClick={onViewOrders}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            View My Orders
          </button>
          <button
            onClick={() => {
              onClose();
              navigate('/shop');
            }}
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