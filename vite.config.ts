import { fileURLToPath } from 'node:url'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { defineConfig } from 'vite'

const frameSequenceDir = fileURLToPath(
  new URL('./assets/video-frames', import.meta.url),
)

export default defineConfig({
  plugins: [
    tanstackStart({ srcDirectory: 'src' }),
    viteReact(),
    nitro({
      publicAssets: [
        { dir: frameSequenceDir, baseURL: '/', maxAge: 31_536_000 },
      ],
    }),
  ],
  // Serve the existing numbered sequence at /frame-001.png without copying it.
  publicDir: frameSequenceDir,
})
