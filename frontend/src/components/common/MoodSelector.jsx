import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setMood } from '../../store/slices/themeSlice';
import { Sparkles, Leaf, Sun, Moon, Flame, Crown } from 'lucide-react';

const moods = [
  { id: 'default', label: 'Default', icon: Sparkles, color: 'bg-gray-500' },
  { id: 'calm', label: 'Calm', icon: Leaf, color: 'bg-emerald-500' },
  { id: 'energetic', label: 'Energetic', icon: Flame, color: 'bg-orange-500' },
  { id: 'luxury', label: 'Luxury', icon: Crown, color: 'bg-amber-600' },
  { id: 'dark', label: 'Dark', icon: Moon, color: 'bg-purple-600' },
  { id: 'light', label: 'Light', icon: Sun, color: 'bg-sky-500' },
];

const MoodSelector = () => {
  const dispatch = useDispatch();
  const { mood } = useSelector((state) => state.theme);

  const handleMoodChange = (selectedMood) => {
    dispatch(setMood(selectedMood));
    // Apply mood-based theme
    applyMoodTheme(selectedMood);
  };

  const applyMoodTheme = (moodId) => {
    const root = document.documentElement;
    
    // Remove existing mood classes
    moods.forEach(m => root.classList.remove(`mood-${m.id}`));
    
    // Add new mood class
    root.classList.add(`mood-${moodId}`);
    
    // Apply mood-specific styles
    const moodStyles = {
      calm: {
        '--primary': '16, 185, 129',
        '--primary-dark': '5, 150, 105',
        '--bg-gradient': 'from-emerald-50 to-teal-50',
      },
      energetic: {
        '--primary': '249, 115, 22',
        '--primary-dark': '234, 88, 12',
        '--bg-gradient': 'from-orange-50 to-rose-50',
      },
      luxury: {
        '--primary': '217, 119, 6',
        '--primary-dark': '180, 83, 9',
        '--bg-gradient': 'from-amber-50 to-yellow-50',
      },
      dark: {
        '--primary': '139, 92, 246',
        '--primary-dark': '124, 58, 237',
        '--bg-gradient': 'from-gray-900 to-gray-800',
      },
      light: {
        '--primary': '14, 165, 233',
        '--primary-dark': '2, 132, 199',
        '--bg-gradient': 'from-sky-50 to-blue-50',
      },
      default: {
        '--primary': '79, 70, 229',
        '--primary-dark': '67, 56, 202',
        '--bg-gradient': 'from-gray-50 to-gray-100',
      },
    };

    const styles = moodStyles[moodId] || moodStyles.default;
    Object.entries(styles).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  };

  return (
    <div className="flex items-center gap-2 p-2">
      {moods.map((m) => {
        const Icon = m.icon;
        const isActive = mood === m.id;
        return (
          <button
            key={m.id}
            onClick={() => handleMoodChange(m.id)}
            className={`p-2 rounded-full transition-all duration-200 ${
              isActive
                ? `${m.color} text-white scale-110 shadow-lg`
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:scale-105'
            }`}
            title={m.label}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
};

export default MoodSelector;