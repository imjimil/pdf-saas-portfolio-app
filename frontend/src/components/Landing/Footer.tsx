import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold text-green-primary dark:text-green-light mb-4">Mypdftools</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Professional PDF tools for all your document needs. Fast, secure, and free.
            </p>
            <div className="flex gap-2">
              <div className="w-8 h-8 bg-green-primary/10 dark:bg-green-light/10 rounded-lg flex items-center justify-center text-green-primary dark:text-green-light">
                🔒
              </div>
              <div className="w-8 h-8 bg-green-primary/10 dark:bg-green-light/10 rounded-lg flex items-center justify-center text-green-primary dark:text-green-light">
                ⚡
              </div>
              <div className="w-8 h-8 bg-green-primary/10 dark:bg-green-light/10 rounded-lg flex items-center justify-center text-green-primary dark:text-green-light">
                🆓
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Tools</h4>
            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
              <li><Link to="/tools" className="hover:text-green-primary dark:hover:text-green-light transition">All Tools</Link></li>
              <li>PDF Conversion</li>
              <li>PDF Editing</li>
              <li>PDF Protection</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Account</h4>
            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
              <li><Link to="/register" className="hover:text-green-primary dark:hover:text-green-light transition">Sign Up</Link></li>
              <li><Link to="/login" className="hover:text-green-primary dark:hover:text-green-light transition">Login</Link></li>
              <li>File History</li>
              <li>Usage Analytics</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Security</h4>
            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
              <li><Link to="/privacy" className="hover:text-green-primary dark:hover:text-green-light transition">Privacy Policy</Link></li>
              <li>Data Protection</li>
              <li>SSL Encryption</li>
              <li>No Data Storage</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              &copy; 2024 Mypdftools. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-gray-600 dark:text-gray-300">
              <Link to="/privacy" className="hover:text-green-primary dark:hover:text-green-light transition">Privacy</Link>
              <span className="hover:text-green-primary dark:hover:text-green-light transition cursor-pointer">Terms</span>
              <span className="hover:text-green-primary dark:hover:text-green-light transition cursor-pointer">Contact</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

