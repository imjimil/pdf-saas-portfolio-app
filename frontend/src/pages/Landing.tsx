import Navigation from '../components/Navigation';
import Hero from '../components/Landing/Hero';
import Features from '../components/Landing/Features';
import Security from '../components/Landing/Security';
import Benefits from '../components/Landing/Benefits';
import HowItWorks from '../components/Landing/HowItWorks';
import Footer from '../components/Landing/Footer';
import { useAuth } from '../hooks/useAuth';

const Landing = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-cream-light dark:bg-gray-900 transition-colors w-full overflow-x-hidden">
      <Navigation showAuth={true} />

      <Hero isAuthenticated={isAuthenticated} />
      <Features />
      <Security />
      <Benefits />
      <HowItWorks />
      <Footer />
    </div>
  );
};

export default Landing;

