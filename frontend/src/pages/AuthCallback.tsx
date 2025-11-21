import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const email = searchParams.get('email');
    const error = searchParams.get('error');

    if (error) {
      navigate(`/login?error=${encodeURIComponent(error)}`);
      return;
    }

    if (token && email) {
      login({ email }, token);
      navigate('/dashboard');
    } else {
      navigate('/login?error=Authentication failed');
    }
  }, [searchParams, navigate, login]);

  return (
    <div className="min-h-screen bg-cream-light dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="text-green-primary dark:text-green-light text-2xl mb-4">Loading...</div>
        <p className="text-gray-600 dark:text-gray-300">Completing authentication...</p>
      </div>
    </div>
  );
};

export default AuthCallback;

