import type { Metadata } from 'next'
import './warranty-cinematic.css'

export const metadata: Metadata = { title: 'Warranty' }

export default function WarrantyLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children
}
