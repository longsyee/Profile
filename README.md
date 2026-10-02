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

## Production

```sh
bun run build
bun run start
```
