import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { AppShell } from '../components/AppShell';

const LAST_UPDATED = '31 August 2026';

export default function PrivacyPolicy() {
  return (
    <AppShell>
      <article className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-14">
        <header className="animate-fade-up">
          <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-brand-600 dark:text-brand-400">
            Privacy
          </p>
          <h1 className="mt-2 text-display-xs sm:text-display-sm">Privacy policy</h1>
          <p className="mt-3 text-[14px] text-muted">Last updated: {LAST_UPDATED}</p>
        </header>

        <div className="card mt-8 p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-[16px] font-semibold">
            <ShieldCheck size={18} aria-hidden className="text-brand-600 dark:text-brand-400" />
            The short version
          </h2>
          <ul className="mt-3 space-y-2 text-[15px] leading-relaxed text-ink-soft dark:text-sand-300">
            <li>Your files are processed on our server and deleted immediately afterwards.</li>
            <li>We never read, keep, share or sell the contents of your documents.</li>
            <li>An account stores your email, an optional name, and a list of tools you used.</li>
            <li>Passwords are stored hashed. Signing in with Google is optional.</li>
            <li>You can delete your account, and everything attached to it, at any time.</li>
          </ul>
        </div>

        <div className="mt-10 space-y-9">
          <Section title="Files you upload">
            <p>
              When you use a tool, your file is uploaded over an encrypted connection, converted on
              our server, and streamed back to you as a download. The uploaded file and the
              converted result are then deleted from disk. Nothing is copied to long-term storage,
              backed up, or kept for analysis.
            </p>
            <p>
              This has a practical consequence worth stating plainly: there is no way to fetch a
              converted file again later. If you need it a second time, run the original through
              the tool again from{' '}
              <TextLink to="/tools">the tool catalogue</TextLink>.
            </p>
            <p>
              We do not open, index or inspect the contents of your documents beyond what the
              conversion itself requires. Password-protected PDFs are unlocked only with the
              password you supply, and that password is used for the single operation and never
              written down.
            </p>
          </Section>

          <Section title="Using the tools without an account">
            <p>
              Every tool works while signed out. In that case we do not attribute the conversion to
              anyone — no record is created, because there is no account to attach it to.
            </p>
          </Section>

          <Section title="Account information">
            <p>If you create an account, we store:</p>
            <ul className="ml-5 list-disc space-y-1.5">
              <li>Your email address, which identifies the account and is used to sign you in.</li>
              <li>A display name, only if you choose to set one. It is optional and editable.</li>
              <li>The date the account was created.</li>
              <li>
                A hashed version of your password. Hashing is one-way: we cannot read your
                password, and neither can anyone who obtains the database.
              </li>
            </ul>
            <p>
              We do not ask for a phone number, a billing address or any payment details, because
              the service is free and there is nothing to bill.
            </p>
          </Section>

          <Section title="Signing in with Google">
            <p>
              Google sign-in is optional and exists only to save you from managing another
              password. If you use it, Google tells us your email address and your public profile
              name; we store those two things and a Google account identifier so we can recognise
              you next time. We receive no access to your Google Drive, contacts or anything else,
              and we never post on your behalf.
            </p>
            <p>
              An account created this way has no password of its own, which is why the password
              section is hidden on the account page for those users.
            </p>
          </Section>

          <Section title="Your activity log">
            <p>
              For signed-in users we record one row per conversion: which tool was used, the name
              and size of the file you started with, the name given to the result, and the time it
              happened. This is what fills the activity page. It is metadata about the job, not the
              document — the file itself is already gone by the time you read it.
            </p>
            <p>
              You can delete individual entries from the activity page, or remove the whole log by
              deleting your account.
            </p>
          </Section>

          <Section title="What is stored in your browser">
            <p>
              We do not use advertising or tracking cookies. Your browser's local storage holds two
              things: a sign-in token, so you stay signed in between visits, and your light or dark
              mode preference. Signing out removes the token.
            </p>
          </Section>

          <Section title="Service providers">
            <p>
              The application runs on a commercial hosting platform and stores account data in a
              managed database. Those providers process data on our behalf in order to run the
              service and are not permitted to use it for anything else. Aside from Google, when
              you choose Google sign-in, we do not share your information with third parties.
            </p>
          </Section>

          <Section title="What we do not do">
            <ul className="ml-5 list-disc space-y-1.5">
              <li>We do not sell or rent your data to anyone, for any purpose.</li>
              <li>We do not show ads or embed advertising trackers.</li>
              <li>We do not use your documents to train machine learning models.</li>
              <li>We do not email you marketing you did not ask for.</li>
            </ul>
          </Section>

          <Section title="Your choices">
            <p>
              You can change your display name, change your password and delete your account from
              the account page. Deleting your account removes your email, your name and your entire
              activity log from our database. The action is immediate and cannot be undone.
            </p>
            <p>
              If you would like a copy of what we hold about you, ask and we will send it — for most
              accounts it is a short list.
            </p>
          </Section>

          <Section title="Children">
            <p>
              The service is not directed at children under 13, and we do not knowingly create
              accounts for them. If you believe a child has created one, contact us and we will
              remove it.
            </p>
          </Section>

          <Section title="Changes to this policy">
            <p>
              If the way we handle data changes, this page changes with it and the date at the top
              is updated. We will not quietly start keeping files; that promise is the point of the
              product.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              Questions about any of this are welcome. Use the{' '}
              <TextLink to="/contact">contact page</TextLink> and we will get back to you.
            </p>
          </Section>
        </div>
      </article>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-[19px] font-semibold">{title}</h2>
      <div className="mt-2.5 space-y-3 text-[15.5px] leading-relaxed text-ink-soft text-pretty dark:text-sand-300">
        {children}
      </div>
    </section>
  );
}

function TextLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="font-medium text-brand-600 underline-offset-2 hover:underline dark:text-brand-400"
    >
      {children}
    </Link>
  );
}
