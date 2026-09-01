import { Dispatch, SetStateAction, useEffect, useState } from 'react';

/**
 * A one-shot handoff for a file chosen on one screen and used on another.
 *
 * The landing page lets you drop a file before picking a tool, so the file has
 * to survive a single navigation. Files are not serialisable, which rules out
 * router state and session storage, and a Provider would mean wrapping the app
 * to carry a value that is read once. A module-level slot is the smallest
 * thing that works.
 */
let pending: File[] = [];

export function setPendingFiles(files: File[]): void {
  pending = files;
}

/**
 * File state for a tool page, seeded with whatever the landing page handed
 * over.
 *
 * Reading and clearing are deliberately separate. Under StrictMode React runs a
 * `useState` initialiser twice and keeps the second result, so an initialiser
 * that cleared as it read would hand back the file once and an empty list the
 * second time — leaving the page blank. Reading stays pure; the clear happens
 * in an effect, which is also what stops a later visit to the same tool from
 * resurrecting a file the user already converted.
 */
export function usePendingFiles(): [File[], Dispatch<SetStateAction<File[]>>] {
  const [files, setFiles] = useState<File[]>(() => pending);

  useEffect(() => {
    pending = [];
  }, []);

  return [files, setFiles];
}
