# Windows release checklist

This document describes the controlled release process for `MarkusSela/PokeTokenBarWindows-Lab`.

## Release principles

- The first release is a **private preview**.
- The macOS repository remains untouched and is referenced only as upstream inspiration.
- No credentials, database, local state, logs, prompts, caches, or personal paths enter Git or release assets.
- The release is an installer plus a checksum file, not a dump of the development directory.
- Public visibility is a separate decision after the private preview has been installed and reviewed.

## 1. Inspect the workspace

```shell
git status --short --untracked-files=all
npm ci
```

Confirm that the working tree contains no `.env`, key/certificate file, database, WAL/SHM sidecar, companion save, log, `node_modules/`, or build output intended for release.

## 2. Run the quality gates

```shell
npm test
node --check main.cjs
npm run audit:release
```

The audit must finish with no findings. If a finding names a personal path or secret, stop and remove it from the source rather than masking it in the report.

## 3. Build the Windows artifacts

Close all running instances of PokeTokenBar Windows Lab before building:

```shell
npm run dist
```

Expected outputs:

- `dist/PokeTokenBar-Windows-Lab-Setup-0.1.0.exe`
- `dist/win-unpacked/`

Verify the packaged output:

```shell
node scripts/audit-release.cjs dist/win-unpacked
```

The packaged audit must also finish with no findings. Inspect the package file list and confirm that no `companion-state.json`, Hermes database, provider log, `.env`, key, or diagnostic directory is present.

## 4. Create the checksum

In Git Bash:

```shell
sha256sum dist/PokeTokenBar-Windows-Lab-Setup-0.1.0.exe > dist/SHA256SUMS.txt
```

In PowerShell, the equivalent is:

```powershell
(Get-FileHash .\\dist\\PokeTokenBar-Windows-Lab-Setup-0.1.0.exe -Algorithm SHA256).Hash
```

Do not include a personal machine path in the checksum file.

## 5. Verify the packaged app

Launch the unpacked executable or installer in a clean test profile. Confirm:

- normal startup is tray-first;
- clicking the tray icon opens Home;
- Home does not create a taskbar button;
- closing Home leaves the app resident in the tray;
- the context menu can open, refresh, and quit;
- settings persist only in the app's own local-data directory;
- provider reads remain read-only;
- no diagnostic CDP port or temporary test process remains active;
- no personal values appear in the screenshots or release notes.

Use synthetic fixture data for screenshots and restore/remove that profile before the release is committed.

## 6. Prepare the private GitHub release

Repository: <https://github.com/MarkusSela/PokeTokenBarWindows-Lab>

Recommended private-preview assets:

- `PokeTokenBar-Windows-Lab-Setup-0.1.0.exe`
- `SHA256SUMS.txt`

Recommended tag and title:

- tag: `v0.1.0`
- title: `PokeTokenBar Windows Lab v0.1.0 — private preview`

The release body should contain:

- a short feature summary;
- exact test/audit result;
- Windows version and architecture tested;
- unsigned-installer/SmartScreen warning;
- checksum verification instructions;
- a reminder that the repository is private and that no personal data is included.

Do not upload screenshots from a personal desktop, state exports, logs, databases, or any credential-bearing file. Documentation screenshots belong in `docs/images/` and must be synthetic.

## 7. Final review before visibility changes

After installation, inspect the repository and release from a second clean view. Only after the private preview is approved should the repository visibility and release visibility be reconsidered. Making the repository public is not part of the private-preview procedure.
