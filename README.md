# Shule MVP1

Shule MVP1 is a local-first school results management prototype. It lets a school set up students and subjects, enter or upload marks, automatically compute rankings/statistics, and print report cards.

## What MVP1 Includes

- Student register
- School profile setup
- Subject-based marks entry
- CSV template download and upload
- Automatic totals, averages, grades, and positions
- Subject statistics
- Printable student report cards
- Local JSON data storage for testing

## Run Locally

```powershell
node server.js
```

Open:

```text
http://localhost:3000
```

The app is currently verified locally at:

```text
http://localhost:3000
```

For LAN testing inside a school, run the app on one computer and open this URL from another device on the same network:

```text
http://<server-computer-ip>:3000
```

## Deployment Modes

### 1. Local School Mode

This is the starting mode for schools that do not want internet hosting.

- One computer acts as the school server.
- The app runs on the local network.
- Data is stored locally.
- Teachers connect through school Wi-Fi or LAN.
- Backups should be copied regularly to an external drive or cloud folder.

### 2. Cloud Mode

This is the later production mode for schools comfortable with online hosting.

- MVP1 can be hosted on Render as a Node web service with a persistent disk.
- Production should move the data layer to Supabase PostgreSQL or managed PostgreSQL.
- Authentication and file storage can then be handled by Supabase.
- Schools access the system through a secure domain.

## Render Deployment

This repository includes `render.yaml` for online deployment.

Recommended MVP1 cloud path:

1. Push this project to GitHub.
2. Open Render.
3. Create a new Blueprint from the GitHub repository.
4. Render reads `render.yaml`.
5. The app runs with a persistent disk at `/var/data`.

For MVP1, Render is a better fit than Vercel because the app currently runs a small Node server and writes a local database file. Vercel becomes a better fit after MVP2 moves storage to Supabase/PostgreSQL.

## Data Storage

MVP1 stores data in:

```text
data/shule-db.json
```

This is intentional for fast local testing. The backend is written so the next step can replace JSON storage with PostgreSQL while keeping the same screens and calculation logic.

## Suggested MVP2

- Login roles for admin, teacher, head teacher, and bursar
- PostgreSQL database adapter
- Class/stream management screens
- Teacher-subject assignment
- PDF export instead of browser print only
- Excel `.xlsx` upload in addition to CSV
- Backup and restore screen
- Audit trail for submitted marks
