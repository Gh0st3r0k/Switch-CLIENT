# Development guide

## Local workflow

```sh
npm ci
npm test
npm start
```

Use the committed lockfile for installations. There is no bundler or renderer framework; Electron loads the files in `src/` directly. `npm test` runs API regression tests with Node's built-in runner.

## Code boundaries

- **`api.js`** owns HTTP paths, a five-second timeout, JSON/text parsing, and a consistent `null` result on request failure.
- **`main.js`** owns windows and named IPC handlers.
- **`preload.js`** exposes the renderer's supported operations without unrestricted IPC or Node access.
- **Renderer scripts** update their own DOM and call the preload API.
- **`shared/ui.js`** provides polling that waits for a request to finish before scheduling another. Polling stops when its window unloads.

Keep renderer data in `textContent` rather than interpolating server responses into HTML. Keep request bodies out of logs, especially login payloads.

## API compatibility

The server address is `http://localhost:5215/api`. Changing it also requires updating the connection policy in `main.js`.

| Server contract                       | Client behavior                                                      |
| ------------------------------------- | -------------------------------------------------------------------- |
| MAC lifetime is in milliseconds       | The settings screen converts to and from seconds.                    |
| Counter values are decimal strings    | The statistics screen displays them without changing the API schema. |
| Port status is a numeric .NET enum    | `1` is online; other or unavailable values show offline.             |
| MAC data has `mainMacs` and `newMacs` | The dashboard combines both collections before updating rows.        |
| `expiration` is a last-seen timestamp | The dashboard labels the column “Last Seen”.                         |

## Headless Linux development

Install the native libraries required by Electron and a virtual X server such as Xvfb. Start the backend, then run:

```sh
Xvfb :99 -screen 0 1280x800x24 -nolisten tcp &
DISPLAY=:99 npm start
```

Some isolated cloud containers cannot provide Chromium's sandbox. In that specific development environment, the trusted local app can be launched with:

```sh
DISPLAY=:99 npm start -- --no-sandbox --disable-gpu
```

This flag disables Chromium's sandbox. Keep normal desktop runs sandboxed, and do not use the exception to load untrusted content.

If Electron's binary download cannot use the configured network proxy, install with:

```sh
ELECTRON_GET_USE_PROXY=1 npm ci
```

Set `XDG_CONFIG_HOME`, `XDG_CACHE_HOME`, and `electron_config_cache` to writable local directories when the home directory is read-only.

## Desktop validation

1. Run `npm test`.
2. Start the backend and verify `/api/ports` responds.
3. Open the app; check login with invalid and valid credentials.
4. Confirm the dashboard opens and settings display the current name and lifetime.
5. Update the name and lifetime, reopen settings, and confirm the values round-trip.
6. With eligible adapters, open a port and verify status and protocol counters.
7. Clear the MAC table and confirm stale rows disappear on the next refresh.
8. Close the app and verify polling and windows stop.

Hardware capture, forwarding, and real traffic counters need compatible backend interfaces. API tests and an empty-port dashboard alone do not validate those behaviors.
