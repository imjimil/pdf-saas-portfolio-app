import { motion } from 'framer-motion';

const steps = [
  {
    number: '1',
    title: 'Upload Your File',
    description: 'Choose your PDF or image file and upload it securely.',
  },
  {
    number: '2',
    title: 'Choose Your Action',
    description: 'Select the conversion or processing option you need.',
  },
  {
    number: '3',
    title: 'Download Result',
    description: 'Get your processed file instantly, ready to use.',
  },
];

const HowItWorks = () => {
  return (
    <section className="relative py-12 sm:py-20 bg-cream-light dark:bg-gray-900 transition-colors overflow-hidden w-full">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 right-10 w-64 h-64 bg-green-primary/5 dark:bg-green-light/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
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
            How It Works
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Simple, fast, and secure. Get started in seconds.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              whileHover={{ y: -10 }}
              className="text-center relative"
            >
              {/* Connecting line between steps */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-green-primary/30 to-transparent" style={{ width: 'calc(100% - 4rem)' }} />
              )}
              
              <motion.div
                className="w-16 h-16 bg-gradient-to-br from-green-primary to-green-dark dark:from-green-light dark:to-green-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg relative z-10"
                whileHover={{ scale: 1.1, rotate: 360 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                {step.number}
              </motion.div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {step.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;

