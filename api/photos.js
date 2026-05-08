// Public photo list — no auth, just reads gallery.json from Blob and
// returns the photo array sorted by `order`. Used by the homepage marquee
// and the /gallery page.
//
// Falls back gracefully: if Blob is unreachable or gallery.json doesn't
// exist yet, returns an empty list and the UI falls back to its compiled-in
// SHOWCASE_PHOTOS defaults so the site never blanks out.
import { readGallery } from './admin/_lib/store.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const gallery = await readGallery();
    const sorted = [...(gallery.photos || [])]
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map(p => ({
        id: p.id,
        src: p.url,
        label: p.label,
        // Service-category metadata: empty/null when uncategorised.
        // Homepage uses these to group photos into per-service galleries
        // and pick a featured photo as the tile cover.
        category: p.category || null,
        featured: !!p.featured,
        order: p.order ?? 0
      }));

    // Cache at the edge for 60s — admin edits become visible after that
    // without forcing every public hit to read Blob fresh.
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
    return res.status(200).json({ photos: sorted });
  } catch (err) {
    console.error('public/photos error', err);
    return res.status(200).json({ photos: [] });
  }
}
