"use client";

import React from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function DashboardExportPanel({ participants, eventName }: { participants: any[], eventName: string }) {

  const exportCSV = () => {
    const csvContent = [
      ["Nama", "Email", "Status Check-in", "Waktu Check-in"],
      ...participants.map((p: any) => [
        p.name,
        p.email,
        p.is_checked_in ? "Sudah" : "Belum",
        p.check_in_time || "-",
      ]),
    ].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${eventName}_rekap.csv`;
    a.click();
  };

  const exportXLSX = () => {
    const worksheet = XLSX.utils.json_to_sheet(participants.map((p: any) => ({
      Nama: p.name,
      Email: p.email,
      Status: p.is_checked_in ? "Sudah" : "Belum",
      Waktu: p.check_in_time || "-",
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, eventName || "Rekap");
    XLSX.writeFile(workbook, `${eventName}_rekap.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF("l");
    doc.text(`Rekap Data Peserta - ${eventName}`, 14, 15);
    (doc as any).autoTable({
      head: [["Nama", "Email", "Status", "Waktu"]],
      body: participants.map((p: any) => [p.name, p.email, p.is_checked_in ? "Sudah" : "Belum", p.check_in_time || "-"]),
      startY: 20,
    });
    doc.save(`${eventName}_rekap.pdf`);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Rekap Data Peserta</h2>
        <div className="flex gap-2">
            <button onClick={exportCSV} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm">Export CSV</button>
            <button onClick={exportXLSX} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm">Export XLSX</button>
            <button onClick={exportPDF} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm">Export PDF</button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[--outline-variant]">
        <table className="w-full text-sm text-left">
          <thead className="bg-[--surface-container-low] text-[--on-surface-variant]">
            <tr>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Status Check-in</th>
            </tr>
          </thead>
          <tbody>
            {(participants ?? []).map((p: any) => (
              <tr key={p.id} className="border-t border-[--outline-variant]">
                <td className="px-4 py-3">{p.name}</td>
                <td className="px-4 py-3">{p.email}</td>
                <td className="px-4 py-3">{p.is_checked_in ? "Sudah" : "Belum"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
