import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useDarkMode } from '../contexts/DarkModeContext';

interface NavigationProps {
  showAuth?: boolean;
  showBack?: boolean;
  backPath?: string;
  backLabel?: string;
}

const tools = [
  { name: 'PDF to Word', icon: '📄', path: '/dashboard', endpoint: 'word' },
  { name: 'Image to PDF', icon: '🖼️', path: '/dashboard', endpoint: 'pdf' },
  { name: 'Split PDF', icon: '✂️', path: '/split-pdf' },
  { name: 'Merge PDF', icon: '🔗', path: '/merge-pdf' },
  { name: 'Compress PDF', icon: '🗜️', path: '/dashboard', endpoint: 'compress' },
  { name: 'PDF to Text', icon: '📝', path: '/dashboard', endpoint: 'txt' },
  { name: 'PDF to EPUB', icon: '📚', path: '/dashboard', endpoint: 'epub' },
  { name: 'PDF OCR', icon: '👁️', path: '/dashboard', endpoint: 'ocr' },
];

const Navigation = ({ 
  showAuth = true, 
  showBack = false, 
  backPath = '/dashboard',
  backLabel = 'Back to Dashboard'
}: NavigationProps) => {
  const { isAuthenticated, user, logout } = useAuth();
  const { isDark, toggleDarkMode } = useDarkMode();
  const navigate = useNavigate();
  const [toolsOpen, setToolsOpen] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolsRef.current && !toolsRef.current.contains(event.target as Node)) {
        setToolsOpen(false);
      }
    };

    if (toolsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [toolsOpen]);

  const handleToolClick = (tool: typeof tools[0]) => {
    setToolsOpen(false);
    if (tool.endpoint) {
      navigate(tool.path, { state: { selectedEndpoint: tool.endpoint } });
    } else {
      navigate(tool.path);
    }
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link 
              to="/" 
              className="text-2xl font-bold text-green-primary dark:text-green-light hover:text-green-dark dark:hover:text-green-primary transition"
            >
              My PDF Tools
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {/* Tools Dropdown */}
            <div className="relative" ref={toolsRef}>
              <button
                onClick={() => setToolsOpen(!toolsOpen)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition flex items-center gap-2"
              >
                <span>Tools</span>
                <svg
                  className={`w-4 h-4 transition-transform ${toolsOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {toolsOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 py-2">
                  {tools.map((tool) => (
                    <button
                      key={tool.name}
                      onClick={() => handleToolClick(tool)}
                      className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center gap-2"
                    >
                      <span className="text-lg">{tool.icon}</span>
                      <span>{tool.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {showBack && (
              <button
                onClick={() => navigate(backPath)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition"
              >
                {backLabel}
              </button>
            )}

            {showAuth && (
              <>
                {isAuthenticated ? (
                  <>
                    <span className="text-gray-600 dark:text-gray-300">{user?.email}</span>
                    <button
                      onClick={() => {
                        logout();
                        navigate('/');
                      }}
                      className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="px-4 py-2 text-green-primary dark:text-green-light hover:text-green-dark dark:hover:text-green-primary transition"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="px-4 py-2 bg-green-primary dark:bg-green-dark text-white rounded-lg hover:bg-green-dark dark:hover:bg-green-primary transition"
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;

