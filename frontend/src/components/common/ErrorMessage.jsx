import React from 'react';
import { X } from 'lucide-react';

const ErrorMessage = ({ error, onClear }) => {
  if (!error) return null;

  const isAuthError = error.includes('not authorized');

  return (
    <div className={`border rounded-lg p-4 mb-4 ${
      isAuthError 
        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        : 'bg-red-100 border-red-400 dark:bg-red-900/30 dark:border-red-700'
    }`}>
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <p className={`font-medium ${
            isAuthError 
              ? 'text-red-700 dark:text-red-300'
              : 'text-red-700 dark:text-red-300'
          }`}>
            {isAuthError ? '⚠️ Authorization Error' : 'Error'}
          </p>
          <p className="text-sm mt-1 text-red-600 dark:text-red-400">
            {error}
          </p>
          {isAuthError && (
            <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/30 rounded border border-red-200 dark:border-red-700">
              <p className="text-sm text-red-700 dark:text-red-300">
                You can only edit products that you have created.
              </p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                If you believe this is an error, please contact support.
              </p>
            </div>
          )}
        </div>
        <button
          onClick={onClear}
          className="text-red-500 hover:text-red-700 dark:text-red-400"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default ErrorMessage;