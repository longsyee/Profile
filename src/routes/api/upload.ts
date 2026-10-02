import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { createFileRoute } from '@tanstack/react-router'
import { getAdminSession, isSameOriginRequest } from '../../server/auth'

const imageTypes = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/avif', 'avif'],
])
const MAX_BYTES = 10 * 1024 * 1024

export const Route = createFileRoute('/api/upload')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!isSameOriginRequest(request)) return Response.json({ error: 'Request origin is not allowed.' }, { status: 403 })
        try {
          if (!await getAdminSession(request)) return Response.json({ error: 'Sign in to upload images.' }, { status: 401 })
          const form = await request.formData()
          const file = form.get('image')
          if (!(file instanceof File)) return Response.json({ error: 'Choose an image to upload.' }, { status: 400 })
          const extension = imageTypes.get(file.type)
          if (!extension) return Response.json({ error: 'Use a PNG, JPG, WebP, or AVIF image.' }, { status: 415 })
          if (file.size < 1 || file.size > MAX_BYTES) return Response.json({ error: 'Images must be smaller than 10 MB.' }, { status: 413 })

          const contents = Buffer.from(await file.arrayBuffer())
          const isJpeg = contents[0] === 0xff && contents[1] === 0xd8 && contents[2] === 0xff
          const isPng = contents.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
          const isWebp = contents.toString('ascii', 0, 4) === 'RIFF' && contents.toString('ascii', 8, 12) === 'WEBP'
          const isAvif = contents.toString('ascii', 4, 8) === 'ftyp' && /avif|avis/.test(contents.toString('ascii', 8, 16))
          if (!(isJpeg || isPng || isWebp || isAvif)) {
            return Response.json({ error: 'The file contents do not match a supported image type.' }, { status: 415 })
          }

          const uploadDirectory = path.resolve(process.cwd(), 'assets', 'uploads')
          await mkdir(uploadDirectory, { recursive: true })
          const filename = `${randomUUID()}.${extension}`
          await writeFile(path.join(uploadDirectory, filename), contents, { flag: 'wx' })
          return Response.json({ image_url: `/uploads/${filename}` }, { status: 201 })
        } catch {
          return Response.json({ error: 'The image could not be uploaded.' }, { status: 500 })
        }
      },
    },
  },
})
