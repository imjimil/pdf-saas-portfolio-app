import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, FileUp, X } from 'lucide-react';
import { toolsAcceptingFile } from '../../lib/tools';
import { setPendingFiles } from '../../hooks/usePendingFiles';
import { cn } from '../../lib/cn';

/**
 * The landing page's working entry point.
 *
 * Dropping a file here picks the tool afterwards rather than before, which is
 * the order people actually think in — they have a file and a problem, not a
 * tool in mind. The chosen file is carried straight into the tool page, so
 * nobody has to select it twice.
 */
export function QuickStart() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);

  const matches = file ? toolsAcceptingFile(file) : [];

  const open = (path: string) => {
    if (file) setPendingFiles([file]);
    navigate(path);
  };

  return (
    <div className="w-full rounded-[1.75rem] border hairline bg-white p-2 shadow-lifted dark:bg-white/[0.03]">
      {!file ? (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            const dropped = event.dataTransfer.files?.[0];
            if (dropped) setFile(dropped);
          }}
          className={cn(
            'rounded-[1.4rem] border-2 border-dashed px-6 py-10 text-center',
            'transition-[border-color,background-color] duration-200 ease-ios',
            dragging
              ? 'border-brand-600 bg-brand-600/[0.06]'
              : 'border-ink/[0.13] dark:border-white/[0.13]'
          )}
        >
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-sand-200/80 text-ink-soft dark:bg-white/[0.08] dark:text-sand-200">
            <FileUp size={22} aria-hidden />
          </span>

          <p className="mt-4 text-[17px] font-medium text-ink dark:text-sand-100">
            Drop a file to start
          </p>
          <p className="mx-auto mt-1.5 max-w-[15rem] text-[13.5px] leading-relaxed text-muted">
            PDF, Word or an image. You pick what to do with it next.
          </p>

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="tap-target mt-5 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[14px]
                       font-medium text-white transition-colors hover:bg-ink-soft
                       dark:bg-sand-100 dark:text-ink dark:hover:bg-white"
          >
            Choose a file
          </button>

          <input
            ref={inputRef}
            type="file"
            className="sr-only"
            accept=".pdf,application/pdf,.docx,.doc,.odt,.rtf,image/*"
            onChange={(event) => {
              const picked = event.target.files?.[0];
              if (picked) setFile(picked);
              event.target.value = '';
            }}
          />
        </div>
      ) : (
        <div className="rounded-[1.4rem] bg-sand-100/70 p-5 dark:bg-white/[0.04]">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sand-200/80 text-ink-soft dark:bg-white/[0.08] dark:text-sand-200">
              <FileUp size={18} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14.5px] font-medium text-ink dark:text-sand-100">
                {file.name}
              </p>
              <p className="mt-0.5 text-[12.5px] text-muted">
                {(file.size / 1024 / 1024).toFixed(1)} MB
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFile(null)}
              aria-label="Remove file"
              className="tap-target grid shrink-0 place-items-center rounded-full text-ink-muted
                         transition-colors hover:text-ink dark:hover:text-sand-100"
            >
              <X size={17} />
            </button>
          </div>

          {matches.length > 0 ? (
            <>
              <p className="mt-5 text-[12.5px] font-medium uppercase tracking-wide text-muted">
                What next?
              </p>
              <ul className="mt-2 space-y-1.5">
                {matches.slice(0, 4).map((tool) => (
                  <li key={tool.id}>
                    <button
                      type="button"
                      onClick={() => open(tool.path)}
                      className="group flex w-full items-center gap-3 rounded-xl bg-white px-3.5 py-3 text-left
                                 transition-colors hover:bg-sand-100 dark:bg-white/[0.05]
                                 dark:hover:bg-white/[0.09]"
                    >
                      <tool.icon
                        size={17}
                        className="shrink-0 text-ink-soft dark:text-sand-300"
                        aria-hidden
                      />
                      <span className="flex-1 text-[14.5px] font-medium text-ink dark:text-sand-100">
                        {tool.name}
                      </span>
                      <ArrowRight
                        size={15}
                        className="shrink-0 text-ink-muted transition-transform group-hover:translate-x-0.5"
                        aria-hidden
                      />
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="mt-5 text-[13.5px] leading-relaxed text-muted">
              No tool here handles that file type yet. Try a PDF, a Word document or an
              image.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
