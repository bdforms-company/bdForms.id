export type Notification = {
  id: string;
  type: "success" | "warning" | "info" | "error";
  title: string;
  message: string;
  eventId?: string;
  read: boolean;
  createdAt: Date;
};

type EventLike = Record<string, string | number | null | undefined>;

export function generateNotifications(events: EventLike[]): Notification[] {
  const notifications: Notification[] = [];
  const now = new Date();

  events.forEach((event) => {
    const participantCount = Number(event.participant_count || 0);
    const maxParticipants = Number(event.expected_participants || 0);
    const eventStart = event.event_date ? new Date(String(event.event_date)) : null;
    const deadline = event.registration_deadline ? new Date(String(event.registration_deadline)) : null;
    const fillRate = maxParticipants > 0 ? participantCount / maxParticipants : 0;
    const hoursUntilEvent = eventStart ? (eventStart.getTime() - now.getTime()) / (1000 * 60 * 60) : null;
    const hoursUntilDeadline = deadline ? (deadline.getTime() - now.getTime()) / (1000 * 60 * 60) : null;

    if (event.package_status === "pending_payment") notifications.push({ id: `pending-${event.id}`, type: "warning", title: "Menunggu Konfirmasi Pembayaran", message: `Event "${event.name}" menunggu konfirmasi pembayaran dari tim bdForms.`, eventId: String(event.id), read: false, createdAt: new Date(event.created_at ? String(event.created_at) : now) });
    if (event.status === "active" && participantCount === 0) notifications.push({ id: `share-${event.id}`, type: "info", title: "Bagikan Link Pendaftaran!", message: `Event "${event.name}" sudah aktif. Jangan lupa bagikan link pendaftaran ke peserta.`, eventId: String(event.id), read: false, createdAt: new Date(event.created_at ? String(event.created_at) : now) });
    if (fillRate >= 0.5 && fillRate < 0.8 && event.status === "active") notifications.push({ id: `half-full-${event.id}`, type: "info", title: "Event Mulai Ramai!", message: `${Math.round(fillRate * 100)}% kuota event "${event.name}" sudah terisi. Bagus!`, eventId: String(event.id), read: false, createdAt: now });
    if (fillRate >= 0.8 && fillRate < 1 && event.status === "active") notifications.push({ id: `almost-full-${event.id}`, type: "warning", title: "Kuota Hampir Penuh!", message: `Tersisa ${maxParticipants - participantCount} slot untuk event "${event.name}".`, eventId: String(event.id), read: false, createdAt: now });
    if (fillRate >= 1 && event.status === "active") notifications.push({ id: `full-${event.id}`, type: "error", title: "Kuota Penuh!", message: `Event "${event.name}" sudah penuh. Pendaftaran otomatis ditutup.`, eventId: String(event.id), read: false, createdAt: now });
    if (hoursUntilDeadline !== null && hoursUntilDeadline > 0 && hoursUntilDeadline <= 24) notifications.push({ id: `deadline-soon-${event.id}`, type: "warning", title: "Deadline Pendaftaran Besok!", message: `Deadline pendaftaran event "${event.name}" kurang dari 24 jam lagi.`, eventId: String(event.id), read: false, createdAt: now });
    if (hoursUntilEvent !== null && hoursUntilEvent > 0 && hoursUntilEvent <= 24) notifications.push({ id: `event-soon-${event.id}`, type: "info", title: "Event Dimulai Besok!", message: `"${event.name}" dimulai besok. Scanner sudah aktif, pastikan panitia siap.`, eventId: String(event.id), read: false, createdAt: now });
    if (eventStart && eventStart < now && event.status === "active") notifications.push({ id: `event-done-${event.id}`, type: "success", title: "Event Selesai!", message: `"${event.name}" sudah selesai. Download data peserta dan tutup event kamu.`, eventId: String(event.id), read: false, createdAt: now });
  });

  return notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
