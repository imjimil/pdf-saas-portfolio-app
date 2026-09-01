import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { AlertTriangle, KeyRound, Mail, ShieldCheck, Trash2, UserRound } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { Button } from '../components/ui/Button';
import { toast } from '../components/ui/Toast';
import { useAuth } from '../contexts/AuthContext';
import { ApiError, authAPI } from '../services/api';

interface ProfileUser {
  _id?: string;
  id?: string;
  email: string;
  name?: string;
  createdAt?: string;
  googleId?: string;
}

const FIELD =
  'h-11 w-full rounded-xl border border-ink/[0.09] bg-white px-3.5 text-[15px] text-ink ' +
  'placeholder:text-ink-muted/70 transition-colors focus:border-brand-500 ' +
  'dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-sand-100 dark:placeholder:text-sand-500';

const LABEL = 'mb-1.5 block text-[13.5px] font-medium text-ink-soft dark:text-sand-300';

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();

  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data: { user: ProfileUser } = await authAPI.getProfile();
      setProfile(data.user);
    } catch (caught) {
      setLoadError(messageFrom(caught, 'Could not load your account details.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const nameFormik = useFormik({
    initialValues: { name: profile?.name ?? '' },
    enableReinitialize: true,
    validationSchema: Yup.object({
      name: Yup.string().max(100, 'Keep it under 100 characters'),
    }),
    onSubmit: async (values) => {
      try {
        await authAPI.updateProfile(values.name.trim());
        updateUser({ name: values.name.trim() || undefined });
        setProfile((current) => (current ? { ...current, name: values.name.trim() } : current));
        toast.success('Name saved');
      } catch (caught) {
        toast.error(messageFrom(caught, 'Could not save your name.'));
      }
    },
  });

  const passwordFormik = useFormik({
    initialValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
    validationSchema: Yup.object({
      currentPassword: Yup.string().required('Enter your current password'),
      newPassword: Yup.string()
        .min(6, 'Use at least 6 characters')
        .required('Enter a new password'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('newPassword')], 'Both passwords must match')
        .required('Confirm your new password'),
    }),
    onSubmit: async (values, helpers) => {
      try {
        await authAPI.changePassword(values.currentPassword, values.newPassword);
        helpers.resetForm();
        toast.success('Password changed');
      } catch (caught) {
        toast.error(messageFrom(caught, 'Could not change your password.'));
      }
    },
  });

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await authAPI.deleteAccount();
      logout();
      toast.success('Account deleted', 'Your email and activity log have been removed.');
      navigate('/', { replace: true });
    } catch (caught) {
      toast.error(messageFrom(caught, 'Could not delete your account.'));
      setDeleting(false);
    }
  };

  const email = profile?.email ?? user?.email ?? '';
  const initial = (profile?.name || email || '?').charAt(0).toUpperCase();
  const isGoogleAccount = Boolean(profile?.googleId);

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="animate-fade-up">
          <h1 className="text-display-xs">Account</h1>
          <p className="mt-1.5 text-[15px] text-muted text-pretty">
            Everything we hold about you lives on this page.
          </p>
        </header>

        {loadError && (
          <div
            role="alert"
            className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-500/25 dark:bg-red-500/10"
          >
            <p className="text-[14px] font-medium text-red-800 dark:text-red-300">{loadError}</p>
            <div className="mt-3">
              <Button size="sm" variant="secondary" onClick={loadProfile}>
                Try again
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="mt-6 space-y-4" aria-busy="true" aria-label="Loading your account">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="card space-y-3 p-5">
                <div className="h-4 w-1/3 animate-pulse rounded-full bg-ink/[0.07] dark:bg-white/[0.08]" />
                <div className="h-11 w-full animate-pulse rounded-xl bg-ink/[0.05] dark:bg-white/[0.05]" />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <section className="card p-5 sm:p-6">
              <div className="flex items-center gap-4">
                <span
                  aria-hidden
                  className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-brand-600 text-[22px] font-semibold text-white"
                >
                  {initial}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[16px] font-semibold">
                    {profile?.name || 'No name set'}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 truncate text-[14px] text-muted">
                    <Mail size={14} className="shrink-0" aria-hidden />
                    {email}
                  </p>
                </div>
              </div>

              <dl className="mt-5 grid gap-4 border-t hairline pt-4 sm:grid-cols-2">
                <div>
                  <dt className="text-[12.5px] text-muted">Member since</dt>
                  <dd className="mt-0.5 text-[14.5px]">
                    {profile?.createdAt
                      ? new Date(profile.createdAt).toLocaleDateString(undefined, {
                          dateStyle: 'long',
                        })
                      : 'Unknown'}
                  </dd>
                </div>
                <div>
                  <dt className="text-[12.5px] text-muted">Sign-in method</dt>
                  <dd className="mt-0.5 text-[14.5px]">
                    {isGoogleAccount ? 'Google' : 'Email and password'}
                  </dd>
                </div>
              </dl>

              <p className="mt-4 flex items-start gap-2 text-[13px] text-muted text-pretty">
                <ShieldCheck size={15} className="mt-0.5 shrink-0" aria-hidden />
                We store your email, an optional name and a log of which tools you used. The files
                themselves are never kept.
              </p>
            </section>

            <section className="card p-5 sm:p-6" aria-labelledby="display-name">
              <h2 id="display-name" className="flex items-center gap-2 text-[16px] font-semibold">
                <UserRound size={17} aria-hidden className="text-ink-muted dark:text-sand-400" />
                Display name
              </h2>
              <p className="mt-1 text-[14px] text-muted">
                Shown in the account menu. Optional — your email works fine on its own.
              </p>

              <form className="mt-4" onSubmit={nameFormik.handleSubmit} noValidate>
                <label htmlFor="name" className={LABEL}>
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="How should we address you?"
                  value={nameFormik.values.name}
                  onChange={nameFormik.handleChange}
                  onBlur={nameFormik.handleBlur}
                  aria-invalid={Boolean(nameFormik.touched.name && nameFormik.errors.name)}
                  aria-describedby={
                    nameFormik.touched.name && nameFormik.errors.name ? 'name-error' : undefined
                  }
                  className={FIELD}
                />
                {nameFormik.touched.name && nameFormik.errors.name && (
                  <p
                    id="name-error"
                    role="alert"
                    className="mt-1.5 text-[13px] text-red-600 dark:text-red-400"
                  >
                    {nameFormik.errors.name}
                  </p>
                )}

                <div className="mt-4">
                  <Button type="submit" loading={nameFormik.isSubmitting}>
                    Save name
                  </Button>
                </div>
              </form>
            </section>

            {isGoogleAccount ? (
              <section className="card p-5 sm:p-6">
                <h2 className="flex items-center gap-2 text-[16px] font-semibold">
                  <KeyRound size={17} aria-hidden className="text-ink-muted dark:text-sand-400" />
                  Password
                </h2>
                <p className="mt-1 text-[14px] text-muted text-pretty">
                  You sign in with Google, so this account has no password to change. Manage it
                  from your Google account instead.
                </p>
              </section>
            ) : (
              <section className="card p-5 sm:p-6" aria-labelledby="change-password">
                <h2
                  id="change-password"
                  className="flex items-center gap-2 text-[16px] font-semibold"
                >
                  <KeyRound size={17} aria-hidden className="text-ink-muted dark:text-sand-400" />
                  Change password
                </h2>
                <p className="mt-1 text-[14px] text-muted">
                  At least 6 characters. Passwords are stored hashed, never in plain text.
                </p>

                <form
                  className="mt-4 space-y-4"
                  onSubmit={passwordFormik.handleSubmit}
                  noValidate
                >
                  <PasswordField
                    id="currentPassword"
                    label="Current password"
                    autoComplete="current-password"
                    value={passwordFormik.values.currentPassword}
                    error={
                      passwordFormik.touched.currentPassword
                        ? passwordFormik.errors.currentPassword
                        : undefined
                    }
                    onChange={passwordFormik.handleChange}
                    onBlur={passwordFormik.handleBlur}
                  />
                  <PasswordField
                    id="newPassword"
                    label="New password"
                    autoComplete="new-password"
                    value={passwordFormik.values.newPassword}
                    error={
                      passwordFormik.touched.newPassword
                        ? passwordFormik.errors.newPassword
                        : undefined
                    }
                    onChange={passwordFormik.handleChange}
                    onBlur={passwordFormik.handleBlur}
                  />
                  <PasswordField
                    id="confirmPassword"
                    label="Confirm new password"
                    autoComplete="new-password"
                    value={passwordFormik.values.confirmPassword}
                    error={
                      passwordFormik.touched.confirmPassword
                        ? passwordFormik.errors.confirmPassword
                        : undefined
                    }
                    onChange={passwordFormik.handleChange}
                    onBlur={passwordFormik.handleBlur}
                  />

                  <Button type="submit" loading={passwordFormik.isSubmitting}>
                    Change password
                  </Button>
                </form>
              </section>
            )}

            <section
              className="rounded-2xl border border-red-200 bg-red-50/60 p-5 dark:border-red-500/25 dark:bg-red-500/[0.07] sm:p-6"
              aria-labelledby="danger-zone"
            >
              <h2
                id="danger-zone"
                className="flex items-center gap-2 text-[16px] font-semibold text-red-700 dark:text-red-300"
              >
                <AlertTriangle size={17} aria-hidden />
                Delete account
              </h2>
              <p className="mt-1 text-[14px] text-red-800/80 dark:text-red-300/80 text-pretty">
                This removes your email, your name and your entire activity log. It cannot be
                undone.
              </p>

              {confirmingDelete ? (
                <div
                  role="alert"
                  className="mt-4 rounded-xl border border-red-300 bg-white p-4 dark:border-red-500/35 dark:bg-[#1b1413]"
                >
                  <p className="text-[14px] font-medium text-red-800 dark:text-red-300">
                    Permanently delete the account for {email}?
                  </p>
                  <p className="mt-1 text-[13px] text-red-700/80 dark:text-red-300/70">
                    You will be signed out immediately. Nothing can be restored afterwards.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2.5">
                    <Button
                      variant="danger"
                      icon={Trash2}
                      loading={deleting}
                      onClick={handleDeleteAccount}
                    >
                      Yes, delete my account
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={deleting}
                      onClick={() => setConfirmingDelete(false)}
                    >
                      Keep my account
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-4">
                  <Button variant="danger" icon={Trash2} onClick={() => setConfirmingDelete(true)}>
                    Delete account
                  </Button>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function PasswordField({
  id,
  label,
  autoComplete,
  value,
  error,
  onChange,
  onBlur,
}: {
  id: string;
  label: string;
  autoComplete: string;
  value: string;
  error?: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: (event: React.FocusEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      <input
        id={id}
        name={id}
        type="password"
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={FIELD}
      />
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-1.5 text-[13px] text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      )}
    </div>
  );
}

function messageFrom(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}
