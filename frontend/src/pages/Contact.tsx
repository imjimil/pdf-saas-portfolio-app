import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Mail, Send, CheckCircle2 } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { Button } from '../components/ui/Button';
import { toast } from '../components/ui/Toast';
import { useAuth } from '../contexts/AuthContext';
import { ApiError, contactAPI } from '../services/api';

const SUPPORT_EMAIL = 'jprajapati2014@gmail.com';

const FIELD =
  'w-full rounded-xl border border-ink/[0.09] bg-white px-3.5 text-[15px] text-ink ' +
  'placeholder:text-ink-muted/70 transition-colors focus:border-brand-500 ' +
  'dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-sand-100 dark:placeholder:text-sand-500';

const INPUT = `${FIELD} h-11`;
const TEXTAREA = `${FIELD} resize-y py-2.5`;

const LABEL = 'mb-1.5 block text-[13.5px] font-medium text-ink-soft dark:text-sand-300';

interface ContactValues {
  name: string;
  email: string;
  message: string;
}

export default function Contact() {
  const { user } = useAuth();
  const [sent, setSent] = useState(false);

  const formik = useFormik<ContactValues>({
    initialValues: {
      name: user?.name ?? '',
      email: user?.email ?? '',
      message: '',
    },
    enableReinitialize: true,
    validationSchema: Yup.object({
      name: Yup.string().trim().required('Please tell us your name'),
      email: Yup.string().email('Enter a valid email address').required('Email is required'),
      message: Yup.string()
        .trim()
        .min(10, 'A little more detail helps us answer properly')
        .required('Please write a message'),
    }),
    onSubmit: async (values, helpers) => {
      try {
        const response = await contactAPI.send(values);
        setSent(true);
        helpers.resetForm({ values: { ...values, message: '' } });
        toast.success('Message sent', response.message);
      } catch (error) {
        toast.error(
          error instanceof ApiError ? error.message : 'Could not send your message.',
          error instanceof ApiError ? error.hint : undefined
        );
      } finally {
        helpers.setSubmitting(false);
      }
    },
  });

  const fieldError = (field: keyof ContactValues): string | undefined =>
    formik.touched[field] ? formik.errors[field] : undefined;

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="animate-fade-up">
          <h1 className="text-display-xs">Get in touch</h1>
          <p className="mt-3 text-[16px] leading-relaxed text-muted text-pretty">
            Mypdftools is a small project, so messages come straight to one inbox and are usually
            answered within a couple of days.
          </p>
        </header>

        <div className="card mt-7 flex flex-wrap items-center gap-3 p-4 sm:p-5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-500/10 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
            <Mail size={18} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] text-muted">Email us directly</p>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-[15px] font-medium text-brand-600 hover:underline dark:text-brand-400"
            >
              {SUPPORT_EMAIL}
            </a>
          </div>
        </div>

        <section className="card mt-4 p-5 sm:p-6" aria-labelledby="contact-form">
          <h2 id="contact-form" className="text-[17px] font-semibold">
            Write a message
          </h2>

          <div className="mt-3 flex items-start gap-2 rounded-xl bg-brand-500/8 p-3 dark:bg-brand-500/10">
            <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-brand-600 dark:text-brand-400" aria-hidden />
            <p className="text-[13px] leading-relaxed text-muted text-pretty">
              Messages are stored securely and emailed to us when SMTP is configured. We usually
              reply within a couple of days.
            </p>
          </div>

          {sent ? (
            <div
              role="status"
              className="mt-5 rounded-xl border border-brand-200 bg-brand-50/80 p-4 dark:border-brand-500/25 dark:bg-brand-500/10"
            >
              <p className="text-[14px] font-medium text-brand-800 dark:text-brand-200">
                Thanks — your message is on its way.
              </p>
              <p className="mt-1 text-[13px] text-brand-700/80 dark:text-brand-300/80">
                We will reply to the email address you gave us.
              </p>
            </div>
          ) : null}

          <form className="mt-5 space-y-4" onSubmit={formik.handleSubmit} noValidate>
            <div>
              <label htmlFor="name" className={LABEL}>
                Your name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Alex Doe"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                aria-invalid={Boolean(fieldError('name'))}
                aria-describedby={fieldError('name') ? 'name-error' : undefined}
                className={INPUT}
              />
              {fieldError('name') && (
                <p
                  id="name-error"
                  role="alert"
                  className="mt-1.5 text-[13px] text-red-600 dark:text-red-400"
                >
                  {fieldError('name')}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="email" className={LABEL}>
                Your email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                aria-invalid={Boolean(fieldError('email'))}
                aria-describedby={fieldError('email') ? 'email-error' : undefined}
                className={INPUT}
              />
              {fieldError('email') && (
                <p
                  id="email-error"
                  role="alert"
                  className="mt-1.5 text-[13px] text-red-600 dark:text-red-400"
                >
                  {fieldError('email')}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="message" className={LABEL}>
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={6}
                placeholder="What can we help with?"
                value={formik.values.message}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                aria-invalid={Boolean(fieldError('message'))}
                aria-describedby={fieldError('message') ? 'message-error' : undefined}
                className={TEXTAREA}
              />
              {fieldError('message') && (
                <p
                  id="message-error"
                  role="alert"
                  className="mt-1.5 text-[13px] text-red-600 dark:text-red-400"
                >
                  {fieldError('message')}
                </p>
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              icon={Send}
              fullWidth
              loading={formik.isSubmitting}
            >
              Send message
            </Button>
          </form>
        </section>

        <section className="mt-8" aria-labelledby="common-questions">
          <h2 id="common-questions" className="text-[17px] font-semibold">
            Before you write
          </h2>
          <p className="mt-1 text-[14px] text-muted">
            These come up often and are answered elsewhere on the site.
          </p>

          <dl className="mt-4 space-y-3">
            <FaqItem question="What happens to the files I upload?">
              They are processed on our server and deleted as soon as your download finishes. We
              never keep the contents.{' '}
              <Link
                to="/privacy"
                className="font-medium text-brand-600 hover:underline dark:text-brand-400"
              >
                Read the privacy policy
              </Link>
              .
            </FaqItem>

            <FaqItem question="Can I re-download something I converted last week?">
              No. Because nothing is stored, there is no copy to fetch. Run the file through the
              tool again from{' '}
              <Link
                to="/tools"
                className="font-medium text-brand-600 hover:underline dark:text-brand-400"
              >
                the tool catalogue
              </Link>
              .
            </FaqItem>

            <FaqItem question="Do I need an account?">
              Only if you want a log of which tools you used. Every tool works without signing in.
            </FaqItem>

            <FaqItem question="Is there a file size limit?">
              Yes — 50 MB per file. Larger PDFs usually shrink below that with the Compress tool.
            </FaqItem>
          </dl>
        </section>
      </div>
    </AppShell>
  );
}

function FaqItem({ question, children }: { question: string; children: React.ReactNode }) {
  return (
    <div className="card p-4 sm:p-5">
      <dt className="text-[14.5px] font-medium">{question}</dt>
      <dd className="mt-1.5 text-[14px] leading-relaxed text-muted text-pretty">{children}</dd>
    </div>
  );
}

