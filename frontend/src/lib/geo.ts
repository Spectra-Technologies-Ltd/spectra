/**
 * Web Mercator math for the interactive map (OSM tile scheme).
 * Everything is integer-based at tile level; markers are positioned with
 * CSS transforms so pan/zoom stays GPU-accelerated.
 */

export const TILE_SIZE = 256;
export const MIN_ZOOM = 3;
export const MAX_ZOOM = 19;

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Bounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

/** Latitude → world Y at zoom 0 (Web Mercator, in tiles). */
export function latToTileY(lat: number): number {
  const sin = Math.sin((lat * Math.PI) / 180);
  return (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI));
}

/** Longitude → world X at zoom 0 (in tiles). */
export function lngToTileX(lng: number): number {
  return (lng + 180) / 360;
}

/** Inverse: tile position at zoom 0 → longitude. */
export function tileXToLng(x: number): number {
  return x * 360 - 180;
}

/** Inverse: tile position at zoom 0 → latitude (clamped to mercator limits). */
export function tileYToLat(y: number): number {
  const n = Math.PI - (2 * Math.PI * y);
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

/** World pixel coordinates (float) at a given zoom for a lat/lng. */
export function latLngToWorldPixel(lat: number, lng: number, zoom: number) {
  const scale = Math.pow(2, zoom);
  return {
    x: lngToTileX(lng) * TILE_SIZE * scale,
    y: latToTileY(lat) * TILE_SIZE * scale,
  };
}

/** Convert a drag delta in screen px back into a lat/lng center shift. */
export function pixelDeltaToLatLng(dx: number, dy: number, zoom: number, center: LatLng) {
  const scale = Math.pow(2, zoom) * TILE_SIZE;
  const x = lngToTileX(center.lng) - dx / scale;
  const y = latToTileY(center.lat) - dy / scale;
  return { lat: tileYToLat(y), lng: tileXToLng(x) };
}

/** Zoom such that the given bounds fit in a viewport (returns clamped zoom). */
export function zoomForBounds(bounds: Bounds, width: number, height: number): number {
  const latSpan = Math.max(Math.abs(bounds.north - bounds.south), 0.0001);
  const lngSpan = Math.max(Math.abs(bounds.east - bounds.west), 0.0001);
  const latZoom = Math.log2((TILE_SIZE * 90) / latSpan / (height / TILE_SIZE));
  const lngZoom = Math.log2((TILE_SIZE * 180) / lngSpan / (width / TILE_SIZE));
  const zoom = Math.floor(Math.min(latZoom, lngZoom));
  return clampZoom(zoom);
}

export function centerOfBounds(bounds: Bounds): LatLng {
  return {
    lat: (bounds.north + bounds.south) / 2,
    lng: (bounds.east + bounds.west) / 2,
  };
}

export function clampZoom(zoom: number): number {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.round(zoom)));
}

/** Default view: Lagos, Nigeria. */
export const DEFAULT_CENTER: LatLng = { lat: 6.5244, lng: 3.3792 };
export const DEFAULT_ZOOM = 12;

/** OSM tile URL template. */
export function tileUrl(z: number, x: number, y: number): string {
  const sub = ['a', 'b', 'c'][(x + y) % 3];
  return `https://${sub}.tile.openstreetmap.org/${z}/${x}/${y}.png`;
}
