import Link from 'next/link'
import './design.css'

export default function NotFound() {
  return (
    <div className="bd flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <span className="material-symbols-outlined text-6xl" style={{ color: 'var(--on-surface-variant)' }}>search_off</span>
      <h1 className="text-2xl font-bold">Halaman Tidak Ditemukan</h1>
      <p className="max-w-sm text-sm" style={{ color: 'var(--on-surface-variant)' }}>Halaman yang kamu cari tidak ada atau sudah dipindahkan.</p>
      <Link href="/" className="rounded-lg px-6 py-3 font-bold" style={{ background: 'var(--primary)', color: 'var(--on-primary)' }}>Kembali ke Beranda</Link>
    </div>
  )
}
