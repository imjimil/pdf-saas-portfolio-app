import { Link } from 'react-router-dom';
import { Logo } from './ui/Logo';
import { getTool, type Tool } from '../lib/tools';

const FEATURED_TOOL_IDS = [
  'pdf-to-word',
  'word-to-pdf',
  'merge-pdf',
  'split-pdf',
  'compress-pdf',
  'pdf-ocr',
];

const featuredTools = FEATURED_TOOL_IDS.map(getTool).filter(
  (tool): tool is Tool => tool !== undefined
);

const linkClass =
  'tap-target inline-flex items-center text-sm text-muted transition-colors hover:text-ink dark:hover:text-sand-100';

function Column({
  heading,
  links,
}: {
  heading: string;
  links: Array<{ label: string; to: string }>;
}) {
  return (
    <div>
      <h3 className="text-[13px] font-semibold uppercase tracking-wider text-ink dark:text-sand-100">
        {heading}
      </h3>
      <ul className="mt-2">
        {links.map(({ label, to }) => (
          <li key={to}>
            <Link to={to} className={linkClass}>
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="hairline border-t pb-tabbar md:pb-0">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div className="lg:pr-8">
            <Link to="/" className="inline-flex" aria-label="Mypdftools home">
              <Logo />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted text-pretty">
              Free PDF tools that convert, combine, compress and protect your documents — then
              delete them once you have your download.
            </p>
          </div>

          <Column
            heading="Tools"
            links={[
              ...featuredTools.map((tool) => ({ label: tool.name, to: tool.path })),
              { label: 'All tools', to: '/tools' },
            ]}
          />

          <Column
            heading="Company"
            links={[
              { label: 'Contact', to: '/contact' },
              { label: 'Privacy', to: '/privacy' },
            ]}
          />

          <Column
            heading="Account"
            links={[
              { label: 'Sign in', to: '/login' },
              { label: 'Create account', to: '/register' },
            ]}
          />
        </div>

        <div className="hairline mt-12 border-t pt-6">
          <p className="text-[13px] text-muted">
            &copy; {new Date().getFullYear()} Mypdftools.
          </p>
        </div>
      </div>
    </footer>
  );
}
