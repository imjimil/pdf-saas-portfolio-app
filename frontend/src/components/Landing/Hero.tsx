import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface HeroProps {
  isAuthenticated?: boolean;
}

const Hero = ({ isAuthenticated = false }: HeroProps) => {
  return (
    <section className="relative bg-cream-light dark:bg-gray-900 py-12 sm:py-20 lg:py-32 transition-colors overflow-hidden w-full">
      {/* Abstract Background Art */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none w-full">
        {/* Animated gradient circles */}
        <motion.div
          className="absolute -top-40 -right-40 w-64 h-64 sm:w-96 sm:h-96 bg-green-primary/10 dark:bg-green-light/10 rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-64 h-64 sm:w-96 sm:h-96 bg-green-primary/10 dark:bg-green-light/10 rounded-full blur-3xl"
          animate={{
            x: [0, -50, 0],
            y: [0, -30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        {/* Geometric shapes */}
        <motion.div
          className="absolute top-20 left-4 sm:left-10 w-24 h-24 sm:w-32 sm:h-32 border-4 border-green-primary/20 dark:border-green-light/20 rounded-lg rotate-45"
          animate={{
            rotate: [45, 405, 45],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <motion.div
          className="absolute bottom-20 right-4 sm:right-10 w-16 h-16 sm:w-24 sm:h-24 border-4 border-green-primary/20 dark:border-green-light/20 rounded-full"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-green-primary/30 dark:bg-green-light/30 rounded-full"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + (i % 3) * 20}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.3,
            }}
          />
        ))}
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6"
          >
            Transform Your PDFs with
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-green-primary dark:text-green-light block bg-gradient-to-r from-green-primary to-green-dark dark:from-green-light dark:to-green-primary bg-clip-text text-transparent"
            >
              Ease & Precision
            </motion.span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto"
          >
            Convert, split, merge, and extract text from PDFs. Powerful tools
            for all your document needs.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to={isAuthenticated ? "/tools" : "/register"}
                className="px-8 py-4 bg-green-primary dark:bg-green-dark text-white rounded-lg text-lg font-semibold hover:bg-green-dark dark:hover:bg-green-primary transition shadow-lg hover:shadow-xl inline-block"
              >
                {isAuthenticated ? "Go to Dashboard" : "Get Started Free"}
              </Link>
            </motion.div>
            {!isAuthenticated && (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/dashboard"
                  className="px-8 py-4 bg-white dark:bg-gray-800 text-green-primary dark:text-green-light rounded-lg text-lg font-semibold border-2 border-green-primary dark:border-green-light hover:bg-cream-base dark:hover:bg-gray-700 transition inline-block"
                >
                  Try Demo
                </Link>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;

