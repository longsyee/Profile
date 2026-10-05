import { randomUUID } from 'node:crypto'
import { mkdir, readdir, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { createFileRoute } from '@tanstack/react-router'
import { getAdminSession, isSameOriginRequest } from '../../server/auth'

const imageTypes = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/avif', 'avif'],
])
function positiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback
}

const MAX_BYTES = positiveInteger(process.env.UPLOAD_MAX_FILE_BYTES, 10 * 1024 * 1024)
const MAX_TOTAL_BYTES = positiveInteger(process.env.UPLOAD_MAX_TOTAL_BYTES, 512 * 1024 * 1024)
const MAX_FILES = positiveInteger(process.env.UPLOAD_MAX_FILES, 500)
// Allow bounded multipart headers and form fields in addition to the file.
const MAX_FORM_OVERHEAD = 1024 * 1024

async function readBoundedForm(request: Request) {
  const limit = MAX_BYTES + MAX_FORM_OVERHEAD
  const contentLength = Number(request.headers.get('content-length'))
  if (Number.isFinite(contentLength) && contentLength > limit) throw new RangeError('too-large')
  if (!request.body) throw new TypeError('missing-body')
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > limit) {
      await reader.cancel()
      throw new RangeError('too-large')
    }
    chunks.push(value)
  }
  const body = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength }
  return await new Request(request.url, { method: 'POST', headers: request.headers, body }).formData()
}

let quotaQueue = Promise.resolve()
async function saveWithinQuota(directory: string, filename: string, contents: Buffer) {
  const previous = quotaQueue
  let release!: () => void
  quotaQueue = new Promise<void>((resolve) => { release = resolve })
  await previous
  try {
    const names = await readdir(directory)
    let totalBytes = 0
    let fileCount = 0
    for (const name of names) {
      try {
        const entry = await stat(path.join(directory, name))
        if (entry.isFile()) { totalBytes += entry.size; fileCount += 1 }
      } catch { /* Ignore entries removed during the scan. */ }
    }
    if (fileCount >= MAX_FILES || contents.byteLength > MAX_TOTAL_BYTES - totalBytes) throw new RangeError('quota')
    await writeFile(path.join(directory, filename), contents, { flag: 'wx' })
  } finally {
    release()
  }
}

export const Route = createFileRoute('/api/upload')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!isSameOriginRequest(request)) return Response.json({ error: 'Request origin is not allowed.' }, { status: 403 })
        try {
          if (!await getAdminSession(request)) return Response.json({ error: 'Sign in to upload images.' }, { status: 401 })
          let form: FormData
          try {
            form = await readBoundedForm(request)
          } catch (error) {
            if (error instanceof RangeError && error.message === 'too-large') {
              return Response.json({ error: `The upload request is limited to ${Math.ceil(MAX_BYTES / 1024 / 1024)} MB per image.` }, { status: 413 })
            }
            throw error
          }
          const file = form.get('image')
          if (!(file instanceof File)) return Response.json({ error: 'Choose an image to upload.' }, { status: 400 })
          const extension = imageTypes.get(file.type)
          if (!extension) return Response.json({ error: 'Use a PNG, JPG, WebP, or AVIF image.' }, { status: 415 })
          if (file.size < 1 || file.size > MAX_BYTES) return Response.json({ error: `Images must be no larger than ${Math.ceil(MAX_BYTES / 1024 / 1024)} MB.` }, { status: 413 })

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
          try {
            await saveWithinQuota(uploadDirectory, filename, contents)
          } catch (error) {
            if (error instanceof RangeError && error.message === 'quota') {
              return Response.json({ error: 'The upload storage limit has been reached. Remove old images or increase the configured quota.' }, { status: 413 })
            }
            throw error
          }
          return Response.json({ image_url: `/uploads/${filename}` }, { status: 201 })
        } catch {
          return Response.json({ error: 'The image could not be uploaded.' }, { status: 500 })
        }
      },
    },
  },
})
