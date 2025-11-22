import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { motion } from 'framer-motion';

interface Tool {
  name: string;
  description: string;
  icon: string;
  path: string;
  endpoint?: string;
  color: string;
}

const Tools = () => {
  const navigate = useNavigate();

  const tools: Tool[] = [
    {
      name: 'PDF to Word',
      description: 'Convert PDF to editable Word document',
      icon: '📄',
      path: '/dashboard',
      endpoint: 'word',
      color: 'from-blue-500 to-blue-600',
    },
    {
      name: 'Image to PDF',
      description: 'Convert images to PDF format',
      icon: '🖼️',
      path: '/dashboard',
      endpoint: 'pdf',
      color: 'from-purple-500 to-purple-600',
    },
    {
      name: 'Split PDF',
      description: 'Split PDF into multiple files by pages',
      icon: '✂️',
      path: '/split-pdf',
      color: 'from-red-500 to-red-600',
    },
    {
      name: 'Merge PDF',
      description: 'Combine multiple PDFs into one',
      icon: '🔗',
      path: '/merge-pdf',
      color: 'from-green-500 to-green-600',
    },
    {
      name: 'Compress PDF',
      description: 'Reduce PDF file size',
      icon: '🗜️',
      path: '/dashboard',
      endpoint: 'compress',
      color: 'from-orange-500 to-orange-600',
    },
    {
      name: 'PDF to Text',
      description: 'Extract text from PDF',
      icon: '📝',
      path: '/dashboard',
      endpoint: 'txt',
      color: 'from-indigo-500 to-indigo-600',
    },
    {
      name: 'PDF to EPUB',
      description: 'Convert PDF to EPUB format',
      icon: '📚',
      path: '/dashboard',
      endpoint: 'epub',
      color: 'from-pink-500 to-pink-600',
    },
    {
      name: 'PDF OCR',
      description: 'Extract text using OCR technology',
      icon: '👁️',
      path: '/dashboard',
      endpoint: 'ocr',
      color: 'from-teal-500 to-teal-600',
    },
    {
      name: 'Watermark PDF',
      description: 'Add watermark to PDF documents',
      icon: '💧',
      path: '/watermark-pdf',
      color: 'from-cyan-500 to-cyan-600',
    },
    {
      name: 'Protect PDF',
      description: 'Add password protection to PDF',
      icon: '🔒',
      path: '/protect-pdf',
      color: 'from-yellow-500 to-yellow-600',
    },
  ];

  const handleToolClick = (tool: Tool) => {
    if (tool.endpoint) {
      navigate(tool.path, { state: { selectedEndpoint: tool.endpoint } });
    } else {
      navigate(tool.path);
    }
  };

  return (
    <div className="min-h-screen bg-cream-light dark:bg-gray-900 transition-colors">
      <Navigation showAuth={true} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            All PDF Tools
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Choose a tool to get started. All tools are free to use and process your files instantly.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {tools.map((tool, index) => (
            <motion.div
              key={tool.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleToolClick(tool)}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-all cursor-pointer border border-gray-200 dark:border-gray-700 overflow-hidden group"
            >
              <div className={`h-2 bg-gradient-to-r ${tool.color}`} />
              <div className="p-6">
                <div className="flex items-center gap-4 mb-3">
                  <div className="text-4xl group-hover:scale-110 transition-transform">
                    {tool.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {tool.name}
                  </h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {tool.description}
                </p>
                <div className="mt-4 flex items-center text-green-primary dark:text-green-light text-sm font-medium">
                  <span>Use Tool</span>
                  <svg
                    className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Tools;

