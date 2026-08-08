<<<<<<< Updated upstream
=======
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
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
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

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
      !orderPlaced &&
      !showConfirmation &&
      (!items || items.length === 0)
    ) {
      navigate('/cart');
    }
  }, [
    items,
    navigate,
    cartLoaded,
    orderPlaced,
    showConfirmation
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
   * CREATE ORDER FOR STRIPE
   * ============================================================
   */
  const createOrderForStripe = async () => {
    if (isCreatingOrder || orderId) {
      return;
    }

    setIsCreatingOrder(true);
    setPaymentError(null);

    const orderData = {
      shippingAddress: address,
      paymentMethod: 'stripe',
      shippingMethod,
      notes: ''
    };

    try {
      // 1. Create order first
      const result = await dispatch(createOrder(orderData)).unwrap();
      const newOrderId = result?.data?._id || result?.data?.id;

      if (!newOrderId) {
        throw new Error('Order creation returned no order ID');
      }

      setOrderId(newOrderId);
      setCreatedOrderData(result.data);

      // 2. Create payment intent
      const paymentResponse = await fetch('/api/payments/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ orderId: newOrderId })
      });

      const paymentData = await paymentResponse.json();

      if (paymentData.success) {
        setClientSecret(paymentData.data.clientSecret);
        console.log('✅ ClientSecret fetched successfully');
      } else {
        throw new Error(paymentData.message || 'Failed to initialize payment');
      }

    } catch (error) {
      console.error('Stripe order creation failed:', error);
      setPaymentError(error?.message || 'Failed to create order');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  /*
   * ============================================================
   * CREATE ORDER FOR COD
   * ============================================================
   */
  const createOrderForCOD = async () => {
    if (isCreatingOrder) {
      return;
    }

    setIsCreatingOrder(true);
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

      // COD is considered successful immediately
      setOrderPlaced(true);
      setShowConfirmation(true);
      setStep(3);
      dispatch(clearCart());

    } catch (error) {
      console.error('COD order creation failed:', error);
      setPaymentError(error?.message || 'Failed to place order');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  /*
   * ============================================================
   * STRIPE PAYMENT SUCCESS
   * ============================================================
   */
  const handlePaymentSuccess = (paymentIntent) => {
    console.log('✅ Stripe payment successful:', paymentIntent?.id);

    setPaymentError(null);
    setOrderPlaced(true);
    setShowConfirmation(true);
    setStep(3);
    dispatch(clearCart());
  };

  /*
   * ============================================================
   * STRIPE PAYMENT ERROR
   * ============================================================
   */
  const handlePaymentError = (error) => {
    console.error('Stripe payment error:', error);
    setPaymentError(error || 'Payment failed. Please try again.');
  };

  /*
   * ============================================================
   * TRY AGAIN
   * ============================================================
   */
  const handleTryAgain = async () => {
    setPaymentError(null);

    if (!orderPlaced) {
      setOrderId(null);
      setCreatedOrderData(null);
      setClientSecret(null);
    }

    if (!orderId) {
      await dispatch(getCart());
    }

    setStep(2);
  };

  /*
   * ============================================================
   * NAVIGATION
   * ============================================================
   */
  const handleNextStep = async () => {
    // STEP 1 → STEP 2
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

    // STEP 2
    if (step === 2) {
      if (!paymentMethod) {
        alert('Please select a payment method');
        return;
      }

      // COD
      if (paymentMethod === 'cod') {
        await createOrderForCOD();
        return;
      }

      // Stripe
      if (paymentMethod === 'stripe') {
        if (!orderId) {
          await createOrderForStripe();
        }
        return;
      }

      // PayPal is not implemented yet
      if (paymentMethod === 'paypal') {
        setPaymentError(
          'PayPal payment is not implemented yet. Please choose Stripe or Cash on Delivery.'
        );
      }
    }
  };

  const handlePreviousStep = () => {
    if (orderPlaced) {
      return;
    }

    if (step > 1) {
      setPaymentError(null);
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
                Confirm
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
                      <p className="font-medium">
                        Payment Error
                      </p>

                      <p className="text-sm">
                        {paymentError}
                      </p>

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

              {/* STEP 1 */}
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

              {/* STEP 2 */}
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

                        {/* STRIPE */}
                        <label
                          className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                            paymentMethod === 'stripe'
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                              : 'border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          <input
                            type="radio"
                            name="payment"
                            value="stripe"
                            checked={paymentMethod === 'stripe'}
                            onChange={(e) => {
                              setPaymentMethod(e.target.value);
                              setPaymentError(null);
                            }}
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

                        {/* PAYPAL */}
                        <label
                          className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                            paymentMethod === 'paypal'
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                              : 'border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          <input
                            type="radio"
                            name="payment"
                            value="paypal"
                            checked={paymentMethod === 'paypal'}
                            onChange={(e) => {
                              setPaymentMethod(e.target.value);
                              setPaymentError(null);
                            }}
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

                        {/* COD */}
                        <label
                          className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                            paymentMethod === 'cod'
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                              : 'border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          <input
                            type="radio"
                            name="payment"
                            value="cod"
                            checked={paymentMethod === 'cod'}
                            onChange={(e) => {
                              setPaymentMethod(e.target.value);
                              setPaymentError(null);
                            }}
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

                    {/* ✅ STRIPE PAYMENT - ONLY SHOW WHEN clientSecret EXISTS */}
                    {paymentMethod === 'stripe' && clientSecret && (
                      <div className="mt-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          Card Details
                        </h4>
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
                            orderId={orderId}
                            onSuccess={handlePaymentSuccess}
                            onError={handlePaymentError}
                          />
                        </Elements>
                      </div>
                    )}

                    {/* STRIPE ORDER CREATION LOADING */}
                    {paymentMethod === 'stripe' &&
                      !clientSecret &&
                      isCreatingOrder && (
                        <div className="mt-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin text-indigo-600 mr-2" />
                            <span className="text-gray-600 dark:text-gray-400">
                              Creating your order...
                            </span>
                          </div>
                        </div>
                      )}

                    {/* STRIPE CREATE ORDER BUTTON */}
                    {paymentMethod === 'stripe' &&
                      !orderId &&
                      !isCreatingOrder && (
                        <button
                          onClick={handleNextStep}
                          className="w-full mt-4 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          Continue to Payment
                        </button>
                      )}

                    {/* COD BUTTON */}
                    {paymentMethod === 'cod' && (
                      <button
                        onClick={handleNextStep}
                        disabled={isCreatingOrder}
                        className="w-full mt-4 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isCreatingOrder ? (
                          <span className="flex items-center justify-center gap-2">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Processing...
                          </span>
                        ) : (
                          'Place Order'
                        )}
                      </button>
                    )}

                    {/* PAYPAL BUTTON */}
                    {paymentMethod === 'paypal' && (
                      <button
                        onClick={handleNextStep}
                        className="w-full mt-4 px-6 py-3 bg-gray-400 text-white font-medium rounded-lg cursor-not-allowed"
                      >
                        PayPal Unavailable
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 3 */}
              {step === 3 && !showConfirmation && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Order Confirmation
                  </h2>

                  <p className="text-gray-600 dark:text-gray-300">
                    Your order has been successfully placed.
                  </p>
                </div>
              )}

              {/* NAVIGATION */}
              <div className="flex justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">

                {step > 1 ? (
                  <button
                    onClick={handlePreviousStep}
                    disabled={isCreatingOrder || orderPlaced}
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
                    onClick={handleNextStep}
                    className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Continue
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
                  <span className="text-gray-600 dark:text-gray-400">
                    Subtotal
                  </span>

                  <span className="text-gray-900 dark:text-white font-medium">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Shipping
                  </span>

                  <span className="text-gray-900 dark:text-white font-medium">
                    ${shippingCosts[shippingMethod].toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Tax
                  </span>

                  <span className="text-gray-900 dark:text-white font-medium">
                    ${taxAmount.toFixed(2)}
                  </span>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                  <div className="flex justify-between text-lg font-bold">

                    <span className="text-gray-900 dark:text-white">
                      Total
                    </span>

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
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Order Number
            </span>

            <span className="text-sm font-bold text-gray-900 dark:text-white">
              #{orderNumber}
            </span>
          </div>

          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Total
            </span>

            <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
              ${order?.totalPrice?.toFixed(2) || '0.00'}
            </span>
          </div>

          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Payment Method
            </span>

            <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
              {order?.paymentMethod || 'COD'}
            </span>
          </div>

          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Shipping
            </span>

            <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
              {order?.shippingMethod || 'Standard'}
            </span>
          </div>

          <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Status
            </span>

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
          <p>
            A confirmation email has been sent to your email address.
          </p>

          <p className="mt-1">
            You can track your order from the Orders page.
          </p>
        </div>

      </div>
    </div>
  );
};

export default CheckoutPage;
>>>>>>> Stashed changes
