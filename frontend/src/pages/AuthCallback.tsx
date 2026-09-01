import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { toast } from '../components/ui/Toast';
import { useAuth } from '../contexts/AuthContext';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  // Strict mode runs effects twice; the redirect must only happen once.
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const error = searchParams.get('error');
    const token = searchParams.get('token');
    const email = searchParams.get('email');
    const id = searchParams.get('id') ?? searchParams.get('userId');

    if (error) {
      toast.error('Google sign-in failed', error);
      navigate('/login', { replace: true });
      return;
    }

    if (!token || !email) {
      toast.error(
        'Google sign-in failed',
        'The sign-in link was incomplete. Please try again.'
      );
      navigate('/login', { replace: true });
      return;
    }

    // The callback does not always carry a user id; the email identifies the
    // account just as well and stays stable across sessions.
    login({ id: id ?? email, email }, token);
    toast.success('Signed in', email);
    navigate('/tools', { replace: true });
  }, [searchParams, navigate, login]);

  return (
    <AppShell>
      <div
        role="status"
        className="grid min-h-[60vh] place-items-center px-4 text-center"
      >
        <div>
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-brand-600" aria-hidden />
          <p className="mt-4 text-[15px] font-medium text-ink dark:text-sand-100">
            Finishing sign-in
          </p>
          <p className="mt-1 text-[14px] text-muted">This only takes a second.</p>
        </div>
      </div>
    </AppShell>
  );
}
