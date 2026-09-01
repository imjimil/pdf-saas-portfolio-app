import { useCallback, useId, useRef, useState } from 'react';
import {
  UploadCloud,
  X,
  GripVertical,
  FileText,
  Image as ImageIcon,
  Plus,
} from 'lucide-react';
import { cn } from '../lib/cn';
import { Button } from './ui/Button';

/**
 * File picker with drag-and-drop, multi-select, thumbnails and reordering.
 *
 * The previous component was a click-only button with none of this, and the
 * merge screen reimplemented its own version — this replaces both.
 */

export interface DropzoneProps {
  accept: string;
  multiple?: boolean;
  files: File[];
  onChange: (files: File[]) => void;
  maxSizeMb?: number;
  /** Enables drag handles; useful where order changes the result. */
  reorderable?: boolean;
  disabled?: boolean;
  hint?: string;
}

export function Dropzone({
  accept,
  multiple = false,
  files,
  onChange,
  maxSizeMb = 50,
  reorderable = false,
  disabled = false,
  hint,
}: DropzoneProps) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  const accepted = useCallback(
    (incoming: File[]): File[] => {
      const patterns = accept.split(',').map((value) => value.trim().toLowerCase());
      const oversize: string[] = [];
      const wrongType: string[] = [];

      const valid = incoming.filter((file) => {
        if (file.size > maxSizeMb * 1024 * 1024) {
          oversize.push(file.name);
          return false;
        }

        const name = file.name.toLowerCase();
        const type = file.type.toLowerCase();
        const matches = patterns.some((pattern) =>
          pattern.startsWith('.')
            ? name.endsWith(pattern)
            : pattern.endsWith('/*')
              ? type.startsWith(pattern.slice(0, -1))
              : type === pattern
        );

        if (!matches) wrongType.push(file.name);
        return matches;
      });

      if (oversize.length) {
        setError(`${oversize[0]} is larger than ${maxSizeMb} MB.`);
      } else if (wrongType.length) {
        setError(`${wrongType[0]} is not a supported file type.`);
      } else {
        setError(null);
      }

      return valid;
    },
    [accept, maxSizeMb]
  );

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      const valid = accepted(Array.from(incoming));
      if (!valid.length) return;
      onChange(multiple ? [...files, ...valid] : valid.slice(0, 1));
    },
    [accepted, files, multiple, onChange]
  );

  const removeAt = (index: number) => {
    onChange(files.filter((_, position) => position !== index));
    setError(null);
  };

  const moveTo = (from: number, to: number) => {
    if (from === to) return;
    const next = [...files];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  const showDropzone = !files.length || multiple;

  return (
    <div className="space-y-3">
      {showDropzone && (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            if (!disabled) setDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setDragging(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            if (!disabled && event.dataTransfer.files.length) {
              addFiles(event.dataTransfer.files);
            }
          }}
          className={cn(
            'relative rounded-3xl border-2 border-dashed transition-[border-color,background-color,transform] duration-200 ease-ios',
            dragging
              ? 'scale-[1.01] border-brand-500 bg-brand-500/[0.06]'
              : 'border-ink/12 hover:border-brand-500/50 hover:bg-sand-100/60 dark:border-white/12 dark:hover:bg-white/[0.03]',
            disabled && 'pointer-events-none opacity-50',
            files.length ? 'p-5' : 'p-8 sm:p-12'
          )}
        >
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={accept}
            multiple={multiple}
            disabled={disabled}
            className="sr-only"
            onChange={(event) => {
              if (event.target.files?.length) addFiles(event.target.files);
              event.target.value = '';
            }}
          />

          <label
            htmlFor={inputId}
            className="flex cursor-pointer flex-col items-center text-center"
          >
            <span
              className={cn(
                'grid place-items-center rounded-2xl bg-brand-500/10 text-brand-600 transition-transform duration-300 ease-spring dark:text-brand-400',
                dragging && 'scale-110',
                files.length ? 'h-10 w-10' : 'h-14 w-14'
              )}
            >
              {files.length ? <Plus size={20} /> : <UploadCloud size={26} />}
            </span>

            <span
              className={cn(
                'font-medium text-ink dark:text-sand-100',
                files.length ? 'mt-2.5 text-[15px]' : 'mt-4 text-[17px]'
              )}
            >
              {files.length
                ? 'Add more files'
                : dragging
                  ? 'Drop to upload'
                  : 'Drag and drop your file'}
            </span>

            {!files.length && (
              <>
                <span className="mt-1.5 text-[14px] text-muted">
                  or{' '}
                  <span className="font-medium text-brand-600 underline underline-offset-2 dark:text-brand-400">
                    browse your device
                  </span>
                </span>
                <span className="mt-3 text-[12.5px] text-muted">
                  {hint ?? `Up to ${maxSizeMb} MB${multiple ? ' per file' : ''}`}
                </span>
              </>
            )}
          </label>
        </div>
      )}

      {error && (
        <p role="alert" className="text-[13.5px] font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              draggable={reorderable && !disabled}
              onDragStart={() => setDraggedIndex(index)}
              onDragEnd={() => setDraggedIndex(null)}
              onDragOver={(event) => {
                if (!reorderable || draggedIndex === null) return;
                event.preventDefault();
              }}
              onDrop={(event) => {
                if (!reorderable || draggedIndex === null) return;
                event.preventDefault();
                moveTo(draggedIndex, index);
                setDraggedIndex(null);
              }}
              className={cn(
                'flex items-center gap-3 rounded-2xl border hairline bg-white p-3 transition-opacity dark:bg-white/[0.04]',
                draggedIndex === index && 'opacity-40'
              )}
            >
              {reorderable && (
                <button
                  type="button"
                  aria-label={`Reorder ${file.name}`}
                  className="cursor-grab text-ink-muted active:cursor-grabbing"
                  onKeyDown={(event) => {
                    // Keyboard reordering, since dragging is pointer-only.
                    if (event.key === 'ArrowUp' && index > 0) {
                      event.preventDefault();
                      moveTo(index, index - 1);
                    }
                    if (event.key === 'ArrowDown' && index < files.length - 1) {
                      event.preventDefault();
                      moveTo(index, index + 1);
                    }
                  }}
                >
                  <GripVertical size={17} />
                </button>
              )}

              <FileThumbnail file={file} />

              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-medium text-ink dark:text-sand-100">
                  {file.name}
                </p>
                <p className="text-[12.5px] text-muted">{formatBytes(file.size)}</p>
              </div>

              <button
                type="button"
                onClick={() => removeAt(index)}
                disabled={disabled}
                aria-label={`Remove ${file.name}`}
                className="tap-target grid shrink-0 place-items-center rounded-full text-ink-muted
                           transition-colors hover:bg-ink/[0.06] hover:text-ink dark:hover:bg-white/[0.08]"
              >
                <X size={17} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {files.length > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-[12.5px] text-muted">
            {files.length} files · {formatBytes(files.reduce((sum, f) => sum + f.size, 0))}
            {reorderable && ' · drag to reorder'}
          </p>
          <Button variant="ghost" size="sm" onClick={() => onChange([])} disabled={disabled}>
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}

function FileThumbnail({ file }: { file: File }) {
  const [preview, setPreview] = useState<string | null>(null);

  if (file.type.startsWith('image/') && !preview) {
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result));
    reader.readAsDataURL(file);
  }

  if (preview) {
    return (
      <img
        src={preview}
        alt=""
        className="h-10 w-10 shrink-0 rounded-lg object-cover ring-1 ring-ink/[0.07]"
      />
    );
  }

  const Icon = file.type.startsWith('image/') ? ImageIcon : FileText;

  return (
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400">
      <Icon size={18} aria-hidden />
    </span>
  );
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
