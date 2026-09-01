import { motion } from 'framer-motion';
import { ArrowRight, History, UserPlus } from 'lucide-react';
import { ButtonLink } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';

export function CTA() {
  const { isAuthenticated, user } = useAuth();
  const firstName = user?.name?.trim().split(' ')[0];

  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
          className="relative overflow-hidden rounded-4xl border border-brand-600/[0.12] bg-brand-50 px-6 py-12 sm:px-12 sm:py-16 dark:border-brand-400/[0.14] dark:bg-brand-950/50"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-brand-500/20 blur-[90px]"
          />

          <div className="relative mx-auto max-w-2xl text-center">
            {isAuthenticated ? (
              <>
                <h2 className="text-display-xs sm:text-display-sm">
                  {firstName ? `Welcome back, ${firstName}.` : 'Welcome back.'}
                </h2>
                <p className="mx-auto mt-4 max-w-md text-base text-muted text-pretty sm:text-lg">
                  Your activity history is saved to your account, so you can see what you converted
                  and when.
                </p>
                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <ButtonLink
                    to="/tools"
                    size="lg"
                    iconRight={ArrowRight}
                    className="w-full sm:w-auto"
                  >
                    Open the tools
                  </ButtonLink>
                  <ButtonLink
                    to="/my-dashboard"
                    variant="secondary"
                    size="lg"
                    icon={History}
                    className="w-full sm:w-auto"
                  >
                    View your history
                  </ButtonLink>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-display-xs sm:text-display-sm">
                  Got a file to fix? Start now.
                </h2>
                <p className="mx-auto mt-4 max-w-md text-base text-muted text-pretty sm:text-lg">
                  No signup, no card, no email address. Pick a tool and your file is done in a
                  minute.
                </p>
                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <ButtonLink
                    to="/tools"
                    size="lg"
                    iconRight={ArrowRight}
                    className="w-full sm:w-auto"
                  >
                    Open the tools
                  </ButtonLink>
                  <ButtonLink
                    to="/register"
                    variant="secondary"
                    size="lg"
                    icon={UserPlus}
                    className="w-full sm:w-auto"
                  >
                    Create an account
                  </ButtonLink>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
