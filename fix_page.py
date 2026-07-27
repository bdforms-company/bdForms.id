import sys
content = sys.stdin.read()
export_functions = """
    const buildExportColumns = (participants: Participant[], fieldConfig: FieldConfig) => {
        const columns: { header: string; accessor: (p: Participant, index?: number) => string; }[] = [
            { header: "No", accessor: (_, index) => (index !== undefined ? index + 1 : "").toString() },
            { header: "Nama Lengkap", accessor: (p) => p.name ?? "" },
            { header: "Email", accessor: (p) => p.email ?? "" },
        ];
        const presetFieldLabels: { [key: string]: string } = {
            phone: "No. HP",
            institution: "Instansi / Lembaga / Komunitas / Startup",
            position: "Jabatan / Posisi",
            idNumber: "NIP / NIM / ID",
        };
        PRESET_FIELDS.forEach(field => {
            if (fieldConfig[field.key]?.enabled) {
                columns.push({
                    header: presetFieldLabels[field.key] || field.label,
                    accessor: (p) => {
                        const extraData = p.extra_data ?? {};
                        return extraData[field.key] ?? "";
                    }
                });
            }
        });
        fieldConfig.customQuestions.forEach(q => {
            columns.push({
                header: q.label,
                accessor: (p) => {
                    const customData = p.custom_data ?? {};
                    return customData[q.id] ?? "";
                }
            });
        });
        columns.push(
            { header: "Status Kehadiran", accessor: (p) => p.is_checked_in ? "Hadir" : "Belum Hadir" },
            { header: "Waktu Check-in", accessor: (p) => p.check_in_time ? new Date(p.check_in_time).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB' : "-" }
        );
        return columns;
    };

    const exportCSV = () => {
        if (!ev) return;
        const columns = buildExportColumns(list, ev.field_config);
        const header = columns.map(col => col.header);
        const rows = list.map((p, index) => columns.map(col => col.accessor(p, index)));
        const csvContent = [
            header.join(','),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n');
        const bom = "﻿";
        const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const eventName = ev.name.replace(/[^a-zA-Z0-9]/gi, '_').toLowerCase();
        const date = new Date().toLocaleDateString('id-ID').replace(/\//g, '-');
        a.download = `${eventName}_${date}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const exportXLSX = () => {
        if (!ev) return;
        const columns = buildExportColumns(list, ev.field_config);
        const worksheetData = list.map((p, index) => {
            const row: any = {};
            columns.forEach(col => { row[col.header] = col.accessor(p, index); });
            return row;
        });
        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Peserta");
        XLSX.writeFile(workbook, `${ev.name.replace(/[^a-zA-Z0-9]/gi, '_')}.xlsx`);
    };

    const exportPDF = () => {
        if (!ev) return;
        const doc = new jsPDF("l");
        doc.text(`Rekap Peserta - ${ev.name}`, 14, 15);
        const columns = buildExportColumns(list, ev.field_config);
        (doc as any).autoTable({
            head: [columns.map(c => c.header)],
            body: list.map((p, index) => columns.map(c => c.accessor(p, index))),
            startY: 20,
        });
        doc.save(`${ev.name.replace(/[^a-zA-Z0-9]/gi, '_')}.pdf`);
    };
"""
# Insert after buildExtraChips ends.
# I'll just look for the end of buildExtraChips function, which is "return chips; }"
marker = "  return chips;\n}"
if marker in content:
    new_content = content.replace(marker, marker + "\n" + export_functions)
    print(new_content)
