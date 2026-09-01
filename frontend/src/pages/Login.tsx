import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Eye, EyeOff } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { Button } from '../components/ui/Button';
import { Logo } from '../components/ui/Logo';
import { toast } from '../components/ui/Toast';
import { useAuth } from '../contexts/AuthContext';
import { ApiError, authAPI } from '../services/api';

interface AuthResponse {
  token?: string;
  user?: { id: string; email: string; name?: string };
}

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || '/api';

const FIELD =
  'h-11 w-full rounded-xl border border-ink/[0.09] bg-white px-3.5 text-[15px] text-ink ' +
  'placeholder:text-ink-muted/70 transition-colors focus:border-brand-500 ' +
  'dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-sand-100 dark:placeholder:text-sand-500';

export default function Login() {
  const [formError, setFormError] = useState<{ message: string; hint?: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // RequireAuth stores the page the visitor was trying to reach.
  const from = (location.state as { from?: string } | null)?.from ?? '/tools';

  const formik = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema: Yup.object({
      email: Yup.string().email('Enter a valid email address').required('Email is required'),
      password: Yup.string().required('Password is required'),
    }),
    onSubmit: async (values) => {
      setFormError(null);
      try {
        const response: AuthResponse = await authAPI.login(values.email, values.password);

        if (!response?.token || !response?.user) {
          setFormError({ message: 'The server sent back an unexpected response.' });
          toast.error('Could not sign you in', 'Please try again in a moment.');
          return;
        }

        login(response.user, response.token);
        toast.success('Signed in');
        navigate(from, { replace: true });
      } catch (error) {
        const apiError =
          error instanceof ApiError
            ? error
            : new ApiError('Could not sign you in. Please try again.');
        setFormError({ message: apiError.message, hint: apiError.hint });
        toast.error(apiError.message, apiError.hint);
      }
    },
  });

  const emailInvalid = Boolean(formik.touched.email && formik.errors.email);
  const passwordInvalid = Boolean(formik.touched.password && formik.errors.password);

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-md flex-col justify-center px-4 py-10 sm:px-6 sm:py-16">
        <div className="card animate-fade-up p-6 sm:p-8">
          <Link to="/" aria-label="Mypdftools home" className="inline-flex">
            <Logo />
          </Link>

          <h1 className="mt-6 text-display-xs">Sign in</h1>
          <p className="mt-1.5 text-[15px] text-muted text-pretty">
            Your account keeps a log of the tools you've used. The tools themselves work without
            one.
          </p>

          {formError && (
            <div
              role="alert"
              className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-3.5 dark:border-red-500/25 dark:bg-red-500/10"
            >
              <p className="text-[14px] font-medium text-red-800 dark:text-red-300">
                {formError.message}
              </p>
              {formError.hint && (
                <p className="mt-1 text-[13px] text-red-700/80 dark:text-red-300/70">
                  {formError.hint}
                </p>
              )}
            </div>
          )}

          <form className="mt-6 space-y-4" onSubmit={formik.handleSubmit} noValidate>
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-[13.5px] font-medium text-ink-soft dark:text-sand-300"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="you@example.com"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                aria-invalid={emailInvalid}
                aria-describedby={emailInvalid ? 'email-error' : undefined}
                className={FIELD}
              />
              {emailInvalid && (
                <p
                  id="email-error"
                  role="alert"
                  className="mt-1.5 text-[13px] text-red-600 dark:text-red-400"
                >
                  {formik.errors.email}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-[13.5px] font-medium text-ink-soft dark:text-sand-300"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Your password"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  aria-invalid={passwordInvalid}
                  aria-describedby={passwordInvalid ? 'password-error' : undefined}
                  className={`${FIELD} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="tap-target absolute right-0 top-1/2 grid -translate-y-1/2 place-items-center
                             rounded-xl text-ink-muted transition-colors hover:text-ink dark:text-sand-400
                             dark:hover:text-sand-100"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {passwordInvalid && (
                <p
                  id="password-error"
                  role="alert"
                  className="mt-1.5 text-[13px] text-red-600 dark:text-red-400"
                >
                  {formik.errors.password}
                </p>
              )}
            </div>

            <Button type="submit" size="lg" fullWidth loading={formik.isSubmitting}>
              Sign in
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-ink/[0.08] dark:bg-white/[0.1]" />
            <span className="text-[12.5px] uppercase tracking-wide text-muted">or</span>
            <span className="h-px flex-1 bg-ink/[0.08] dark:bg-white/[0.1]" />
          </div>

          <a
            href={`${API_BASE}/auth/google`}
            className="tap-target flex h-11 w-full items-center justify-center gap-2.5 rounded-full
                       bg-white text-[15px] font-medium text-ink ring-1 ring-inset ring-ink/[0.09]
                       transition-colors hover:bg-sand-50 dark:bg-white/[0.06] dark:text-sand-100
                       dark:ring-white/[0.1] dark:hover:bg-white/[0.1]"
          >
            <GoogleMark />
            Continue with Google
          </a>

          <p className="mt-6 text-center text-[14px] text-muted">
            New here?{' '}
            <Link
              to="/register"
              state={location.state}
              className="font-medium text-brand-600 hover:underline dark:text-brand-400"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </AppShell>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}
