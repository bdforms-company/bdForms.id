export const PACKAGES = [
  {
    id: 'starter',
    name: 'Starter',
    label: 'Gratis Selamanya',
    scale: 'Untuk event kecil & percobaan',
    maxParticipants: 30,
    price: 0,
    normalPrice: 0,
    pricePerPerson: 0,
    normalPricePerPerson: 0,
    discount: 0,
    features: ['Hingga 30 peserta', 'QR Check-in offline', 'Dashboard real-time', 'Export CSV', 'Form dengan 1 pertanyaan custom', 'Data tersimpan 7 hari'],
    cta: 'Mulai Gratis',
    highlighted: false,
  },
  {
    id: 'standard',
    name: 'Standard',
    label: 'Paling Banyak Dipilih',
    scale: 'Untuk event komunitas & kampus',
    maxParticipants: 120,
    price: 72000,
    normalPrice: 102000,
    pricePerPerson: 600,
    normalPricePerPerson: 850,
    discount: 29,
    features: ['Hingga 120 peserta', 'QR Check-in offline', 'Dashboard real-time', 'Export CSV & PDF', 'Form dengan 3 pertanyaan custom', 'Data tersimpan 30 hari', 'Notifikasi milestone 3x/event'],
    cta: 'Pilih Standard',
    highlighted: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    label: 'Untuk Event Besar',
    scale: 'Untuk konferensi & seminar besar',
    maxParticipants: 500,
    price: 285000,
    normalPrice: 425000,
    pricePerPerson: 570,
    normalPricePerPerson: 850,
    discount: 33,
    features: ['Hingga 500 peserta', 'QR Check-in offline', 'Dashboard real-time', 'Export CSV, PDF & Spreadsheet', 'Form dengan 10 pertanyaan custom', 'Data tersimpan permanen', 'Email tiket ke peserta', 'Notifikasi milestone 3x/event', 'Priority support'],
    cta: 'Pilih Pro',
    highlighted: false,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    label: 'Skala Organisasi',
    scale: 'Untuk organisasi & penyelenggara rutin',
    maxParticipants: null,
    price: null,
    normalPrice: null,
    pricePerPerson: null,
    normalPricePerPerson: null,
    discount: 0,
    features: ['Peserta tak terbatas', 'Semua fitur Pro', 'White-label & custom branding', 'Custom domain', 'Dedicated support & SLA', 'Multi admin & tim panitia', 'Onboarding & pendampingan'],
    cta: 'Hubungi Kami',
    highlighted: false,
  },
] as const

export function formatPrice(price: number | null) {
  if (price === null) return '';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatDiscount(discount: number | null) {
  if (discount === null) return '';
  return `${discount}%`;
}

export function getPackageById(id: string) {
  return PACKAGES.find((pkg) => pkg.id === id);
}
