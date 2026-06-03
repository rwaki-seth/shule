# Shule Deployment Notes

## Local Server Deployment

Recommended for schools that want the system available only inside their compound.

### Requirements

- Windows desktop/laptop or small server
- Node.js 18+
- Stable power
- School LAN or Wi-Fi
- Backup drive or backup folder

### Steps

1. Copy the Shule project folder to the server computer.
2. Start the app:

   ```powershell
   node server.js
   ```

3. Find the server computer IP address:

   ```powershell
   ipconfig
   ```

4. Teachers open:

   ```text
   http://<server-computer-ip>:3000
   ```

### Local Backup

Back up this file daily during results entry:

```text
data/shule-db.json
```

## Cloud Deployment

Recommended when the school wants access outside the school network.

### MVP1 Online Hosting

- Host: Render web service
- Runtime: Node.js
- Persistent data: Render disk mounted at `/var/data`
- App database path: `/var/data/shule-db.json`

The included `render.yaml` can create this automatically as a Render Blueprint.

### Production Target Architecture

- Frontend/backend: Vercel, Render, Railway, or VPS
- Database: Supabase PostgreSQL or managed PostgreSQL
- File storage: Supabase Storage or cloud object storage
- Backups: automated database backups

## Why The App Supports Both

The screens and calculation logic are independent from the storage method. MVP1 uses JSON for local testing. Production can move to PostgreSQL without changing the core workflow teachers use.
