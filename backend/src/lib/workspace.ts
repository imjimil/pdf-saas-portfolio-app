import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import crypto from 'crypto';

const ROOT = process.env.WORK_DIR || path.join(os.tmpdir(), 'mypdftools');

/**
 * An isolated scratch directory for a single request.
 *
 * Every job gets its own directory and it is always removed afterwards, which
 * is what keeps Render's ephemeral disk from filling up with orphaned uploads.
 */
export class Workspace {
  readonly dir: string;

  private constructor(dir: string) {
    this.dir = dir;
  }

  static async create(label = 'job'): Promise<Workspace> {
    const id = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    const dir = path.join(ROOT, `${label}-${id}`);
    await fs.mkdir(dir, { recursive: true });
    return new Workspace(dir);
  }

  /** Absolute path inside the workspace, with traversal blocked. */
  file(name: string): string {
    const safe = path.basename(name).replace(/[^\w.\- ]+/g, '_');
    return path.join(this.dir, safe || 'file');
  }

  async subdir(name: string): Promise<string> {
    const dir = this.file(name);
    await fs.mkdir(dir, { recursive: true });
    return dir;
  }

  async dispose(): Promise<void> {
    try {
      await fs.rm(this.dir, { recursive: true, force: true });
    } catch {
      // A failed cleanup must never surface to the user.
    }
  }
}

/** Runs `fn` with a workspace that is destroyed even if `fn` throws. */
export async function withWorkspace<T>(
  label: string,
  fn: (workspace: Workspace) => Promise<T>
): Promise<T> {
  const workspace = await Workspace.create(label);
  try {
    return await fn(workspace);
  } finally {
    await workspace.dispose();
  }
}

/**
 * Deletes scratch directories left behind by a crash or restart.
 * Runs on boot and hourly.
 */
export async function sweepStaleWorkspaces(maxAgeMs = 60 * 60 * 1000): Promise<void> {
  try {
    const entries = await fs.readdir(ROOT, { withFileTypes: true });
    const cutoff = Date.now() - maxAgeMs;

    await Promise.all(
      entries.map(async (entry) => {
        if (!entry.isDirectory()) return;
        const full = path.join(ROOT, entry.name);
        try {
          const stat = await fs.stat(full);
          if (stat.mtimeMs < cutoff) {
            await fs.rm(full, { recursive: true, force: true });
          }
        } catch {
          // Ignore races with concurrent cleanup.
        }
      })
    );
  } catch {
    // Root may not exist yet on first boot.
  }
}

export const WORKSPACE_ROOT = ROOT;
