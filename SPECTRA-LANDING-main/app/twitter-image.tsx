import { ogContentType, ogSize, renderOgImage } from '@/lib/og'

export const alt = 'Spectra — Intelligence. Engineered.'
export const size = ogSize
export const contentType = ogContentType

export default function TwitterImage() {
  return renderOgImage()
}
