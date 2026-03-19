import { app } from 'electron';
import { cpSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { getJdiClawHomeDir } from './paths';
import { logger } from './logger';

function pathHasEntries(path: string): boolean {
  try {
    return readdirSync(path).length > 0;
  } catch {
    return false;
  }
}

function copyMissingEntries(sourceDir: string, targetDir: string): void {
  mkdirSync(targetDir, { recursive: true });

  for (const entry of readdirSync(sourceDir)) {
    const sourcePath = join(sourceDir, entry);
    const targetPath = join(targetDir, entry);

    if (existsSync(targetPath)) {
      const sourceIsDir = statSync(sourcePath).isDirectory();
      const targetIsDir = statSync(targetPath).isDirectory();
      if (sourceIsDir && targetIsDir) {
        copyMissingEntries(sourcePath, targetPath);
      }
      continue;
    }

    cpSync(sourcePath, targetPath, {
      recursive: true,
      dereference: true,
      force: false,
      errorOnExist: false,
    });
  }
}

function resolveLegacyCandidates(): string[] {
  const candidates = [
    join(app.getPath('userData'), 'openclaw'),
    join(app.getPath('home'), 'Library', 'Application Support', 'jdiclaw', 'openclaw'),
    join(app.getPath('home'), 'Library', 'Application Support', 'clawx', 'openclaw'),
  ];

  return [...new Set(candidates)];
}

export function migrateLegacyJdiClawData(): void {
  const targetDir = getJdiClawHomeDir();
  const legacyCandidates = resolveLegacyCandidates().filter((candidate) => existsSync(candidate));

  if (legacyCandidates.length === 0) {
    return;
  }

  mkdirSync(targetDir, { recursive: true });

  const targetWasEmpty = !pathHasEntries(targetDir);

  for (const sourceDir of legacyCandidates) {
    if (sourceDir === targetDir) continue;
    try {
      copyMissingEntries(sourceDir, targetDir);
      logger.info(`[migration] Copied JdiCLaw runtime data from ${sourceDir} to ${targetDir}`);
    } catch (error) {
      logger.warn(`[migration] Failed to migrate data from ${sourceDir} to ${targetDir}:`, error);
    }
  }

  if (targetWasEmpty && pathHasEntries(targetDir)) {
    logger.info(`[migration] JdiCLaw runtime state initialized at ${targetDir}`);
  }
}
