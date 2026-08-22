import React from 'react';
import { X, AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react';

const ErrorMessage = ({ 
  error, 
  onClear,
  variant = 'error', // 'error' | 'warning' | 'info' | 'success'
  title,
  className = '',
  showIcon = true,
  dismissible = true,
}) => {
  if (!error) return null;

  // Variant configurations
  const variants = {
    error: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-700 dark:text-red-300',
      subText: 'text-red-600 dark:text-red-400',
      icon: AlertCircle,
      iconColor: 'text-red-500 dark:text-red-400',
      title: title || 'Error',
    },
    warning: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      text: 'text-yellow-700 dark:text-yellow-300',
      subText: 'text-yellow-600 dark:text-yellow-400',
      icon: AlertTriangle,
      iconColor: 'text-yellow-500 dark:text-yellow-400',
      title: title || 'Warning',
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-700 dark:text-blue-300',
      subText: 'text-blue-600 dark:text-blue-400',
      icon: Info,
      iconColor: 'text-blue-500 dark:text-blue-400',
      title: title || 'Information',
    },
    success: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-700 dark:text-green-300',
      subText: 'text-green-600 dark:text-green-400',
      icon: CheckCircle,
      iconColor: 'text-green-500 dark:text-green-400',
      title: title || 'Success',
    },
  };

  const style = variants[variant] || variants.error;
  const IconComponent = style.icon;

  // Check for specific error types
  const isAuthError = typeof error === 'string' && error.toLowerCase().includes('not authorized');
  const isNetworkError = typeof error === 'string' && error.toLowerCase().includes('network');
  const isValidationError = typeof error === 'string' && error.toLowerCase().includes('validation');

  // Get help text based on error type
  const getHelpText = () => {
    if (isAuthError) {
      return 'You may not have permission to perform this action. Please check your credentials or contact support.';
    }
    if (isNetworkError) {
      return 'Please check your internet connection and try again.';
    }
    if (isValidationError) {
      return 'Please review your input and try again.';
    }
    return null;
  };

  const helpText = getHelpText();

  return (
    <div 
      className={`
        ${style.bg} ${style.border} border rounded-lg p-4 mb-4 
        transition-all duration-200
        ${className}
      `}
      role="alert"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        {showIcon && (
          <div className={`flex-shrink-0 mt-0.5 ${style.iconColor}`}>
            <IconComponent className="h-5 w-5" />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`font-medium ${style.text}`}>
            {style.title}
          </p>
          <p className={`text-sm mt-1 ${style.subText}`}>
            {error}
          </p>
          
          {/* Help text for specific errors */}
          {helpText && (
            <div className={`
              mt-2 p-3 rounded border 
              ${style.bg} ${style.border} ${style.subText}
            `}>
              <p className="text-sm font-medium">
                💡 Quick Tip:
              </p>
              <p className="text-xs mt-1">
                {helpText}
              </p>
            </div>
          )}

          {/* Action buttons for auth errors */}
          {isAuthError && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button 
                onClick={() => window.location.reload()}
                className="px-3 py-1 text-sm bg-red-100 dark:bg-red-800/50 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800/70 transition-colors"
              >
                Refresh Page
              </button>
              <button 
                onClick={() => window.location.href = '/login'}
                className="px-3 py-1 text-sm bg-navy-100 dark:bg-navy-800/50 text-navy-700 dark:text-navy-300 rounded hover:bg-navy-200 dark:hover:bg-navy-800/70 transition-colors"
              >
                Go to Login
              </button>
            </div>
          )}
        </div>

        {/* Dismiss Button */}
        {dismissible && onClear && (
          <button
            onClick={onClear}
            className={`flex-shrink-0 ${style.subText} hover:${style.text} transition-colors`}
            aria-label="Dismiss error"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;