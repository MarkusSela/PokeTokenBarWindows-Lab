#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const releaseDir = process.argv[2] ? path.resolve(process.argv[2]) : null;
const blockedNames = [
  /^companion-state.*\.json$/i,
  /^builder-debug\.yml$/i,
  /^debug\.log$/i,
  /^\.test-cache$/i,
  /^pokeapi-cache$/i,
  /^\.env(?:\..*)?$/i,
  /\.(?:db(?:-(?:wal|shm))?|sqlite\d*(?:-(?:wal|shm))?|pem|p12|pfx|key|log)$/i,
];
const pathPatterns = [
  /C:\\Users\\[^\\x00\\r\\n ]+/i,
  /[A-Z]:\\Users\\[^\\x00\\r\\n ]+/i,
  /\/Users\/[^\/\x00\r\n ]+/i,
];
const credentialPatterns = [
  /-----BEGIN [^-]+ PRIVATE KEY-----/i,
  /\b(?:api[_-]?key|secret|password|passwd|authorization|bearer|token)\b\s*[:=]\s*["']?[A-Za-z0-9_./+=-]{8,}/i,
  /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{20,}\b/i,
  /\bsk-[A-Za-z0-9_-]{16,}\b/,
];
const safePathPatterns = [
  /C:[\\/]nonexistent(?:[\\/]|\b)/i,
  /C:[\\/]Users[\\/](?:Test|Demo)(?:[\\/]|\b)/i,
  /C:[\\/]Demo(?:[\\/]|\b)/i,
  /[\\/]Users[\\/](?:Test|Demo)(?:[\\/]|\b)/i,
];
const sourceRoots = ['.'];

function errorText(error) {
  if (error && error.code) return `${error.code}${error.message ? `: ${error.message}` : ''}`;
  return error instanceof Error ? error.message : String(error);
}

function filesUnder(target, skipBuildDirs = true) {
  let exists;
  try {
    exists = fs.existsSync(target);
  } catch (error) {
    throw new Error(`cannot inspect ${target}: ${errorText(error)}`);
  }
  if (!exists) return [];

  let stat;
  try {
    stat = fs.statSync(target);
  } catch (error) {
    throw new Error(`cannot inspect ${target}: ${errorText(error)}`);
  }
  if (stat.isFile()) return [target];
  if (!stat.isDirectory()) return [];

  let entries;
  try {
    entries = fs.readdirSync(target, { withFileTypes: true });
  } catch (error) {
    throw new Error(`cannot inspect ${target}: ${errorText(error)}`);
  }

  const result = [];
  for (const entry of entries) {
    if (['node_modules', '.git', 'NUL'].includes(entry.name)) continue;
    if (
      skipBuildDirs &&
      (['dist', '.test-cache', 'pokeapi-cache', 'release'].includes(entry.name) ||
        entry.name.startsWith('dist-final'))
    ) continue;
    if (!entry.isFile() && !entry.isDirectory()) continue;
    const child = path.join(target, entry.name);
    result.push(...filesUnder(child, skipBuildDirs));
  }
  return result;
}

function relative(file) {
  return path.relative(root, file).replaceAll(path.sep, '/');
}

function auditFiles(files, label) {
  const findings = [];
  for (const file of files) {
    let data;
    try {
      data = fs.readFileSync(file);
    } catch (error) {
      throw new Error(`could not read ${label} file ${relative(file)}: ${errorText(error)}`);
    }
    const name = path.basename(file);
    const relativeName = relative(file);
    const artifactHit =
      blockedNames.some((pattern) => pattern.test(name)) ||
      /(?:^|[\\/])(?:\.test-cache|pokeapi-cache)(?:[\\/]|$)/i.test(relativeName);
    if (data.includes(0)) {
      if (artifactHit) {
        findings.push({
          label,
          file: relative(file),
          pathHit: false,
          credentialHit: false,
          artifactHit: true,
        });
      }
      continue;
    }
    const text = data.toString('utf8');
    const pathHit = pathPatterns.some((pattern) => {
      const globalPattern = new RegExp(pattern.source, `${pattern.flags.replace('g', '')}g`);
      return [...text.matchAll(globalPattern)].some(
        ([candidate]) => !safePathPatterns.some((safe) => safe.test(candidate)),
      );
    });
    const credentialHit = credentialPatterns.some((pattern) => pattern.test(text));
    if (pathHit || credentialHit || artifactHit) {
      findings.push({
        label,
        file: relative(file),
        pathHit,
        credentialHit,
        artifactHit,
      });
    }
  }
  return findings;
}

let sourceFiles = [];
let sourceError = null;
try {
  sourceFiles = sourceRoots.flatMap((entry) =>
    filesUnder(path.join(root, entry)),
  );
} catch (error) {
  sourceError = `source tree could not be inspected: ${errorText(error)}`;
}

let releaseFiles = [];
let releaseError = null;
if (releaseDir) {
  if (!fs.existsSync(releaseDir)) {
    releaseError = 'directory does not exist';
  } else {
    let stat;
    try {
      stat = fs.statSync(releaseDir);
    } catch {
      releaseError = 'directory could not be inspected';
    }
    if (!releaseError && !stat.isDirectory()) {
      releaseError = 'path is not a directory';
    } else if (!releaseError) {
      try {
        releaseFiles = filesUnder(releaseDir, false);
      } catch (error) {
        releaseError = `directory could not be inspected: ${errorText(error)}`;
      }
      if (!releaseError && releaseFiles.length === 0) {
        releaseError = 'directory is empty';
      }
    }
  }
}

const errors = [];
if (sourceError) errors.push(sourceError);
if (releaseError) errors.push(`release directory error: ${releaseError}`);
const findings = [];
try {
  if (!sourceError) findings.push(...auditFiles(sourceFiles, 'source'));
  if (releaseDir && !releaseError) findings.push(...auditFiles(releaseFiles, 'release'));
} catch (error) {
  errors.push(errorText(error));
}
if (errors.length) console.error(`Release audit error: ${errors.join('; ')}`);

const result = {
  safe: errors.length === 0 && findings.length === 0,
  scannedSourceFiles: sourceFiles.length,
  scannedReleaseFiles: releaseFiles.length,
  errors,
  findings,
};
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.safe ? 0 : 1;
