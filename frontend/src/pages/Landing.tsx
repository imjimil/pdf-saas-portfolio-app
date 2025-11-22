import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Hero from '../components/Landing/Hero';
import Features from '../components/Landing/Features';
import HowItWorks from '../components/Landing/HowItWorks';
import Footer from '../components/Landing/Footer';
import { useAuth } from '../hooks/useAuth';

const Landing = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-cream-light dark:bg-gray-900 transition-colors">
      <Navigation showAuth={true} />

      <Hero isAuthenticated={isAuthenticated} />
      <Features />
      <HowItWorks />
      <Footer />
    </div>
  );
};

export default Landing;

