# Clockify

A cross-platform desktop time-tracking application built with Electron, React, and TypeScript.

## Features

- **Live Timer** — Start, pause, resume, and stop a stopwatch with one click
- **Task Descriptions** — Label what you're working on before or during tracking
- **Project Tagging** — Assign color-coded projects (Work, Personal, Learning, Meeting)
- **History** — Browse past entries grouped by day with per-day totals
- **Reports** — Dashboard with today, this week, and all-time stats plus per-project breakdowns
- **Persistent Storage** — All data saved locally as JSON (survives restarts)
- **Dark Theme** — Modern dark UI out of the box

## Tech Stack

- [Electron](https://www.electronjs.org/) — Desktop shell
- [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) — Renderer UI
- [Vite](https://vitejs.dev/) — Dev server and bundler
- [electron-builder](https://www.electron.build/) — Packaging for macOS and Windows
- [Lucide React](https://lucide.dev/) — Icons
- [date-fns](https://date-fns.org/) — Date/time formatting

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- npm >= 9

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

Opens the Electron app with Vite hot-reload enabled.

### Build

```bash
npm run build
```

Compiles TypeScript and bundles the renderer and main process for production.

### Package

```bash
# Package for current platform
npm run dist

# macOS only (.dmg)
npm run dist:mac

# Windows only (.exe / NSIS installer)
npm run dist:win
```

Installers are written to the `release/` directory.

## Project Structure

```
clockify/
├── electron/
│   ├── main.ts          # Window creation and app lifecycle
│   ├── preload.ts       # Secure IPC bridge (contextBridge)
│   ├── ipc.ts           # IPC handlers for entries and projects
│   └── store.ts         # JSON file persistence
├── src/
│   ├── main.tsx         # React entry point
│   ├── App.tsx          # App shell with sidebar navigation
│   ├── index.css        # Dark theme styles
│   ├── components/
│   │   ├── Timer.tsx    # Stopwatch with start/pause/stop
│   │   ├── History.tsx  # Entries grouped by date
│   │   ├── Reports.tsx  # Stats cards and project breakdown
│   │   ├── Sidebar.tsx  # Navigation sidebar
│   │   ├── TimeEntryRow.tsx
│   │   └── ProjectBadge.tsx
│   ├── hooks/
│   │   ├── useTimer.ts  # Stopwatch state machine
│   │   └── useEntries.ts
│   ├── types/
│   │   └── index.ts
│   └── lib/
│       └── ipc.ts       # Typed renderer-side IPC wrappers
├── index.html
├── vite.config.ts
├── electron-builder.yml
├── tsconfig.json
└── package.json
```

## License

MIT
# livro_clockify
