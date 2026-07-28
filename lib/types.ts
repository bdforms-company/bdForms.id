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

export type FieldConfig = {
  phone: { enabled: boolean; required: boolean };
  institution: { enabled: boolean; required: boolean };
  position: { enabled: boolean; required: boolean };
  idNumber: { enabled: boolean; required: boolean };
  customQuestions: { id: string; label: string; required: boolean }[];
};

export const DEFAULT_FIELD_CONFIG: FieldConfig = {
  phone: { enabled: false, required: false },
  institution: { enabled: false, required: false },
  position: { enabled: false, required: false },
  idNumber: { enabled: false, required: false },
  customQuestions: [],
};

export const PRESET_FIELDS = [
  { key: "phone", label: "No. HP", icon: "phone", placeholder: "08xx-xxxx-xxxx", type: "tel" },
  { key: "institution", label: "Instansi / Lembaga / Komunitas / Startup", icon: "business", placeholder: "Universitas / Perusahaan / Komunitas / dll", type: "text" },
  { key: "position", label: "Jabatan / Posisi", icon: "work", placeholder: "Mahasiswa / Manager / CEO", type: "text" },
  { key: "idNumber", label: "NIP / NIM / ID", icon: "badge", placeholder: "Nomor identifikasi", type: "text" },
] as const;

export type PresetFieldKey = (typeof PRESET_FIELDS)[number]["key"];

export function parseFieldConfig(raw: unknown): FieldConfig {
  if (!raw || typeof raw !== "object") return DEFAULT_FIELD_CONFIG;
  const o = raw as Record<string, unknown>;
  const bool = (v: unknown, fallback: boolean) => (typeof v === "boolean" ? v : fallback);
  const preset = (key: PresetFieldKey) => {
    const item = o[key];
    if (!item || typeof item !== "object") return DEFAULT_FIELD_CONFIG[key];
    const p = item as Record<string, unknown>;
    return {
      enabled: bool(p.enabled, false),
      required: bool(p.required, false),
    };
  };
  const customQuestions = Array.isArray(o.customQuestions)
    ? o.customQuestions
        .filter((q): q is { id: string; label: string; required: boolean } =>
          !!q && typeof q === "object" && typeof (q as Record<string, unknown>).id === "string",
        )
        .map((q) => ({
          id: q.id,
          label: typeof q.label === "string" ? q.label : "",
          required: bool(q.required, false),
        }))
    : [];
  return {
    phone: preset("phone"),
    institution: preset("institution"),
    position: preset("position"),
    idNumber: preset("idNumber"),
    customQuestions,
  };
}
