import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleDarkMode } from '../../store/slices/themeSlice';
import { Moon, Sun } from 'lucide-react';

const DarkModeToggle = () => {
  const dispatch = useDispatch();
  const { darkMode } = useSelector((state) => state.theme);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <button
      onClick={() => dispatch(toggleDarkMode())}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      aria-label="Toggle dark mode"
    >
      {darkMode ? (
        <Sun className="h-5 w-5 text-yellow-400" />
      ) : (
        <Moon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
      )}
    </button>
  );
};

export default DarkModeToggle;