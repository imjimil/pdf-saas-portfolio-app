import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const features = [
  {
    title: 'PDF to Word',
    description: 'Convert your PDF documents to editable Word files instantly.',
    icon: '📄',
    path: '/dashboard',
    endpoint: 'word',
  },
  {
    title: 'Image to PDF',
    description: 'Transform your images into professional PDF documents.',
    icon: '🖼️',
    path: '/dashboard',
    endpoint: 'pdf',
  },
  {
    title: 'Split PDF',
    description: 'Extract pages or split your PDF into multiple files.',
    icon: '✂️',
    path: '/split-pdf',
  },
  {
    title: 'PDF to Text',
    description: 'Extract text content from PDF files quickly and accurately.',
    icon: '📝',
    path: '/dashboard',
    endpoint: 'txt',
  },
  {
    title: 'PDF to EPUB',
    description: 'Convert PDFs to EPUB format for e-readers and devices.',
    icon: '📚',
    path: '/dashboard',
    endpoint: 'epub',
  },
  {
    title: 'OCR Technology',
    description: 'Extract text from scanned PDFs using advanced OCR.',
    icon: '👁️',
    path: '/dashboard',
    endpoint: 'ocr',
  },
];

const Features = () => {
  const navigate = useNavigate();

  const handleCardClick = (feature: typeof features[0]) => {
    if (feature.endpoint) {
      navigate(feature.path, { state: { selectedEndpoint: feature.endpoint } });
    } else {
      navigate(feature.path);
    }
  };

  return (
    <section className="py-20 bg-white dark:bg-gray-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Everything You Need to Work with PDFs
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Powerful tools to convert, process, and extract content from your PDF documents.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              onClick={() => handleCardClick(feature)}
              className="bg-cream-light dark:bg-gray-700 p-6 rounded-lg hover:shadow-lg transition border border-gray-200 dark:border-gray-600 cursor-pointer hover:border-green-primary dark:hover:border-green-light transform hover:scale-105"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;

