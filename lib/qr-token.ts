import type { Participant } from "@/lib/types";

const UUID_RE =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

/** Normalize camera/manual QR payloads into a lookup key. */
export function normalizeQrPayload(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  const uuidMatch = trimmed.match(UUID_RE);
  if (uuidMatch) return uuidMatch[0].toLowerCase();

  // URL with token query param
  try {
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      const url = new URL(trimmed);
      const fromQuery =
        url.searchParams.get("token") ||
        url.searchParams.get("qr") ||
        url.searchParams.get("qr_token");
      if (fromQuery) return normalizeQrPayload(fromQuery);
    }
  } catch {
    // not a URL — fall through
  }

  return trimmed;
}

/**
 * Resolve a participant from full qr_token, UUID embedded in URL,
 * 6-char backup code, or exact name (case-insensitive).
 */
export function findParticipant(
  participants: Record<string, Participant>,
  query: string,
): Participant | undefined {
  const normalized = normalizeQrPayload(query);
  if (!normalized && !query.trim()) return undefined;

  if (normalized && participants[normalized]) return participants[normalized];

  const exact = query.trim();
  if (exact && participants[exact]) return participants[exact];

  const values = Object.values(participants);

  if (normalized) {
    const byToken = values.find(
      (p) => p.qr_token.toLowerCase() === normalized.toLowerCase(),
    );
    if (byToken) return byToken;
  }

  // Backup code shown on tickets: last 6 chars of qr_token (uppercase)
  const code = exact.toUpperCase();
  if (code.length >= 4 && code.length <= 8 && /^[0-9A-F-]+$/i.test(code)) {
    const byCode = values.find(
      (p) => p.qr_token.slice(-code.length).toUpperCase() === code,
    );
    if (byCode) return byCode;
  }

  const nameLower = exact.toLowerCase();
  return values.find((p) => p.name.toLowerCase() === nameLower);
}
