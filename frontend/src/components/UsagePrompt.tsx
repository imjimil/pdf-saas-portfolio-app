import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUsageTracking } from '../hooks/useUsageTracking';
import { useDarkMode } from '../contexts/DarkModeContext';

const UsagePrompt = () => {
  const navigate = useNavigate();
  const { maxGuestUses, resetUsage } = useUsageTracking();
  const { isDark } = useDarkMode();
  const [isVisible, setIsVisible] = useState(true);

  const handleRegister = () => {
    setIsVisible(false);
    navigate('/register');
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Don't reset usage, user can still use but will see prompt again on next page load
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 ${
        isDark ? 'border border-gray-700' : ''
      }`}>
        <div className="text-center">
          <div className="text-4xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            You've used our service {maxGuestUses} times!
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Create a free account to continue using all features without limits.
          </p>
          
          <div className="space-y-3">
            <button
              onClick={handleRegister}
              className="w-full px-6 py-3 bg-green-primary text-white rounded-lg hover:bg-green-dark transition font-semibold"
            >
              Create Free Account
            </button>
            <button
              onClick={handleDismiss}
              className="w-full px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsagePrompt;

