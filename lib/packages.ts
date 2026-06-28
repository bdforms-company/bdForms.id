export const PACKAGES = [
  {
    id: 'starter',
    name: 'Starter',
    label: 'Trial Gratis',
    maxParticipants: 30,
    price: 0,
    normalPrice: 0,
    pricePerPerson: 0,
    features: ['Maks. 30 peserta', 'QR Check-in offline', 'Dashboard real-time', 'Export CSV'],
    cta: 'Mulai Gratis',
    highlighted: false,
  },
  {
    id: 'standard',
    name: 'Standard',
    label: 'Paling Populer',
    maxParticipants: 120,
    price: 21000,
    normalPrice: 30000,
    pricePerPerson: 175,
    features: ['Maks. 120 peserta', 'QR Check-in offline', 'Dashboard real-time', 'Export CSV', 'Link scanner panitia'],
    cta: 'Pilih Standard',
    highlighted: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    label: '',
    maxParticipants: 500,
    price: 85000,
    normalPrice: 125000,
    pricePerPerson: 175,
    features: ['Maks. 500 peserta', 'QR Check-in offline', 'Dashboard real-time', 'Export CSV', 'Link scanner panitia', 'Priority support'],
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
    pricePerPerson: 250,
    features: ['Peserta tak terbatas', 'White-label', 'Custom branding', 'Dedicated support', 'SLA guarantee'],
    cta: 'Hubungi Kami',
    highlighted: false,
  },
] as const;

export type PackageId = typeof PACKAGES[number]['id'];

export function getPackageById(id: string) {
  return PACKAGES.find((pkg) => pkg.id === id);
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}
