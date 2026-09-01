import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Gate for account-only screens (activity, profile).
 *
 * Tools themselves are intentionally public — requiring sign-up before someone
 * can try the product is the fastest way to lose them.
 */
export default function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="grid min-h-[100dvh] place-items-center" role="status" aria-label="Loading">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // `state.from` lets the login screen return the user where they intended.
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
