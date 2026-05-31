'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { adminApi } from '@/lib/api';

const SECTION_COLORS: Record<string, string> = {
  main:        'bg-blue-50   text-blue-700   border-blue-200',
  outdoor:     'bg-green-50  text-green-700  border-green-200',
  bar:         'bg-purple-50 text-purple-700 border-purple-200',
  private:     'bg-amber-50  text-amber-700  border-amber-200',
};

export default function QRCodesPage() {
  const { staff, token } = useAuthStore();
  const [tables, setTables] = useState<any[]>([]);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filterSection, setFilterSection] = useState('all');
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const [previewTable, setPreviewTable] = useState<any>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    if (!staff?.restaurantId || !token) return;
    const [t, r]: any = await Promise.all([
      adminApi.getTables(staff.restaurantId, token),
      adminApi.getRestaurant(staff.restaurantId, token),
    ]);
    setTables(t);
    setRestaurant(r);
    setLoading(false);
  };

  useEffect(() => { load(); }, [staff, token]);

  const sections = ['all', ...Array.from(new Set(tables.map((t) => t.section)))];

  const filtered = filterSection === 'all'
    ? tables
    : tables.filter((t) => t.section === filterSection);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(filtered.map((t) => t.id)));
  const clearAll = () => setSelected(new Set());

  const regenerateQR = async (id: string) => {
    if (!staff?.restaurantId || !token) return;
    setRegenerating(id);
    try {
      await adminApi.regenerateQR(staff.restaurantId, id, token);
      await load();
    } finally { setRegenerating(null); }
  };

  // Download single QR as PNG
  const downloadQR = (table: any) => {
    const link = document.createElement('a');
    link.href = table.qrCodeUrl;
    link.download = `QR-Table-${table.tableNumber}.png`;
    link.click();
  };

  // Download all selected as individual PNGs
  const downloadSelected = () => {
    const toDownload = tables.filter((t) => selected.has(t.id));
    toDownload.forEach((table, i) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = table.qrCodeUrl;
        link.download = `QR-Table-${table.tableNumber}.png`;
        link.click();
      }, i * 300);
    });
  };

  // Print selected QR codes
  const printSelected = () => {
    const toPrint = tables.filter((t) => selected.has(t.id));
    if (!toPrint.length) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>QR Codes — ${restaurant?.name || 'Restaurant'}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: white; }
          .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; padding: 20px; }
          .card {
            border: 2px solid #f0e8e0;
            border-radius: 16px;
            padding: 20px;
            text-align: center;
            page-break-inside: avoid;
            background: white;
          }
          .restaurant { font-size: 11px; color: #78716c; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
          .qr { width: 160px; height: 160px; margin: 0 auto 12px; display: block; }
          .table-num { font-size: 28px; font-weight: 900; color: #1c1917; margin-bottom: 4px; }
          .section { font-size: 12px; color: #78716c; text-transform: capitalize; margin-bottom: 8px; }
          .scan-text { font-size: 11px; color: #f97316; font-weight: 700; letter-spacing: 0.05em; }
          .divider { width: 40px; height: 2px; background: #f97316; margin: 8px auto; border-radius: 99px; }
          @media print {
            .grid { gap: 16px; padding: 16px; }
            @page { margin: 10mm; }
          }
        </style>
      </head>
      <body>
        <div class="grid">
          ${toPrint.map((table) => `
            <div class="card">
              <p class="restaurant">${restaurant?.name || 'Restaurant'}</p>
              <img class="qr" src="${table.qrCodeUrl}" alt="QR Table ${table.tableNumber}" />
              <div class="divider"></div>
              <p class="table-num">Table ${table.tableNumber}</p>
              <p class="section">${table.section} · ${table.capacity} seats</p>
              <p class="scan-text">📱 SCAN TO ORDER</p>
            </div>
          `).join('')}
        </div>
        <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }</script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const selectedTables = tables.filter((t) => selected.has(t.id));

  return (
    <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-black text-gray-900">QR Code Generator</h1>
            <p className="text-gray-400 text-xs mt-0.5">
              {tables.length} tables · {selected.size} selected
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selected.size > 0 && (
              <>
                <button onClick={downloadSelected}
                  className="btn-secondary text-sm flex items-center gap-2">
                  ⬇ Download ({selected.size})
                </button>
                <button onClick={printSelected}
                  className="btn-primary text-sm flex items-center gap-2">
                  🖨️ Print ({selected.size})
                </button>
              </>
            )}
          </div>
        </div>

        {/* Section filter + select all */}
        <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
          <div className="flex gap-1.5 flex-wrap">
            {sections.map((s) => (
              <button key={s} onClick={() => setFilterSection(s)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${filterSection === s ? 'bg-orange-500 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-orange-300'}`}>
                {s === 'all' ? `All (${tables.length})` : `${s} (${tables.filter((t) => t.section === s).length})`}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={selectAll} className="text-xs text-orange-500 font-semibold hover:text-orange-600">Select All</button>
            <span className="text-gray-200">|</span>
            <button onClick={clearAll} className="text-xs text-gray-400 font-semibold hover:text-gray-600">Clear</button>
          </div>
        </div>

        {/* QR Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[...Array(8)].map((_, i) => <div key={i} className="skeleton h-64" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card py-20 text-center">
            <div className="text-5xl mb-3">📱</div>
            <p className="text-gray-400">No tables found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filtered.map((table) => {
              const isSelected = selected.has(table.id);
              return (
                <div key={table.id}
                  onClick={() => toggleSelect(table.id)}
                  className={`card cursor-pointer transition-all hover:shadow-md group relative ${isSelected ? 'ring-2 ring-orange-500 border-orange-300 bg-orange-50/30' : 'hover:border-orange-200'}`}>

                  {/* Checkbox */}
                  <div className={`absolute top-3 left-3 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all z-10 ${isSelected ? 'bg-orange-500 border-orange-500' : 'border-gray-300 bg-white group-hover:border-orange-400'}`}>
                    {isSelected && <span className="text-white text-xs font-black">✓</span>}
                  </div>

                  {/* Section badge */}
                  <div className="absolute top-3 right-3 z-10">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border capitalize ${SECTION_COLORS[table.section] || 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                      {table.section}
                    </span>
                  </div>

                  <div className="p-4 pt-10">
                    {/* QR Code */}
                    <div className="relative mb-3">
                      {table.qrCodeUrl ? (
                        <img src={table.qrCodeUrl} alt={`QR Table ${table.tableNumber}`}
                          className="w-full aspect-square object-contain rounded-xl bg-white border border-gray-100 p-2" />
                      ) : (
                        <div className="w-full aspect-square rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                          <span className="text-gray-300 text-sm">No QR</span>
                        </div>
                      )}
                    </div>

                    {/* Table info */}
                    <div className="text-center mb-3">
                      <p className="text-2xl font-black text-gray-900">Table {table.tableNumber}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{table.capacity} seats</p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => setPreviewTable(table)}
                        className="flex-1 text-xs bg-blue-50 text-blue-600 border border-blue-200 py-2 rounded-xl font-semibold hover:bg-blue-100 transition-all">
                        👁 Preview
                      </button>
                      <button onClick={() => downloadQR(table)}
                        className="flex-1 text-xs bg-green-50 text-green-600 border border-green-200 py-2 rounded-xl font-semibold hover:bg-green-100 transition-all">
                        ⬇ Save
                      </button>
                      <button onClick={() => regenerateQR(table.id)} disabled={regenerating === table.id}
                        className="text-xs bg-gray-50 text-gray-500 border border-gray-200 px-2.5 py-2 rounded-xl font-semibold hover:bg-gray-100 transition-all disabled:opacity-50"
                        title="Regenerate QR">
                        {regenerating === table.id ? '...' : '↻'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bulk action bar */}
        {selected.size > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
            <div className="bg-gray-900 text-white rounded-2xl px-6 py-4 flex items-center gap-4 shadow-2xl">
              <span className="text-sm font-semibold">{selected.size} table{selected.size > 1 ? 's' : ''} selected</span>
              <div className="w-px h-5 bg-white/20" />
              <button onClick={downloadSelected}
                className="flex items-center gap-2 text-sm font-semibold text-orange-400 hover:text-orange-300 transition-colors">
                ⬇ Download All
              </button>
              <button onClick={printSelected}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all">
                🖨️ Print All
              </button>
              <button onClick={clearAll} className="text-white/40 hover:text-white/70 text-sm">✕</button>
            </div>
          </div>
        )}

        {/* Preview modal */}
        {previewTable && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setPreviewTable(null)}>
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center"
              onClick={(e) => e.stopPropagation()}>

              {/* Print-style card preview */}
              <div className="border-2 border-orange-200 rounded-2xl p-6 mb-5 bg-gradient-to-b from-orange-50 to-white">
                <p className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-3">
                  {restaurant?.name || 'Restaurant'}
                </p>
                {previewTable.qrCodeUrl && (
                  <img src={previewTable.qrCodeUrl} alt="QR Code"
                    className="w-48 h-48 mx-auto mb-4 rounded-xl border border-orange-100 bg-white p-2" />
                )}
                <div className="w-10 h-1 bg-orange-500 rounded-full mx-auto mb-3" />
                <p className="text-3xl font-black text-gray-900 mb-1">Table {previewTable.tableNumber}</p>
                <p className="text-sm text-gray-400 capitalize mb-3">{previewTable.section} · {previewTable.capacity} seats</p>
                <p className="text-xs font-bold text-orange-500 tracking-widest">📱 SCAN TO ORDER</p>
              </div>

              <p className="text-xs text-gray-400 mb-5 font-mono break-all">{previewTable.qrCode}</p>

              <div className="flex gap-2">
                <button onClick={() => { downloadQR(previewTable); }}
                  className="flex-1 btn-secondary text-sm">⬇ Download</button>
                <button onClick={() => {
                  setSelected(new Set([previewTable.id]));
                  setPreviewTable(null);
                  setTimeout(printSelected, 100);
                }} className="flex-1 btn-primary text-sm">🖨️ Print</button>
              </div>
              <button onClick={() => setPreviewTable(null)} className="mt-3 text-gray-400 text-sm hover:text-gray-600 w-full">Close</button>
            </div>
          </div>
        )}
      </div>
  );
}
