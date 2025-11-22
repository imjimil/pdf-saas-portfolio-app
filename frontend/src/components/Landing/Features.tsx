import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const features = [
  {
    title: 'PDF to Word',
    description: 'Convert your PDF documents to editable Word files instantly.',
    icon: '📄',
    path: '/pdf-to-word',
  },
  {
    title: 'Word to PDF',
    description: 'Convert Word documents to PDF format with perfect formatting.',
    icon: '📝',
    path: '/word-to-pdf',
  },
  {
    title: 'Image to PDF',
    description: 'Transform your images into professional PDF documents.',
    icon: '🖼️',
    path: '/image-to-pdf',
  },
  {
    title: 'Split PDF',
    description: 'Extract pages or split your PDF into multiple files.',
    icon: '✂️',
    path: '/split-pdf',
  },
  {
    title: 'Merge PDF',
    description: 'Combine multiple PDF files into one document.',
    icon: '🔗',
    path: '/merge-pdf',
  },
  {
    title: 'Compress PDF',
    description: 'Reduce PDF file size without losing quality.',
    icon: '🗜️',
    path: '/compress-pdf',
  },
  {
    title: 'PDF to Text',
    description: 'Extract text content from PDF files quickly and accurately.',
    icon: '📝',
    path: '/pdf-to-text',
  },
  {
    title: 'PDF to EPUB',
    description: 'Convert PDFs to EPUB format for e-readers and devices.',
    icon: '📚',
    path: '/pdf-to-epub',
  },
  {
    title: 'OCR Technology',
    description: 'Extract text from scanned PDFs using advanced OCR.',
    icon: '👁️',
    path: '/pdf-ocr',
  },
  {
    title: 'Watermark PDF',
    description: 'Add text watermarks to protect and brand your documents.',
    icon: '💧',
    path: '/watermark-pdf',
  },
  {
    title: 'Protect PDF',
    description: 'Add password protection and control document permissions.',
    icon: '🔒',
    path: '/protect-pdf',
  },
];

const Features = () => {
  const navigate = useNavigate();

  const handleCardClick = (feature: typeof features[0]) => {
    navigate(feature.path);
  };

  const handleMoreClick = () => {
    navigate('/tools');
  };

  // Show 6 tools on mobile, 10 on desktop
  const mobileTools = features.slice(0, 6);
  const desktopTools = features.slice(0, 10);

  return (
    <section className="relative py-12 sm:py-20 bg-white dark:bg-gray-800 transition-colors overflow-hidden w-full">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5 dark:opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }} />
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Complete PDF Toolkit
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            All the tools you need to work with PDFs. Convert, merge, split, protect, and more - all in one place.
          </p>
        </motion.div>

        {/* Mobile: Show 6 tools */}
        <div className="md:hidden">
          <div className="grid grid-cols-2 gap-4">
            {mobileTools.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                onClick={() => handleCardClick(feature)}
                className="bg-cream-light dark:bg-gray-700 p-4 rounded-lg hover:shadow-xl transition-all border border-gray-200 dark:border-gray-600 cursor-pointer hover:border-green-primary dark:hover:border-green-light relative overflow-hidden group flex flex-col"
              >
                {/* Hover effect gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-primary/5 to-transparent dark:from-green-light/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative z-10 flex-1 flex flex-col">
                  <motion.div
                    className="text-2xl mb-2 flex-shrink-0"
                    whileHover={{ scale: 1.2, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    {feature.icon}
                  </motion.div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 flex-1">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
          {/* More button for mobile */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mt-6 text-center"
          >
            <button
              onClick={handleMoreClick}
              className="px-6 py-3 bg-green-primary dark:bg-green-dark text-white rounded-lg font-semibold hover:bg-green-dark dark:hover:bg-green-primary transition shadow-md hover:shadow-lg"
            >
              View All Tools
            </button>
          </motion.div>
        </div>

        {/* Desktop: Show 10 tools */}
        <div className="hidden md:block">
          <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {desktopTools.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                onClick={() => handleCardClick(feature)}
                className="bg-cream-light dark:bg-gray-700 p-4 md:p-5 rounded-lg hover:shadow-xl transition-all border border-gray-200 dark:border-gray-600 cursor-pointer hover:border-green-primary dark:hover:border-green-light relative overflow-hidden group flex flex-col"
              >
                {/* Hover effect gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-primary/5 to-transparent dark:from-green-light/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative z-10 flex-1 flex flex-col">
                  <motion.div
                    className="text-2xl md:text-3xl mb-2 flex-shrink-0"
                    whileHover={{ scale: 1.2, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    {feature.icon}
                  </motion.div>
                  <h3 className="text-sm md:text-base font-semibold text-gray-900 dark:text-white mb-1 md:mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 line-clamp-2 flex-1">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
          {/* More button for desktop */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 1.0 }}
            className="mt-8 text-center"
          >
            <button
              onClick={handleMoreClick}
              className="px-8 py-3 bg-green-primary dark:bg-green-dark text-white rounded-lg font-semibold hover:bg-green-dark dark:hover:bg-green-primary transition shadow-md hover:shadow-lg"
            >
              View All Tools
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Features;

