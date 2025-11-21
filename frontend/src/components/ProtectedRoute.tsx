import { useAuth } from '../hooks/useAuth';
import { useUsageTracking } from '../hooks/useUsageTracking';
import UsagePrompt from './UsagePrompt';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, loading } = useAuth();
  const { showPrompt } = useUsageTracking();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-light dark:bg-gray-900">
        <div className="text-green-primary dark:text-green-light">Loading...</div>
      </div>
    );
  }

  // Allow guest access - no redirect to login
  // Show prompt if they've used 3+ times without account
  return (
    <>
      {children}
      {!isAuthenticated && showPrompt && <UsagePrompt />}
    </>
  );
};

export default ProtectedRoute;

