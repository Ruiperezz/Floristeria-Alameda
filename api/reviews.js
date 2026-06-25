export const config = { runtime: 'edge' };

// ─── Configuración ────────────────────────────────────────────────
// Variables de entorno (panel Vercel → Settings → Environment Variables):
//   GOOGLE_PLACES_API_KEY  → tu clave de Google Places API
//   GOOGLE_PLACE_ID        → el Place ID de tu negocio en Google Maps
//   REVIEW_COUNT           → número manual de fallback (si no hay API key)
//   REVIEW_RATING          → nota manual de fallback
// ──────────────────────────────────────────────────────────────────

async function fetchFromGoogle(placeId, apiKey) {
  const url =
    'https://places.googleapis.com/v1/places/' +
    encodeURIComponent(placeId);

  const res = await fetch(url, {
    headers: {
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'rating,userRatingCount',
    },
  });

  if (!res.ok) throw new Error('Google Places API error: ' + res.status);

  const data = await res.json();
  return {
    count: data.userRatingCount ?? null,
    rating: data.rating != null ? data.rating.toFixed(1) : null,
  };
}

export default async function handler() {
  const apiKey  = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;

  let count  = parseInt(process.env.REVIEW_COUNT  || '333', 10);
  let rating = process.env.REVIEW_RATING || '4.9';
  let source = 'manual';

  // Si hay credenciales configuradas, consultar Google en tiempo real
  if (apiKey && placeId) {
    try {
      const live = await fetchFromGoogle(placeId, apiKey);
      if (live.count !== null)  { count  = live.count;  source = 'google'; }
      if (live.rating !== null) { rating = live.rating; source = 'google'; }
    } catch (_) {
      // Google falló → usa el fallback manual, no interrumpe la web
    }
  }

  return new Response(JSON.stringify({ count, rating, source }), {
    headers: {
      'Content-Type': 'application/json',
      // Caché 24 h en CDN de Vercel; si Google devuelve error usa dato cacheado
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
