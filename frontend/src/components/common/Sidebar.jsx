import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  X, 
  ChevronDown, 
  ChevronRight,
  Home,
  ShoppingBag,
  Users,
  Package,
  Settings,
  LogOut,
  Menu
} from 'lucide-react';

const Sidebar = ({
  isOpen,
  onClose,
  items = [],
  title = 'Menu',
  variant = 'default', // 'default' | 'admin' | 'seller'
  onLogout,
}) => {
  const [expandedItems, setExpandedItems] = useState({});

  // Close sidebar on ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Toggle expanded state for sub-items
  const toggleExpanded = (label) => {
    setExpandedItems((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  // Default navigation items if none provided
  const defaultItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Shop', path: '/shop', icon: ShoppingBag },
    { label: 'Cart', path: '/cart', icon: Package },
    { label: 'Profile', path: '/profile', icon: Users },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const navItems = items.length > 0 ? items : defaultItems;

  const variantClasses = {
    default: 'bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700',
    admin: 'bg-navy-500 dark:bg-navy-700 text-white',
    seller: 'bg-navy-500 dark:bg-navy-700 text-white',
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-72 z-50 transform transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:w-64
          ${variantClasses[variant]}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isExpanded = expandedItems[item.label];

              if (item.children) {
                return (
                  <li key={item.label}>
                    <button
                      onClick={() => toggleExpanded(item.label)}
                      className="flex items-center justify-between w-full px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {Icon && <Icon className="h-5 w-5" />}
                        <span>{item.label}</span>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    {isExpanded && (
                      <ul className="ml-6 mt-1 space-y-1">
                        {item.children.map((child) => (
                          <li key={child.path}>
                            <NavLink
                              to={child.path}
                              className={({ isActive }) =>
                                `block px-3 py-2 rounded-lg transition-colors ${
                                  isActive
                                    ? 'bg-orange-500 text-white'
                                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`
                              }
                              onClick={onClose}
                            >
                              {child.label}
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              }

              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-orange-500 text-white'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`
                    }
                    onClick={onClose}
                  >
                    {Icon && <Icon className="h-5 w-5" />}
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        {onLogout && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <button
              onClick={onLogout}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;