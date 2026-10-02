import { fileURLToPath } from 'node:url'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { defineConfig } from 'vite'

const frameSequenceDir = fileURLToPath(
  new URL('./frame', import.meta.url),
)
const uploadDir = fileURLToPath(new URL('./assets/uploads', import.meta.url))

export default defineConfig({
  plugins: [
    tanstackStart({ srcDirectory: 'src' }),
    viteReact(),
    nitro({
      publicAssets: [
        { dir: frameSequenceDir, baseURL: '/', maxAge: 31_536_000 },
        { dir: uploadDir, baseURL: '/uploads', maxAge: 31_536_000 },
      ],
    }),
  ],
  // Serve the supplied scroll sequence at stable root URLs.
  publicDir: frameSequenceDir,
})
