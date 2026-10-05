# Edwin | Developer + Designer

A personal portfolio built with TanStack Start. The opening scene scrubs through a 150-frame, GPU-upscaled image sequence at 3840 px wide; project cards and the 3D canvas follow below it.

## Development

```sh
bun install
bun run dev
```

The scrolling player serves 150 evenly sampled 1920 × 1080 WebP frames from `assets/video-frames-redone/`, extracted from the supplied MP4 for responsive playback.

## Private project editor

The public page works without a database and shows clearly labeled concept cards. To manage real projects and upload cover images:

1. Copy `.env.example` to `.env` and set `DATABASE_URL` to a PostgreSQL database.
2. Set `ADMIN_EMAIL` and a unique `ADMIN_PASSWORD` with at least 12 characters.
3. Create or update the private admin account:

   ```sh
   bun run admin:create
   ```

4. Start the app and open `/login` directly. There is no public sign-up or login link.

The API creates its tables on first use. Uploaded project images are written to `assets/uploads/`; deployments need persistent storage mounted there.

The optional editor has configurable safeguards in `.env`: `LOGIN_RATE_LIMIT_ATTEMPTS` sets the per-account and per-client-address attempt cap in a 15-minute window (default 10), while `UPLOAD_MAX_FILE_BYTES`, `UPLOAD_MAX_TOTAL_BYTES`, and `UPLOAD_MAX_FILES` set per-image (10 MiB), total-storage (512 MiB), and file-count (500) limits. Upload request bodies are streamed with a hard size cap before multipart parsing. The rate limiter and upload quota scan are process-local; for multiple app instances, enforce matching login limits and storage quotas at a shared gateway or on the shared storage service. Ensure the trusted ingress overwrites `X-Forwarded-For`; the account-based throttle remains active if that header is absent or untrusted.

No automatic upload deletion or retention period is configured. The owner should choose a retention period before launch; until then, remove obsolete uploads manually and keep a backup before cleanup. Increasing quota variables does not resize the deployment's persistent volume.

## Production

```sh
bun run build
bun run start
```
