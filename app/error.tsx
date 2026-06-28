'use client'

import './design.css'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="bd flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <span className="material-symbols-outlined text-6xl" style={{ color: 'var(--error)' }}>error</span>
      <h1 className="text-2xl font-bold">Terjadi Kesalahan</h1>
      <p className="max-w-sm text-sm" style={{ color: 'var(--on-surface-variant)' }}>{error.message || 'Sesuatu yang tidak terduga terjadi.'}</p>
      <button onClick={reset} className="rounded-lg px-6 py-3 font-bold" style={{ background: 'var(--primary-container)', color: 'var(--on-primary-container)' }}>
        Coba Lagi
      </button>
    </div>
  )
}
