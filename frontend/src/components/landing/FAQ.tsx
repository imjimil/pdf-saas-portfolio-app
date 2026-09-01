import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';

const linkClass =
  'font-medium text-brand-600 underline decoration-brand-600/30 underline-offset-2 hover:decoration-brand-600 dark:text-brand-400 dark:decoration-brand-400/30';

const QUESTIONS: Array<{ question: string; answer: ReactNode }> = [
  {
    question: 'Is it free?',
    answer: (
      <>
        Yes. Every tool on the site is free to use, and there is no signup wall in front of any of
        them.
      </>
    ),
  },
  {
    question: 'Do you keep my files?',
    answer: (
      <>
        No. Your upload and the file we generate are deleted as soon as your download completes, so
        nothing is left sitting on the server afterwards.
      </>
    ),
  },
  {
    question: 'What is the file size limit?',
    answer: (
      <>
        50 MB per file. If a PDF is close to that, running{' '}
        <Link to="/compress-pdf" className={linkClass}>
          Compress PDF
        </Link>{' '}
        first usually brings it well under, and{' '}
        <Link to="/split-pdf" className={linkClass}>
          Split PDF
        </Link>{' '}
        can break a long document into smaller pieces.
      </>
    ),
  },
  {
    question: 'Do I need an account?',
    answer: (
      <>
        Not to use the tools. An account only adds a history of what you converted and when, which
        is handy if you come back often.{' '}
        <Link to="/register" className={linkClass}>
          Creating one
        </Link>{' '}
        takes a moment and is optional.
      </>
    ),
  },
  {
    question: 'Which formats are supported?',
    answer: (
      <>
        PDF throughout, plus Word (.docx, .doc, .odt, .rtf), images (JPG, PNG, WEBP, HEIC, TIFF,
        GIF), plain text and EPUB, depending on the tool.
      </>
    ),
  },
  {
    question: 'Is the Word conversion editable?',
    answer: (
      <>
        Yes — you get a real .docx with selectable, editable text rather than pictures of pages.
        Heavily designed layouts can shift a little, and a scanned PDF needs{' '}
        <Link to="/pdf-ocr" className={linkClass}>
          OCR
        </Link>{' '}
        first because there is no text in it yet.
      </>
    ),
  },
];

export function FAQ() {
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-display-xs sm:text-display-sm">Questions people actually ask</h2>

          <div className="card mt-8 divide-y divide-ink/[0.07] overflow-hidden sm:mt-10 dark:divide-white/[0.08]">
            {QUESTIONS.map(({ question, answer }) => (
              <details key={question} className="group">
                <summary className="tap-target flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-[15px] font-medium text-ink sm:px-6 sm:text-base dark:text-sand-100 [&::-webkit-details-marker]:hidden">
                  {question}
                  <ChevronDown
                    size={18}
                    className="shrink-0 text-ink-muted transition-transform duration-200 ease-ios group-open:rotate-180 dark:text-sand-400"
                    aria-hidden
                  />
                </summary>
                <div className="px-5 pb-5 text-sm leading-relaxed text-muted text-pretty sm:px-6 sm:text-[15px]">
                  {answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
