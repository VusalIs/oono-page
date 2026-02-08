import { buildAmpStoryHtml, buildAmpErrorHtml, type CollectionInput } from '../server/amp-story'

const API_BASE = 'https://staging-apis-v2.oono.ai/api/public'
const APP_TOKEN =
  process.env.VITE_APP_TOKEN ??
  '9f8e7d6c5b4a3e2f1a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f'

export const config = {
  runtime: 'nodejs',
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const collectionId = url.searchParams.get('collectionId')
  const slug = url.searchParams.get('slug')
  const storyIndexParam = url.searchParams.get('storyIndex')

  const baseUrl = url.origin

  if (!collectionId || !slug) {
    return new Response(
      buildAmpErrorHtml('Missing collectionId or slug. Use ?collectionId=...&slug=...', baseUrl),
      {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    )
  }

  try {
    const apiRes = await fetch(
      `${API_BASE}/stories-collection/?slug=${encodeURIComponent(slug)}`,
      { headers: { 'App-Token': APP_TOKEN } }
    )
    if (!apiRes.ok) {
      return new Response(
        buildAmpErrorHtml(`API error: ${apiRes.status} ${apiRes.statusText}`, baseUrl),
        {
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        }
      )
    }
    const data = (await apiRes.json()) as {
      data?: Array<CollectionInput & { collectionId: string }>
    }
    const collection = data?.data?.find((c) => c.collectionId === collectionId)
    if (!collection) {
      return new Response(buildAmpErrorHtml('Collection not found', baseUrl), {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    }
    const storyIndex =
      storyIndexParam != null ? parseInt(storyIndexParam, 10) : undefined
    const html = buildAmpStoryHtml(collection, {
      storyIndex,
      baseUrl,
    })
    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  } catch (e) {
    return new Response(
      buildAmpErrorHtml(
        e instanceof Error ? e.message : 'Failed to load story',
        baseUrl
      ),
      {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    )
  }
}
