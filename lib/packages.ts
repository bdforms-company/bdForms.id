export const PACKAGES = [
  {
    id: 'starter',
    name: 'Starter',
    label: 'Trial Gratis',
    maxParticipants: 30,
    price: 0,
    normalPrice: 0,
    pricePerPerson: 0,
    normalPricePerPerson: 0,
    discount: 0,
    features: ['Maks. 30 peserta', 'QR Check-in offline', 'Dashboard real-time', 'Export CSV'],
    cta: 'Mulai Gratis',
    highlighted: false,
  },
  {
    id: 'standard',
    name: 'Standard',
    label: 'Paling Populer',
    maxParticipants: 120,
    price: 72000,
    normalPrice: 102000,
    pricePerPerson: 600,
    normalPricePerPerson: 850,
    discount: 29,
    features: ['Maks. 120 peserta', 'QR Check-in offline', 'Dashboard real-time', 'Export CSV', 'Export PDF', 'Link scanner panitia', '3 custom questions', 'Notifikasi milestone'],
    cta: 'Pilih Standard',
    highlighted: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    label: '',
    maxParticipants: 500,
    price: 285000,
    normalPrice: 425000,
    pricePerPerson: 570,
    normalPricePerPerson: 850,
    discount: 33,
    features: ['Maks. 500 peserta', 'QR Check-in offline', 'Dashboard real-time', 'Export CSV, PDF & Spreadsheet', 'Link scanner panitia', 'Email tiket ke peserta', '10 custom questions', 'Priority support'],
    cta: 'Pilih Pro',
    highlighted: false,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    label: 'Custom',
    maxParticipants: null,
    price: null,
    normalPrice: null,
    pricePerPerson: null,
    normalPricePerPerson: null,
    discount: 0,
    features: ['Peserta tak terbatas', 'Semua fitur Pro', 'White-label', 'Custom branding', 'Dedicated support', 'SLA guarantee'],
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
