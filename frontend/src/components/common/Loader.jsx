import React from 'react';

const Loader = ({ 
  size = 'md', 
  fullScreen = false, 
  text = 'Loading...',
  variant = 'spinner' // 'spinner' | 'dots' | 'pulse'
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6 border-2',
    md: 'h-10 w-10 border-3',
    lg: 'h-16 w-16 border-4',
    xl: 'h-24 w-24 border-4',
  };

  const renderLoader = () => {
    switch (variant) {
      case 'dots':
        return (
          <div className="flex space-x-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`${sizeClasses[size]} bg-orange-500 dark:bg-orange-400 rounded-full animate-bounce`}
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        );

      case 'pulse':
        return (
          <div className="flex flex-col items-center space-y-4">
            <div className={`${sizeClasses[size]} bg-navy-500 dark:bg-navy-400 rounded-lg animate-pulse`} />
            {text && <p className="text-gray-600 dark:text-gray-300 text-sm">{text}</p>}
          </div>
        );

      default: // spinner
        return (
          <div className="relative">
            <div
              className={`${sizeClasses[size]} border-t-orange-500 dark:border-t-orange-400 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin`}
            />
            {text && (
              <p className="mt-4 text-gray-600 dark:text-gray-300 text-sm font-medium">
                {text}
              </p>
            )}
          </div>
        );
    }
  };

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
        {renderLoader()}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 min-h-[200px]">
      {renderLoader()}
    </div>
  );
};

export default Loader;