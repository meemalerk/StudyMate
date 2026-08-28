# StudyMate

A study companion app built with Expo — track tasks, assignments and exams, manage subjects, run a study timer, plan sessions on a calendar, set study goals, and get reminders.

## Features

- **Dashboard (Home)** — today's sessions, hours studied, completion stats, upcoming deadlines, and a weekly progress chart. A hamburger menu (top right) navigates to every other screen.
- **Tasks** — general tasks, assignments, and exams, each with an optional subject and due date.
- **Subjects** — organize tasks by subject, with a per-subject weekly study goal.
- **Study Timer** — preset or custom durations, optionally tagged to a subject. Tracks real elapsed time (not just a tick counter), so it stays accurate even if the app is backgrounded or the phone is locked; completed sessions are logged automatically, and if Reminders are on you'll get a notification the moment a session finishes, even away from the app.
- **Study Calendar** — pick a date to see scheduled sessions, deadlines due that day, and sessions completed that day; schedule new sessions with an optional time.
- **Study Goals** — daily, weekly, and per-subject hour goals with progress bars.
- **Reminders** — local notifications for upcoming deadlines, scheduled study sessions, and timer completion.
- **Settings** — toggle reminders and choose a theme (System / Light / Dark).

All data (tasks, subjects, sessions, goals, preferences) is saved on-device and persists across app restarts.

## Requirements

- [Node.js](https://nodejs.org/) (LTS)
- npm
- The [Expo Go](https://expo.dev/go) app on your phone (iOS or Android) — **the Expo Go build on the App/Play Store must support Expo SDK 54**, which is what this project targets. If Expo Go reports a version mismatch, either wait for Apple/Google to approve the newer Expo Go build, or ask about downgrading this project to match whatever SDK your installed Expo Go currently supports.

## Setup

```bash
npm install
```

## Running the app

```bash
npx expo start
```

Wait for `Waiting on http://localhost:8081` in the terminal, then either:

- Scan the QR code shown in the terminal with your phone's camera (iOS) or the Expo Go app (Android), **or**
- On your phone, open Expo Go → your project should appear under "Recently in development" if you're signed into the same Expo account, **or**
- Manually enter `exp://<your-computer's-LAN-IP>:8081` in Expo Go / Safari (find your IP with `ipconfig` on Windows or `ifconfig`/`ipconfig getifaddr en0` on Mac).

Your phone and computer must be on the **same Wi-Fi network**.

### Don't use `--tunnel`

Expo's built-in `--tunnel` flag relies on a shared, legacy ngrok integration that is frequently broken (`CommandError: failed to start tunnel`, `remote gone away`, timeouts). Plain `npx expo start` over your local network (LAN mode, the default) is far more reliable — fix LAN connectivity issues instead of reaching for `--tunnel`. Also avoid `-d`/`--dev-client` — that's for a custom development build, not Expo Go, and this project doesn't have `expo-dev-client` installed.

### Troubleshooting: phone can't connect over LAN

If Expo Go can't reach the dev server ("internet connection appears to be offline" or similar) even though your phone and computer are on the same Wi-Fi:

**Windows Firewall** is the most common cause — it silently blocks incoming connections to `node.exe` on networks marked "Public." Fix it by adding a firewall rule for your active Node.js install. In an **elevated** PowerShell (right-click → Run as administrator):

```powershell
# Find your active node.exe path first:
where node

# Then allow it through the firewall (adjust the path if different):
New-NetFirewallRule -DisplayName "node.exe" -Direction Inbound -Program "C:\Program Files\nodejs\node.exe" -Action Allow -Profile Any -Protocol TCP
New-NetFirewallRule -DisplayName "node.exe" -Direction Inbound -Program "C:\Program Files\nodejs\node.exe" -Action Allow -Profile Any -Protocol UDP
```

**Port 8081 already in use**: on Windows, stopping the `expo start` process doesn't always kill the underlying Node process. If you see "Port 8081 is being used by another process," open Task Manager, find the stray `node.exe`, and end it (or restart your terminal/computer).

## Notifications

Reminders use **local** scheduled notifications (`expo-notifications`), which work fine in Expo Go — no custom development build needed. Turn them on from Settings (hamburger menu → Settings → Reminders), which will prompt for OS notification permission. Once enabled, you'll get notified for upcoming task deadlines, scheduled study sessions (from the Calendar), and when a running Timer session completes — including while the app is backgrounded or the phone is locked. Settings also has a "Send test notification" button that fires ~5 seconds later, so you can verify permissions and delivery without waiting for a real reminder.

## Tech stack

- [Expo SDK 54](https://docs.expo.dev/versions/v54.0.0/) / React Native 0.81
- [Expo Router](https://docs.expo.dev/router/introduction/) (file-based routing, screens under `src/app/`)
- TypeScript
- `@react-native-async-storage/async-storage` for on-device persistence
- `@react-native-community/datetimepicker` for date/time pickers
- `expo-notifications` for local reminders
- `@expo/vector-icons` (Ionicons)

## Project structure

```
src/
  app/            Screens (file-based routes): index (Home), subjects, timer, calendar, settings
  components/      Shared UI primitives (themed text/view, etc.)
  constants/       Theme tokens, task-type definitions
  hooks/           App state — tasks, subjects, sessions/goals, notifications, theme preference
  utils/           Date helpers, AsyncStorage helpers
```

Each piece of app state (tasks, subjects, sessions & goals, notification preference, theme preference) lives in its own React context under `src/hooks/`, persisted to `AsyncStorage` and loaded on startup.

## Linting

```bash
npx expo lint
```
