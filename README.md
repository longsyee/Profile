# ZYT AI Web

TanStack Start boilerplate with a scroll-scrubbed image sequence behind the existing ZYT hero.

## Development

```sh
npm install
npm run dev
```

The project uses the extracted sequence in `assets/video-frames/`. Vite serves that directory as static assets at the site root, so the animation requests `/frame-001.png` through `/frame-150.png` progressively without duplicating the source frames.

## Build

```sh
npm run build
npm run start
```
