import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  // If on home page, don't show breadcrumbs
  if (pathnames.length === 0) {
    return null;
  }

  // Skip breadcrumbs for certain paths
  const skipPaths = ['login', 'register', '404', 'admin', 'seller'];
  if (skipPaths.some(path => pathnames.includes(path))) {
    return null;
  }

  // Generate breadcrumb items
  const breadcrumbs = pathnames.map((name, index) => {
    const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
    const isLast = index === pathnames.length - 1;

    // Format display name
    let displayName = name
      .replace(/-/g, ' ')
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    // Special case for IDs (product IDs, order IDs, etc.)
    if (name.length === 24 && /^[0-9a-fA-F]{24}$/.test(name)) {
      displayName = `#${name.slice(-6)}`;
    }

    return {
      name: displayName,
      path: routeTo,
      isLast,
    };
  });

  // If only one item, show it as a link
  if (breadcrumbs.length === 1) {
    const { name, path } = breadcrumbs[0];
    return (
      <nav className="flex items-center text-sm text-gray-600 dark:text-gray-400" aria-label="Breadcrumb">
        <Link
          to="/"
          className="flex items-center hover:text-navy-600 dark:hover:text-navy-400 transition-colors"
        >
          <Home className="h-4 w-4" />
        </Link>
        <ChevronRight className="h-4 w-4 mx-1 text-gray-400 dark:text-gray-600" />
        <Link
          to={path}
          className="text-navy-600 dark:text-navy-400 font-medium hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
        >
          {name}
        </Link>
      </nav>
    );
  }

  return (
    <nav className="flex items-center text-sm text-gray-600 dark:text-gray-400 flex-wrap" aria-label="Breadcrumb">
      {/* Home */}
      <Link
        to="/"
        className="flex items-center hover:text-navy-600 dark:hover:text-navy-400 transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>

      {/* Breadcrumb items */}
      {breadcrumbs.map(({ name, path, isLast }) => (
        <React.Fragment key={path}>
          <ChevronRight className="h-4 w-4 mx-1 text-gray-400 dark:text-gray-600" />
          {isLast ? (
            <span className="text-navy-600 dark:text-navy-400 font-medium">
              {name}
            </span>
          ) : (
            <Link
              to={path}
              className="hover:text-navy-600 dark:hover:text-navy-400 hover:underline transition-colors"
            >
              {name}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumbs;