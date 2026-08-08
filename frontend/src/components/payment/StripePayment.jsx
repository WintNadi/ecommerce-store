import React, { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const StripePayment = ({ 
  clientSecret, 
  amount, 
  onSuccess, 
  onError,
  orderId  // ✅ Keep for logging
}) => {
  const stripe = useStripe();
  const elements = useElements();

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [error, setError] = useState(null);

  // ✅ Only check for missing orderId when clientSecret is set
  if (!clientSecret) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <span className="text-sm text-gray-600 dark:text-gray-400">Preparing payment...</span>
      </div>
    );
  }

  // ✅ If we have clientSecret but no orderId, it's fine for payment
  if (clientSecret && !orderId) {
    console.log('ℹ️ Payment initialized without orderId (clientSecret exists)');
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);
    setError(null);

    try {
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/orders`,
          payment_method_data: {
            billing_details: {
              name: 'Customer',
              email: 'customer@example.com',
            },
          },
        },
        redirect: 'if_required',
      });

      if (stripeError) {
        setError(stripeError.message);
        setPaymentStatus('failed');
        onError?.(stripeError.message);
      } else if (paymentIntent?.status === 'succeeded') {
        setPaymentStatus('succeeded');
        onSuccess?.(paymentIntent);
      }
    } catch (err) {
      setError(err.message);
      setPaymentStatus('failed');
      onError?.(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (paymentStatus === 'succeeded') {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Payment Successful!</h3>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Your payment has been confirmed.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Payment Failed</h3>
        <p className="text-gray-600 dark:text-gray-400 mt-2">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
        <PaymentElement />
      </div>

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Processing...
          </span>
        ) : (
          `Pay $${amount?.toFixed(2) || '0.00'}`
        )}
      </button>

      <p className="text-xs text-center text-gray-500 dark:text-gray-400">
        🔒 Your payment is secure with Stripe
      </p>
    </form>
  );
};

export default StripePayment;