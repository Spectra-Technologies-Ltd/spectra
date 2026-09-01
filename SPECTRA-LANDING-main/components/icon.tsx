'use client'

// lucide-react icons use React context (theming defaults), so they can only be
// rendered from Client Components. This wrapper gives Server Components a safe
// boundary to import icons through.
export {
  ArrowDownRight,
  ArrowUpRight,
  Mail,
  MapPin,
  Phone,
} from 'lucide-react'
