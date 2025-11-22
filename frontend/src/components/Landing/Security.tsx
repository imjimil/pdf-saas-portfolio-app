import { motion } from 'framer-motion';

const securityFeatures = [
  {
    icon: '🛡️',
    title: 'Secure Processing',
    description: 'All files are processed securely and automatically deleted after processing. Your documents never leave our secure servers.',
  },
  {
    icon: '🔒',
    title: 'Privacy Protected',
    description: 'We never store, share, or access your files. Your documents remain completely private and confidential.',
  },
  {
    icon: '👁️',
    title: 'No Tracking',
    description: 'We don\'t track your usage or collect personal data. Your privacy is our top priority.',
  },
  {
    icon: '🔐',
    title: 'Encrypted Transfer',
    description: 'All file uploads and downloads use SSL encryption to ensure your data stays safe in transit.',
  },
];

const Security = () => {
  return (
    <section className="relative py-12 sm:py-20 bg-white dark:bg-gray-800 transition-colors overflow-hidden w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Your Documents Are Safe With Us
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            We take security and privacy seriously. Your files are processed securely and never stored.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {securityFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-cream-light dark:bg-gray-700 p-6 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-green-primary dark:hover:border-green-light transition-all"
            >
              <div className="w-12 h-12 bg-green-primary/10 dark:bg-green-light/10 rounded-lg flex items-center justify-center mb-4 text-2xl">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Security;

