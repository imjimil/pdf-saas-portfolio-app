import { execFile } from 'child_process';
import { AppError } from './errors';

export interface RunOptions {
  timeoutMs?: number;
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  /** Kill the process if it writes more than this much output. */
  maxBuffer?: number;
}

export interface RunResult {
  stdout: string;
  stderr: string;
}

/**
 * Runs an external binary with an argument array.
 *
 * `execFile` (not `exec`) is used deliberately: arguments are passed to the OS
 * directly rather than through a shell, so filenames and user-supplied
 * passwords cannot be interpreted as shell metacharacters.
 */
export function run(
  command: string,
  args: string[],
  options: RunOptions = {}
): Promise<RunResult> {
  const {
    timeoutMs = 120_000,
    cwd,
    env,
    maxBuffer = 32 * 1024 * 1024,
  } = options;

  return new Promise((resolve, reject) => {
    execFile(
      command,
      args,
      {
        timeout: timeoutMs,
        cwd,
        maxBuffer,
        env: { ...process.env, ...env },
        windowsHide: true,
      },
      (error, stdout, stderr) => {
        if (!error) {
          resolve({ stdout: String(stdout), stderr: String(stderr) });
          return;
        }

        const code = (error as NodeJS.ErrnoException).code;

        if (code === 'ENOENT') {
          reject(
            new AppError(
              'ENGINE_UNAVAILABLE',
              `The "${command}" engine is not installed on this server.`
            )
          );
          return;
        }

        if ((error as { killed?: boolean }).killed || code === 'ETIMEDOUT') {
          reject(
            new AppError(
              'TIMEOUT',
              'The document took too long to process.',
              'Try a smaller file, or split it into parts first.'
            )
          );
          return;
        }

        const detail = String(stderr || stdout || error.message).trim();
        reject(
          new AppError(
            'PROCESSING_FAILED',
            `${command} failed: ${detail.slice(0, 400)}`
          )
        );
      }
    );
  });
}

/** Returns true when a binary exists and responds to a version probe. */
export async function probe(
  command: string,
  args: string[] = ['--version']
): Promise<boolean> {
  try {
    await run(command, args, { timeoutMs: 10_000 });
    return true;
  } catch {
    return false;
  }
}
