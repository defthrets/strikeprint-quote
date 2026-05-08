// Direct browser-to-Blob upload endpoint.
//
// The browser side calls @vercel/blob/client `upload()`, which makes a small
// POST here to ask for a signed upload token. We verify the request comes
// from a logged-in admin, then `handleUpload` returns the token and the
// browser uploads the binary directly to Blob — bypassing the 4.5MB
// serverless function body limit (phone photos easily exceed that).
//
// Security:
//   - requireAdmin() also performs the CSRF Origin/Referer check (built
//     into the helper for any mutating method).
//   - allowedContentTypes restricts to image MIME types — admins can't
//     be tricked into using the Blob bucket as a generic file host.
//   - maximumSizeInBytes caps each upload at MAX_UPLOAD_BYTES.
//
// After the upload finishes the browser POSTs the resulting URL to
// /api/admin/photos with the chosen label to record it in gallery.json.
import { handleUpload } from '@vercel/blob/client';
import { requireAdmin } from './_lib/auth.js';

// 20 MB cap. Generous enough for high-res phone shots / pro DSLR JPEGs
// (~10–15 MB typical) but blocks anyone trying to push hundreds of
// megabytes through our Blob bucket. Bump if the workshop starts
// uploading raw scans; tighten if upload bills get noisy.
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // The blob client makes one POST here to request a token, and a second
  // POST after the upload completes (the onUploadCompleted callback) — both
  // need to be authenticated by our admin cookie. requireAdmin also
  // enforces the same-origin check for these mutating POSTs.
  if (!(await requireAdmin(req, res))) return;

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        return {
          // Restrict to image types so an admin can't be tricked into hosting
          // arbitrary content from the workshop laptop.
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml'],
          // Hard cap on individual upload size — Vercel Blob enforces this
          // on the upload directly (returns 413 if exceeded).
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          // Random suffix prevents same-named uploads from clobbering each other.
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ pathname })
        };
      },
      onUploadCompleted: async ({ blob }) => {
        // No-op for now — gallery.json gets updated via the separate POST
        // to /api/admin/photos that the client makes after upload completes.
        // (We could insert directly here, but doing it client-side gives the
        // user a chance to set the label first.)
        console.log('Upload completed:', blob.url);
      }
    });

    return res.status(200).json(jsonResponse);
  } catch (err) {
    console.error('upload handler failed', err);
    return res.status(400).json({ error: err.message || 'Upload failed' });
  }
}
