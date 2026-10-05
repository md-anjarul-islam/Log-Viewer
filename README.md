# Log Viewer

A desktop app (Electron) for talking to hardware over a serial port. Define
commands, run them on demand or on a schedule, and watch the responses stream
into a searchable, filterable log. A second, independent serial connection
captures the device's free-running **debug console**, and clicking any log row
shows the debug lines logged around that moment.

## Features

- **Commands** – shown and edited as **hex** (default) or **ASCII** via a toggle (ASCII supports `\r \n \t \\ \xHH` escapes); they are always stored and sent as hex bytes. Named commands with optional categories, enable/disable, a repeat interval, and per-command timeout / idle-gap / terminator settings.
- **Live log stream** – virtualized table that handles very large logs; hex / text / other display encodings; text and regex search; filters by command and time range; export.
- **Debug console** – separate serial connection with its own stored log, search and filters.
- **Click-to-correlate** – click a log row to open a resizable side panel with the debug logs in a ±1s / ±5s / ±30s window around it, plus a jump into the debug view at that time.
- **Resizable panes** – drag any divider to resize, double-click to reset; sizes are remembered.
- **Clear view** – empties the on-screen lists only (database untouched; *Reload* brings the rows back). *Clear logs…* deletes from the database.
- **Persistent storage** – everything is stored in a local SQLite database.
- **Simulator** – no hardware needed, see [TESTING.md](TESTING.md).

## Download

Installers for Linux (`.AppImage`, `.deb`), Windows (`.exe`) and macOS
(`.dmg`, Apple Silicon and Intel) are attached to each
[GitHub Release](../../releases). Linux packages are built on Ubuntu 22.04 and
run on 22.04 and newer. Windows and macOS builds are currently **unsigned**, so
expect a SmartScreen / Gatekeeper warning.

## Toolchain

| Tool | Version | Where it is pinned |
| --- | --- | --- |
| Node.js | 22 (>= 22.12) | `.nvmrc`, `engines` in `package.json`, CI |
| npm | >= 10 | `engines` in `package.json` |
| Electron | 44.5.1 | `package.json` (exact) |
| electron-builder | see `package.json` | `package.json` (exact) |
| electron-vite / Vite | 5 / 7 | `package.json` (exact) |
| better-sqlite3 | 13 (needs Node >= 22) | `package.json` (exact) |
| React / Tailwind | 19 / 4 | `package.json` (exact) |

All dependency versions are pinned exactly and `engine-strict` is on
(`.npmrc`), so installing with the wrong Node version fails early. Only the two
native modules (`better-sqlite3`, `serialport`) are runtime dependencies; the
UI libraries are bundled by Vite and so live in `devDependencies`.

## Development

```bash
nvm use            # picks Node 22 from .nvmrc
npm ci
npm run dev        # Electron + Vite with hot reload
npm run typecheck
```

On Linux you need a C/C++ toolchain and Python for native module rebuilds
(`build-essential python3`). Dev mode launches with `--ozone-platform=x11`.

## Building installers

```bash
npm run package:linux   # AppImage + deb
npm run package:win     # NSIS installer
npm run package:mac     # dmg
```

Output goes to `dist/`. Native modules are compiled for the current OS, so
build each platform on that platform. **Build Linux packages on Ubuntu 22.04**
(or in a 22.04 container): binaries built on a newer distro link against a
newer glibc/libstdc++ and fail on 22.04 with `better-sqlite3` load errors.

## CI / releases

- `.github/workflows/ci.yml` – typecheck and build on every PR / push to `main`.
- `.github/workflows/release.yml` – on a `v*` tag, builds Linux (ubuntu-22.04), Windows, macOS arm64 and macOS x64, then publishes the installers to a GitHub Release.

```bash
# bump "version" in package.json, commit, then:
git tag v0.2.0 && git push origin v0.2.0
```

The workflow can also be run manually (*Actions → Release → Run workflow*) to
produce installers as build artifacts without creating a release.

## Project layout

```
src/main/       Electron main process: SQLite (db/), serial (serial/), schedulers, IPC handlers (ipc/)
src/preload/    contextBridge API exposed as window.api
src/renderer/   React UI (components/, hooks/, zustand store/)
src/shared/     IPC channel names and types shared by all three
```

Data model: `commands`, `categories`, `logs` (hex `raw`, source
manual/scheduled/unsolicited) and `debug_logs`, versioned through
`PRAGMA user_version` migrations in `src/main/db/migrations.ts` (append only).
The database and `settings.json` live in the Electron `userData` directory.

## Troubleshooting

- **`better-sqlite3` / `GLIBC_x.y` / `NODE_MODULE_VERSION` error on startup** – the package was built on a newer OS or a different Node/Electron. Rebuild on Ubuntu 22.04 with `npm ci` and the pinned versions.
- **Serial permission denied on Linux** – add your user to the `dialout` group and log in again.
- **Blank window on some Wayland setups** – the app already passes `--ozone-platform=x11`.
