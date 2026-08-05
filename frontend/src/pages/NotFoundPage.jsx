import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="text-center max-w-md">
        <h1 className="text-9xl font-bold text-indigo-600 dark:text-indigo-400">404</h1>
        <h2 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">Page Not Found</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Oops! The page you're looking for doesn't exist.
        </p>
        <Link
          to="/"
          className="mt-6 inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Go Back Home
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;