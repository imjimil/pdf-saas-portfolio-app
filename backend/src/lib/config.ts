import crypto from 'crypto';

/**
 * Secrets, resolved once at startup.
 *
 * The previous code fell back to the literal string 'fallback-secret' whenever
 * JWT_SECRET was unset, which would have signed production tokens with a value
 * published in the repository. Production now refuses to start without a real
 * secret; development gets an ephemeral random one.
 */
function requireSecret(name: string): string {
  const value = process.env[name];
  if (value && value.length >= 16) return value;

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      `${name} is missing or too short. Set it to a random string of at least 16 characters.`
    );
  }

  console.warn(
    `${name} is not set — using a random development secret. Sessions will end when the server restarts.`
  );
  return crypto.randomBytes(32).toString('hex');
}

export const JWT_SECRET = requireSecret('JWT_SECRET');
export const SESSION_SECRET = requireSecret('SESSION_SECRET');
export const JWT_EXPIRES_IN = '7d';
