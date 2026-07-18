// src/components/common/Seo.tsx
//
// Per-page metadata.
//
// React 19 hoists <title>, <meta> and <link> rendered anywhere in the tree into
// <head>, so this needs no helmet library and no provider — just render it.
//
// Important limitation to understand before relying on this: Google executes
// JavaScript, so it will see these tags, but social crawlers (LinkedIn, X,
// Slack, WhatsApp) do NOT. For link previews to work, the HTML served at that
// URL has to already contain the og: tags, which means server-side injection or
// prerendering. This component is the source of truth for what those tags
// should be; it is not by itself sufficient for sharing.

export interface SeoProps {
  title: string;
  description: string;
  /** Path only, e.g. "/blog/my-post" — combined with the site origin. */
  path?: string;
  /** Absolute URL to a preview image, ideally 1200x630. */
  image?: string;
  /** "article" for blog posts, "profile" for user pages. */
  type?: 'website' | 'article' | 'profile';
  /** Keeps a page out of search results — use for anything private. */
  noIndex?: boolean;
  /** Article metadata, only meaningful when type is "article". */
  publishedTime?: string;
  author?: string;
  /** Schema.org JSON-LD. Rendered verbatim, so pass an object, not a string. */
  jsonLd?: Record<string, unknown>;
}

/** Falls back to the current origin so previews work on any deploy target. */
function siteOrigin(): string {
  const configured = import.meta.env.VITE_SITE_URL as string | undefined;
  if (configured) return configured.replace(/\/$/, '');
  return typeof window !== 'undefined' ? window.location.origin : '';
}

const SITE_NAME = 'Panelist';

export function Seo({
  title,
  description,
  path,
  image,
  type = 'website',
  noIndex = false,
  publishedTime,
  author,
  jsonLd,
}: SeoProps) {
  const origin = siteOrigin();
  const url = path ? `${origin}${path}` : origin;
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} — ${SITE_NAME}`;

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />

      {/* A canonical URL stops query strings and trailing-slash variants being
          indexed as separate pages competing with each other. */}
      <link rel="canonical" href={url} />

      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      {image && <meta property="og:image" content={image} />}

      <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}

      {type === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === 'article' && author && <meta property="article:author" content={author} />}

      {/* Unlike the tags above, this is NOT hoisted into <head> — React only
          hoists scripts carrying src or async, so an inline one renders where
          it sits. That is fine: Google accepts JSON-LD anywhere in the
          document. Safe to inject because callers pass an object we serialise
          ourselves, never raw user input. */}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
    </>
  );
}

export default Seo;
