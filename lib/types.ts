export type CustomField = {
  id: string;
  label: string;
  type: "text" | "email" | "phone" | "number" | "textarea" | "select";
  required: boolean;
  placeholder?: string;
  options?: string[];
};

export interface Participant {
  id: string;
  name: string;
  email: string | null;
  signature_url: string; // JPEG Base64 terkompresi (quality 0.3)
  qr_token: string;
  is_checked_in: boolean;
  check_in_time: string | null;
}

// Hasil evaluasi state lokal saat scan (FR-6 / Data Flow step 3)
export type ScanResult = "NOT_FOUND" | "VERIFIED" | "DUPLICATE";
