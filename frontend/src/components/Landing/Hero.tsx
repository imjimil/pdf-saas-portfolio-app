import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <section className="relative bg-cream-light dark:bg-gray-900 py-20 lg:py-32 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Transform Your PDFs with
            <span className="text-green-primary dark:text-green-light block">Ease & Precision</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Convert, split, merge, and extract text from PDFs. Powerful tools
            for all your document needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="px-8 py-4 bg-green-primary dark:bg-green-dark text-white rounded-lg text-lg font-semibold hover:bg-green-dark dark:hover:bg-green-primary transition shadow-lg hover:shadow-xl"
            >
              Get Started Free
            </Link>
            <Link
              to="/dashboard"
              className="px-8 py-4 bg-white dark:bg-gray-800 text-green-primary dark:text-green-light rounded-lg text-lg font-semibold border-2 border-green-primary dark:border-green-light hover:bg-cream-base dark:hover:bg-gray-700 transition"
            >
              Try Demo
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;

