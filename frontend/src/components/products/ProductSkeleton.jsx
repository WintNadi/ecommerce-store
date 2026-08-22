import React from 'react';

const ProductSkeleton = ({ 
  variant = 'grid', // 'grid' | 'list' | 'carousel'
  count = 1,
  className = '',
  showRating = true,
  showPrice = true,
  showButton = true,
}) => {
  // Grid Skeleton
  const GridSkeleton = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700 animate-pulse">
      {/* Image */}
      <div className="aspect-square bg-gray-200 dark:bg-gray-700" />
      
      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        
        {/* Rating */}
        {showRating && (
          <div className="flex items-center gap-2">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-8" />
          </div>
        )}
        
        {/* Price */}
        {showPrice && (
          <div className="flex items-center gap-2">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16" />
            {Math.random() > 0.5 && (
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12" />
            )}
          </div>
        )}
        
        {/* Button */}
        {showButton && (
          <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded w-full mt-2" />
        )}
      </div>
    </div>
  );

  // List Skeleton
  const ListSkeleton = () => (
    <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700 animate-pulse">
      {/* Image */}
      <div className="sm:w-48 lg:w-56 flex-shrink-0">
        <div className="aspect-square sm:aspect-auto sm:h-48 bg-gray-200 dark:bg-gray-700" />
      </div>
      
      {/* Content */}
      <div className="flex-1 p-4 space-y-3">
        {/* Title */}
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        
        {/* Rating */}
        {showRating && (
          <div className="flex items-center gap-2">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-10" />
          </div>
        )}
        
        {/* Description */}
        <div className="space-y-1.5">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/6" />
        </div>
        
        {/* Price */}
        {showPrice && (
          <div className="flex items-center gap-2">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-20" />
            {Math.random() > 0.5 && (
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-14" />
            )}
          </div>
        )}
        
        {/* Stock Status */}
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28" />
        
        {/* Buttons */}
        {showButton && (
          <div className="flex items-center gap-2 mt-2">
            <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded w-9" />
            <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded w-9" />
            <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded flex-1" />
          </div>
        )}
      </div>
    </div>
  );

  // Carousel Skeleton (for product carousels)
  const CarouselSkeleton = () => (
    <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700 animate-pulse">
      {/* Image */}
      <div className="aspect-[16/9] bg-gray-200 dark:bg-gray-700" />
      
      {/* Content overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
        <div className="space-y-2">
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-3/4" />
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2" />
          <div className="flex items-center gap-2">
            <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-20" />
            <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-24" />
          </div>
        </div>
      </div>
    </div>
  );

  // Choose skeleton variant
  const renderSkeleton = () => {
    switch (variant) {
      case 'list':
        return <ListSkeleton />;
      case 'carousel':
        return <CarouselSkeleton />;
      default:
        return <GridSkeleton />;
    }
  };

  // Render multiple skeletons if count > 1
  if (count > 1) {
    const gridClasses = {
      grid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4',
      list: 'space-y-4',
      carousel: 'flex gap-4 overflow-x-auto',
    };

    return (
      <div className={`${gridClasses[variant] || gridClasses.grid} ${className}`}>
        {Array.from({ length: count }).map((_, index) => (
          <div key={index}>
            {renderSkeleton()}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={className}>
      {renderSkeleton()}
    </div>
  );
};

export default ProductSkeleton;