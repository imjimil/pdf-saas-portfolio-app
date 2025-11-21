const Footer = () => {
  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold text-green-primary dark:text-green-light mb-4">Mypdftools</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Powerful PDF tools for all your document needs.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Features</h4>
            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
              <li>PDF to Word</li>
              <li>Image to PDF</li>
              <li>Split PDF</li>
              <li>OCR</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Company</h4>
            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
              <li>About</li>
              <li>Contact</li>
              <li>Privacy</li>
              <li>Terms</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Connect</h4>
            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
              <li>GitHub</li>
              <li>Twitter</li>
              <li>LinkedIn</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700 text-center text-gray-600 dark:text-gray-300">
          <p>&copy; 2024 Mypdftools. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

