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
  { name: 'PDF to Word', icon: '📄', path: '/pdf-to-word' },
  { name: 'Image to PDF', icon: '🖼️', path: '/image-to-pdf' },
  { name: 'Split PDF', icon: '✂️', path: '/split-pdf' },
  { name: 'Merge PDF', icon: '🔗', path: '/merge-pdf' },
  { name: 'Compress PDF', icon: '🗜️', path: '/compress-pdf' },
  { name: 'PDF to Text', icon: '📝', path: '/pdf-to-text' },
  { name: 'PDF to EPUB', icon: '📚', path: '/pdf-to-epub' },
  { name: 'PDF OCR', icon: '👁️', path: '/pdf-ocr' },
  { name: 'Watermark PDF', icon: '💧', path: '/watermark-pdf' },
  { name: 'Protect PDF', icon: '🔒', path: '/protect-pdf' },
];

const Navigation = ({ 
  showAuth = true, 
  showBack = false, 
  backPath = '/tools',
  backLabel = 'Back to Tools'
}: NavigationProps) => {
  const { isAuthenticated, logout } = useAuth();
  const { isDark, toggleDarkMode } = useDarkMode();
  const navigate = useNavigate();
  const [toolsOpen, setToolsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside (desktop only)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolsRef.current && !toolsRef.current.contains(event.target as Node)) {
        // Only close if not clicking in mobile menu
        if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
          setToolsOpen(false);
        }
      }
    };

    if (toolsOpen && !mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [toolsOpen, mobileMenuOpen]);

  const handleToolClick = (tool: typeof tools[0], closeMobileMenu: boolean = false) => {
    // Close dropdowns first
    setToolsOpen(false);
    if (closeMobileMenu) {
      setMobileMenuOpen(false);
    }
    // Navigate immediately
    navigate(tool.path);
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link 
              to="/" 
              className="text-xl sm:text-2xl font-bold text-green-primary dark:text-green-light hover:text-green-dark dark:hover:text-green-primary transition"
            >
              My PDF Tools
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
            {/* Tools Dropdown */}
            <div className="relative" ref={toolsRef}>
              <div className="flex items-center">
                <Link
                  to="/tools"
                  className="px-3 lg:px-4 py-2 text-sm lg:text-base text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                >
                  Tools
                </Link>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setToolsOpen(!toolsOpen);
                  }}
                  className="px-2 py-2 text-sm lg:text-base text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition ml-1"
                >
                  <svg
                    className={`w-4 h-4 transition-transform ${toolsOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              
              {toolsOpen && (
                <div className="absolute right-0 mt-2 w-64 sm:w-72 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 py-2 max-h-96 overflow-y-auto">
                  <div className="grid grid-cols-2 sm:grid-cols-1 gap-1 px-2">
                    {tools.map((tool) => (
                      <button
                        key={tool.name}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleToolClick(tool, false);
                        }}
                        className="w-full text-left px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center gap-2 rounded"
                      >
                        <span className="text-base sm:text-lg flex-shrink-0">{tool.icon}</span>
                        <span className="text-xs sm:text-sm truncate">{tool.name}</span>
                      </button>
                    ))}
                  </div>
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
                className="px-3 lg:px-4 py-2 text-sm lg:text-base text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition"
              >
                {backLabel}
              </button>
            )}

            {showAuth && (
              <>
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/my-dashboard"
                      className="px-3 lg:px-4 py-2 text-sm lg:text-base text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition"
                    >
                      File History
                    </Link>
                    <Link
                      to="/profile"
                      className="px-3 lg:px-4 py-2 text-sm lg:text-base text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition"
                    >
                      Profile
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        navigate('/');
                      }}
                      className="px-3 lg:px-4 py-2 text-sm lg:text-base text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="px-3 lg:px-4 py-2 text-sm lg:text-base text-green-primary dark:text-green-light hover:text-green-dark dark:hover:text-green-primary transition"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="px-3 lg:px-4 py-2 text-sm lg:text-base bg-green-primary dark:bg-green-dark text-white rounded-lg hover:bg-green-dark dark:hover:bg-green-primary transition"
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
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
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div ref={mobileMenuRef} className="md:hidden border-t border-gray-200 dark:border-gray-700 py-4 space-y-2 z-50 relative bg-white dark:bg-gray-800">
            {showAuth && (
              <>
                {isAuthenticated ? (
                  <>
                    {/* Combined Tools Link and Dropdown */}
                    <div>
                      <div className="flex items-center px-4">
                        <Link
                          to="/tools"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex-1 px-0 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition"
                        >
                          Tools
                        </Link>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setToolsOpen(!toolsOpen);
                          }}
                          className="px-2 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition"
                        >
                          <svg
                            className={`w-4 h-4 transition-transform ${toolsOpen ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                      {toolsOpen && (
                        <div className="mt-2 px-4 grid grid-cols-2 gap-2">
                          {tools.map((tool) => (
                            <Link
                              key={tool.name}
                              to={tool.path}
                              onClick={() => {
                                setToolsOpen(false);
                                setMobileMenuOpen(false);
                              }}
                              className="block w-full text-left px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition flex items-center gap-2 touch-manipulation"
                            >
                              <span className="text-base flex-shrink-0">{tool.icon}</span>
                              <span className="text-xs truncate">{tool.name}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                    <Link
                      to="/my-dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                    >
                      File History
                    </Link>
                    <Link
                      to="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                    >
                      Profile
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        navigate('/');
                        setMobileMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2 text-green-primary dark:text-green-light hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2 bg-green-primary dark:bg-green-dark text-white rounded-lg hover:bg-green-dark dark:hover:bg-green-primary transition"
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;

