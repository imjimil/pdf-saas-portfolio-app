import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const benefits = [
  {
    icon: '📁',
    title: 'File History',
    description: 'Access all your processed files anytime. Never lose track of your documents.',
    accountOnly: true,
  },
  {
    icon: '📊',
    title: 'Usage Analytics',
    description: 'Track your PDF processing activity with detailed statistics and insights.',
    accountOnly: true,
  },
  {
    icon: '☁️',
    title: 'Cloud Storage',
    description: 'Your processed files are safely stored in your account for easy access.',
    accountOnly: true,
  },
  {
    icon: '⚡',
    title: 'Fast Processing',
    description: 'Lightning-fast PDF processing powered by advanced algorithms.',
    accountOnly: false,
  },
  {
    icon: '👥',
    title: 'Free to Use',
    description: 'Try all features for free. No credit card required to get started.',
    accountOnly: false,
  },
  {
    icon: '∞',
    title: 'Unlimited Access',
    description: 'Process as many files as you need. No hidden limits or restrictions.',
    accountOnly: false,
  },
];

const Benefits = () => {
  return (
    <section className="relative py-12 sm:py-20 bg-cream-light dark:bg-gray-900 transition-colors overflow-hidden w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Why Choose Mypdftools?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Powerful features, secure processing, and a seamless experience for all your PDF needs.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-primary/10 dark:bg-green-light/10 rounded-lg flex items-center justify-center flex-shrink-0 text-2xl">
                  {benefit.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {benefit.title}
                    </h3>
                    {benefit.accountOnly && (
                      <span className="text-xs bg-green-primary/10 dark:bg-green-light/10 text-green-primary dark:text-green-light px-2 py-1 rounded">
                        Account
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {benefit.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center"
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 border border-gray-200 dark:border-gray-700 max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Create Your Free Account
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Unlock file history, usage analytics, and cloud storage. All features are free to use.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="px-6 py-3 bg-green-primary dark:bg-green-dark text-white rounded-lg font-semibold hover:bg-green-dark dark:hover:bg-green-primary transition shadow-md hover:shadow-lg"
              >
                Sign Up Free
              </Link>
              <Link
                to="/tools"
                className="px-6 py-3 bg-white dark:bg-gray-700 text-green-primary dark:text-green-light rounded-lg font-semibold border-2 border-green-primary dark:border-green-light hover:bg-cream-base dark:hover:bg-gray-600 transition"
              >
                Try Without Account
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Benefits;

