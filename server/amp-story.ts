/**
 * Server-side AMP story HTML builder. Used by Vite middleware for GET /story.
 */

const MEDIA_BASE = 'https://media.oono.ai/uploads';

export interface StoryInput {
  background: string;
  backgroundType: string;
  thumbnail: string;
  duration?: number;
  embedCode?: string;
}

export interface CollectionInput {
  name: string;
  cover: string;
  thumbnail: string;
  stories?: StoryInput[];
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getMediaUrl(path: string): string {
  if (!path || typeof path !== 'string') return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const p = path.startsWith('/') ? path.slice(1) : path;
  return `${MEDIA_BASE}/${p}`;
}

function isColor(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  const t = value.trim();
  return t.startsWith('#') || t.startsWith('rgb(') || t.startsWith('rgba(');
}

/** Extract iframe src from embedCode string. */
function extractIframeSrc(embedCode: string): string {
  const match = embedCode.match(/src\s*=\s*["']([^"']+)["']/i);
  return match ? match[1].trim() : '';
}

function buildStoryPage(story: StoryInput, index: number): string {
  const id = `page-${index}`;
  const bgType = (story.backgroundType || '').toUpperCase();
  const thumbUrl = getMediaUrl(story.thumbnail) || 'https://placehold.co/720x1280/1a1a1a/ffffff?text=Story';

  if (bgType === 'VIDEO') {
    const videoUrl = getMediaUrl(story.background);
    const duration = story.duration && story.duration > 0 ? story.duration : 15;
    return `
      <amp-story-page id="${id}" auto-advance-after="${duration}s">
        <amp-story-grid-layer template="fill">
          <amp-video
            autoplay
            muted
            loop
            width="720"
            height="1280"
            layout="fill"
            poster="${escapeHtml(thumbUrl)}"
          >
            <source src="${escapeHtml(videoUrl)}" type="video/mp4" />
          </amp-video>
        </amp-story-grid-layer>
      </amp-story-page>`;
  }

  if (bgType === 'IMAGE') {
    const imgUrl = getMediaUrl(story.background) || thumbUrl;
    return `
      <amp-story-page id="${id}">
        <amp-story-grid-layer template="fill">
          <amp-img
            src="${escapeHtml(imgUrl)}"
            width="720"
            height="1280"
            layout="responsive"
          ></amp-img>
        </amp-story-grid-layer>
      </amp-story-page>`;
  }

  if (bgType === 'EMBED' && story.embedCode) {
    const iframeSrc = extractIframeSrc(story.embedCode);
    if (iframeSrc) {
      return `
      <amp-story-page id="${id}" class="iframe-page">
        <amp-story-grid-layer template="fill" class="iframe-page-fill">
          <amp-iframe
            src="${escapeHtml(iframeSrc)}"
            width="720"
            height="1280"
            layout="responsive"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen; payment; web-share; camera; microphone"
            allowfullscreen
            title="Embedded Content"
          >
            <amp-img layout="fill" src="${escapeHtml(thumbUrl)}" placeholder></amp-img>
          </amp-iframe>
        </amp-story-grid-layer>
      </amp-story-page>`;
    }
  }

  if (bgType === 'GRADIENT' || bgType === 'BLANK' || !bgType) {
    const color = story.background && isColor(story.background)
      ? story.background.trim()
      : '#000000';
    return `
      <amp-story-page id="${id}">
        <amp-story-grid-layer template="fill">
          <div style="background-color:${escapeHtml(color)};width:100%;height:100%;"></div>
        </amp-story-grid-layer>
      </amp-story-page>`;
  }

  return `
    <amp-story-page id="${id}">
      <amp-story-grid-layer template="fill">
        <amp-img src="${escapeHtml(thumbUrl)}" width="720" height="1280" layout="responsive"></amp-img>
      </amp-story-grid-layer>
    </amp-story-page>`;
}

export function buildAmpStoryHtml(
  collection: CollectionInput,
  opts: { storyIndex?: number; baseUrl?: string } = {}
): string {
  const stories = collection.stories ?? [];
  const posterUrl = getMediaUrl(collection.cover) || getMediaUrl(collection.thumbnail) || 'https://placehold.co/720x1280/1a1a1a/ffffff?text=Story';
  const title = escapeHtml(collection.name || 'Story');
  const baseUrl = opts.baseUrl ?? '';

  const pagesHtml = stories.length > 0
    ? stories.map((s, i) => buildStoryPage(s, i)).join('\n')
    : `
    <amp-story-page id="page-0">
      <amp-story-grid-layer template="vertical">
        <p>No stories in this collection.</p>
        <a href="${baseUrl}/">Back to Collections</a>
      </amp-story-grid-layer>
    </amp-story-page>`;

  return `<!doctype html>
<html ⚡>
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <link rel="canonical" href="${baseUrl}/story" />
    <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1" />
    <style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style>
    <noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
    <script async src="https://cdn.ampproject.org/v0.js"></script>
    <script async custom-element="amp-story" src="https://cdn.ampproject.org/v0/amp-story-1.0.js"></script>
    <script async custom-element="amp-iframe" src="https://cdn.ampproject.org/v0/amp-iframe-0.1.js"></script>
    <script async custom-element="amp-video" src="https://cdn.ampproject.org/v0/amp-video-0.1.js"></script>
    <script async src="https://cdn.ampproject.org/v0/amp-viewer-integration-0.1.js"></script>
    <link href="https://fonts.googleapis.com/css?family=Oswald:200,300,400" rel="stylesheet" />
    <style amp-custom>
      amp-story{font-family:"Oswald",sans-serif;color:#fff}
      amp-story-page{background-color:#000}
      amp-story-page.iframe-page amp-story-grid-layer[template="fill"]{pointer-events:auto;z-index:10}
      amp-story-page.iframe-page amp-iframe{pointer-events:auto}
      p{font-weight:normal;font-size:1.3em;line-height:1.5em;color:#fff}
    </style>
  </head>
  <body>
    <amp-story
      standalone
      title="${title}"
      publisher="oono"
      publisher-logo-src="${baseUrl}/assets/AMP-Brand-White-Icon.svg"
      poster-portrait-src="${escapeHtml(posterUrl)}"
    >
${pagesHtml}
      <amp-story-bookend src="${baseUrl}/bookend.json" layout="nodisplay"></amp-story-bookend>
    </amp-story>
  </body>
</html>`;
}

export function buildAmpErrorHtml(message: string, baseUrl = ''): string {
  const escaped = escapeHtml(message);
  return `<!doctype html>
<html ⚡>
  <head>
    <meta charset="utf-8" />
    <title>Error</title>
    <link rel="canonical" href="${baseUrl}/story" />
    <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1" />
    <style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style>
    <noscript><style amp-boilerplate>body{animation:none}</style></noscript>
    <script async src="https://cdn.ampproject.org/v0.js"></script>
    <script async custom-element="amp-story" src="https://cdn.ampproject.org/v0/amp-story-1.0.js"></script>
    <link href="https://fonts.googleapis.com/css?family=Oswald:200,300,400" rel="stylesheet" />
    <style amp-custom>amp-story{font-family:"Oswald",sans-serif;color:#fff}amp-story-page{background-color:#000}p{color:#fff;font-size:1.3em}</style>
  </head>
  <body>
    <amp-story standalone title="Error" publisher="oono" publisher-logo-src="${baseUrl}/assets/AMP-Brand-White-Icon.svg" poster-portrait-src="https://placehold.co/720x1280/1a1a1a/ffffff?text=Error">
      <amp-story-page id="error">
        <amp-story-grid-layer template="vertical">
          <p>${escaped}</p>
          <a href="${baseUrl}/">Back to Collections</a>
        </amp-story-grid-layer>
      </amp-story-page>
    </amp-story>
  </body>
</html>`;
}
