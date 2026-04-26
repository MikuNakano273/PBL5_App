# NavicAid Web App Guide

## Server status

- App API URL is hardcoded to `http://192.168.0.11:8000`.
- Local health check passed for `http://localhost:8000/api/health`.
- Demo data has been seeded into the local server MongoDB used by `http://192.168.0.11:8000`.
- Seed script: `D:\PBL5_Server\scripts\seed_demo_data.py`.
- Demo DB includes `blind-1`, one device, three GPS rows, three alerts, and one care link.

## Demo accounts

- Blind user: `blind@example.com` / `password123`
- Family user: `family@example.com` / `password123`
- Admin user: `admin@example.com` / `password123`

## Start the web app

From `D:\My projects\PBL5_App`:

```bash
npm run web
```

Open the Expo web URL shown in the terminal. It is usually one of:

- `http://localhost:8080`

The current dev server was started on `http://localhost:8080`.

## Use the app

1. Open the `Settings` tab.
2. Press `Health`.
   - If the server is reachable, the status text changes to `Server san sang. Hay dang nhap tai khoan mobile.`
   - If it fails, check that the PBL5 API is running on `192.168.0.11:8000`.
   - CORS is enabled for `http://localhost:8080` on the PBL5 server.
3. Enter `blind@example.com` and `password123`.
4. Press `Dang nhap`.
5. After login succeeds, open:
   - `Dashboard` to load safety summary.
   - `Alerts` to load alert history.
   - `Map` to load latest GPS/device status.
   - `Users` to load care links.

## Seeded data

The app default blind user id is `blind-1`.

- Dashboard shows one online demo cane and three alerts today.
- Alerts shows three demo alerts.
- Map shows the latest GPS point near Da Nang.
- Users shows one active care link from `blind-1` to `family-1`.

To reset demo data, rerun:

```bash
cd /d D:\PBL5_Server
python scripts\seed_demo_data.py
```
