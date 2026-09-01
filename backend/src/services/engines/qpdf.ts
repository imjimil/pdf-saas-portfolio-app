import { run } from '../../lib/exec';
import { AppError } from '../../lib/errors';
import { getCapabilities } from '../../lib/binaries';

/**
 * qpdf handles real PDF encryption. pdf-lib cannot encrypt at all, which is why
 * the previous password-protection feature never worked.
 */

export interface Permissions {
  /** false = no printing, 'low' = degraded resolution, true = full quality. */
  printing: boolean | 'low';
  modifying: boolean;
  copying: boolean;
  annotating: boolean;
}

export async function isAvailable(): Promise<boolean> {
  return (await getCapabilities()).qpdf;
}

function requireEngine(available: boolean): void {
  if (!available) {
    throw new AppError(
      'ENGINE_UNAVAILABLE',
      'PDF encryption is not available on this server.',
      'This feature requires the full server environment.'
    );
  }
}

export async function encrypt(
  inputPath: string,
  outputPath: string,
  userPassword: string,
  ownerPassword: string,
  permissions: Permissions
): Promise<void> {
  requireEngine(await isAvailable());

  const printValue =
    permissions.printing === false
      ? 'none'
      : permissions.printing === 'low'
        ? 'low'
        : 'full';

  // Arguments go through execFile, so passwords are never shell-interpreted.
  const args = [
    '--encrypt',
    userPassword,
    ownerPassword || userPassword,
    '256',
    `--print=${printValue}`,
    `--modify=${permissions.modifying ? 'all' : 'none'}`,
    `--extract=${permissions.copying ? 'y' : 'n'}`,
    `--annotate=${permissions.annotating ? 'y' : 'n'}`,
    '--',
    inputPath,
    outputPath,
  ];

  try {
    await run('qpdf', args, { timeoutMs: 120_000 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('invalid password')) {
      throw new AppError(
        'ENCRYPTED_FILE',
        'This PDF is already password-protected and must be unlocked first.'
      );
    }
    throw error;
  }
}

/** Removes encryption when the current password is known. */
export async function decrypt(
  inputPath: string,
  outputPath: string,
  password: string
): Promise<void> {
  requireEngine(await isAvailable());

  try {
    await run(
      'qpdf',
      [`--password=${password}`, '--decrypt', '--', inputPath, outputPath],
      { timeoutMs: 120_000 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.toLowerCase().includes('password')) {
      throw new AppError('INVALID_INPUT', 'That password is incorrect.');
    }
    throw error;
  }
}

/** Repairs damaged cross-reference tables without re-rendering content. */
export async function linearize(inputPath: string, outputPath: string): Promise<void> {
  await run('qpdf', ['--linearize', '--', inputPath, outputPath], {
    timeoutMs: 120_000,
  });
}
