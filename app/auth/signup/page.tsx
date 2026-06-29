import type { Metadata } from "next";
import SignupClient from "./SignupClient";

export const metadata: Metadata = {
  title: "Daftar — bdForms",
  description: "Buat akun bdForms gratis dan mulai terima pendaftaran event dalam 30 detik.",
  robots: { index: false },
};

export default function SignupPage() {
  return <SignupClient />;
}
