import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { buildAmpStoryHtml, buildAmpErrorHtml, type CollectionInput } from './server/amp-story'

const API_BASE = 'https://staging-apis-v2.oono.ai/api/public'
const APP_TOKEN =
  process.env.VITE_APP_TOKEN ??
  '9f8e7d6c5b4a3e2f1a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f'

async function storyMiddleware(req: { url?: string; headers: { host?: string } }, res: { statusCode: number; setHeader: (name: string, value: string) => void; end: (body: string) => void }, next: () => void) {
  const url = new URL(req.url ?? '', `http://${req.headers.host ?? 'localhost'}`)
  if (url.pathname !== '/story') {
    next()
    return
  }
  const collectionId = url.searchParams.get('collectionId')
  const slug = url.searchParams.get('slug')
  if (!collectionId || !slug) {
    res.statusCode = 200
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.end(buildAmpErrorHtml('Missing collectionId or slug. Use ?collectionId=...&slug=...'))
    return
  }
  try {
    const apiRes = await fetch(
      `${API_BASE}/stories-collection/?slug=${encodeURIComponent(slug)}`,
      { headers: { 'App-Token': APP_TOKEN } }
    )
    if (!apiRes.ok) {
      res.statusCode = 200
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.end(buildAmpErrorHtml(`API error: ${apiRes.status} ${apiRes.statusText}`))
      return
    }
    const data = (await apiRes.json()) as { data?: Array<CollectionInput & { collectionId: string }> }
    const collection = data?.data?.find((c) => c.collectionId === collectionId)
    if (!collection) {
      res.statusCode = 200
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.end(buildAmpErrorHtml('Collection not found'))
      return
    }
    const storyIndex = url.searchParams.get('storyIndex')
    const html = buildAmpStoryHtml(collection, {
      storyIndex: storyIndex != null ? parseInt(storyIndex, 10) : undefined,
      baseUrl: '',
    })
    res.statusCode = 200
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.end(html)
  } catch (e) {
    res.statusCode = 200
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.end(
      buildAmpErrorHtml(e instanceof Error ? e.message : 'Failed to load story')
    )
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'amp-story-route',
      configureServer(server) {
        server.middlewares.use(storyMiddleware)
      },
      configurePreviewServer(server) {
        server.middlewares.use(storyMiddleware)
      },
    },
  ],
})
