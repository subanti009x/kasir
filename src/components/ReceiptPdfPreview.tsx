"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Loader2, Printer, RefreshCw, X } from "lucide-react";
import { createReceiptPdf, type ReceiptData, type StoreInfo } from "@/lib/printReceipt";
import { useFeatures } from "@/lib/useFeatures";
import { useAuth } from "@/lib/auth";

type ReceiptPaper = { name: string; widthMm: number; heightMm: number; width: number };
type LocalPrinter = {
  name: string;
  driver: string;
  isDefault: boolean;
  defaultPaperName: string;
  receiptPaperSizes: ReceiptPaper[];
  recommendedPaper: ReceiptPaper | null;
};

export function ReceiptPdfPreview({
  receipt,
  store,
  onClose,
}: {
  receipt: ReceiptData;
  store: StoreInfo;
  onClose: () => void;
}) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [printerError, setPrinterError] = useState("");
  const [printers, setPrinters] = useState<LocalPrinter[]>([]);
  const [printerName, setPrinterName] = useState("");
  const [paperName, setPaperName] = useState("");
  const [loadingPrinters, setLoadingPrinters] = useState(true);
  const [printing, setPrinting] = useState(false);
  const [printMessage, setPrintMessage] = useState("");
  const { hasFeature, loading: featuresLoading } = useFeatures();
  const { token, user } = useAuth();
  const receiptFormat = hasFeature("FAJAR_CLIENT_RECEIPT") ? "FAJAR_CLIENT" : "DEFAULT";
  const fileName = `Struk-${String(receipt.receiptId || "transaksi").replace(/[^a-zA-Z0-9_-]/g, "-")}.pdf`;

  const selectedPrinter = useMemo(
    () => printers.find((printer) => printer.name === printerName) || null,
    [printers, printerName],
  );
  const selectedPaper = useMemo(
    () => selectedPrinter?.receiptPaperSizes.find((paper) => paper.name === paperName) || selectedPrinter?.recommendedPaper || null,
    [selectedPrinter, paperName],
  );
  const isVirtualPrinter = /print to pdf|onenote|xps|fax/i.test(selectedPrinter?.name || "");

  async function loadPrinters() {
    setLoadingPrinters(true);
    setPrinterError("");
    try {
      const response = await fetch("/local-printers", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Daftar printer Windows tidak dapat dibaca.");
      const list = Array.isArray(result.printers) ? (result.printers as LocalPrinter[]) : [];
      setPrinters(list);
      const preferred = list.find((printer) => printer.isDefault) || list[0];
      setPrinterName((current) => list.some((printer) => printer.name === current) ? current : (preferred?.name || ""));
      const preferredPaper = preferred?.recommendedPaper || preferred?.receiptPaperSizes?.[0];
      setPaperName(preferredPaper?.name || "");
    } catch (reason) {
      setPrinterError(reason instanceof Error ? reason.message : "Gagal membaca daftar printer.");
    } finally {
      setLoadingPrinters(false);
    }
  }

  useEffect(() => { void loadPrinters(); }, []);

  useEffect(() => {
    setPaperName(selectedPrinter?.recommendedPaper?.name || selectedPrinter?.receiptPaperSizes?.[0]?.name || "");
    setPrintMessage("");
  }, [printerName, selectedPrinter]);

  useEffect(() => {
    if (featuresLoading) return;
    let active = true;
    let objectUrl: string | null = null;
    setPdfUrl(null);
    setError("");
    createReceiptPdf(receipt, store, selectedPaper?.widthMm, receiptFormat)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        if (active) setPdfUrl(objectUrl);
        else URL.revokeObjectURL(objectUrl);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "PDF struk tidak dapat dibuat.");
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [receipt, store, selectedPaper?.widthMm, receiptFormat, featuresLoading]);

  async function printToSelectedPrinter() {
    if (!selectedPrinter || !selectedPaper || isVirtualPrinter) return;
    setPrinting(true);
    setPrintMessage("");
    try {
      const response = await fetch("/local-printers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ printerName: selectedPrinter.name, paperSizeName: selectedPaper.name, receipt, store, receiptFormat, tenantId: user?.tenantId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Struk gagal dikirim ke printer.");
      setPrintMessage(`Struk dikirim ke ${result.printer} · ${result.paperWidthMm} mm.`);
    } catch (reason) {
      setPrintMessage(reason instanceof Error ? reason.message : "Struk gagal dicetak.");
    } finally {
      setPrinting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="receipt-preview-title">
      <section className="flex h-[min(94vh,960px)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-slate-100 shadow-2xl">
        <header className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-4 py-3 sm:px-5">
          <div className="mr-auto flex min-w-0 items-center gap-2">
            <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-teal-50 text-teal-700"><Printer size={18} /></div>
            <div className="min-w-0">
              <h3 id="receipt-preview-title" className="truncate text-sm font-bold text-slate-950">Pratinjau PDF Struk</h3>
              <p className="truncate text-xs text-slate-500">{fileName} · {receiptFormat === "FAJAR_CLIENT" ? "format khusus Toko Fajar" : "format struk standar"}</p>
            </div>
          </div>
          {pdfUrl && (
            <>
              <a href={pdfUrl} download={fileName} className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                <Download size={15} /> Unduh PDF
              </a>
              <button type="button" onClick={() => window.open(pdfUrl, "_blank", "noopener,noreferrer")} className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                <Printer size={15} /> Buka dialog cetak
              </button>
            </>
          )}
          <button type="button" aria-label="Tutup pratinjau PDF" onClick={onClose} className="grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900">
            <X size={19} />
          </button>
        </header>

        <div className="grid gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end sm:px-5">
          <label className="block text-xs font-semibold text-slate-600">
            Printer Windows
            <select value={printerName} onChange={(event) => setPrinterName(event.target.value)} disabled={loadingPrinters || printers.length === 0} className="mt-1 block h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal text-slate-900">
              {printers.length === 0 && <option value="">{loadingPrinters ? "Membaca printer..." : "Printer tidak ditemukan"}</option>}
              {printers.map((printer) => <option key={printer.name} value={printer.name}>{printer.name}{printer.isDefault ? " (Default)" : ""}</option>)}
            </select>
          </label>
          <label className="block text-xs font-semibold text-slate-600">
            Ukuran kertas dari driver
            <select value={paperName} onChange={(event) => setPaperName(event.target.value)} disabled={!selectedPrinter?.receiptPaperSizes?.length} className="mt-1 block h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal text-slate-900">
              {!selectedPrinter?.receiptPaperSizes?.length && <option value="">Driver belum melaporkan ukuran struk</option>}
              {selectedPrinter?.receiptPaperSizes?.map((paper) => <option key={paper.name} value={paper.name}>{paper.name} · {paper.widthMm} mm</option>)}
            </select>
          </label>
          <button type="button" onClick={() => void loadPrinters()} disabled={loadingPrinters} aria-label="Muat ulang daftar printer" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            <RefreshCw size={15} className={loadingPrinters ? "animate-spin" : ""} /> Muat ulang
          </button>
          <div className="sm:col-span-3">
            {printerError ? <p className="text-xs text-rose-700">{printerError}</p> : selectedPaper ? <p className="text-xs text-emerald-700">Terdeteksi: {selectedPaper.name}, lebar {selectedPaper.widthMm} mm. Pratinjau PDF sudah memakai lebar ini.</p> : <p className="text-xs text-amber-700">Driver printer yang dipilih belum menyediakan ukuran kertas struk. PDF menggunakan ukuran bawaan aplikasi; buat/pilih ukuran roll di preferensi driver Windows agar dapat disesuaikan otomatis.</p>}
            {selectedPrinter && selectedPaper && (
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <button type="button" onClick={() => void printToSelectedPrinter()} disabled={printing || isVirtualPrinter} className="inline-flex h-9 items-center gap-2 rounded-lg bg-slate-950 px-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
                  {printing ? <Loader2 size={15} className="animate-spin" /> : <Printer size={15} />}
                  {printing ? "Mengirim..." : "Cetak ke printer terpilih"}
                </button>
                {isVirtualPrinter && <span className="text-xs text-slate-500">Printer virtual: unduh PDF atau gunakan dialog cetak.</span>}
                {printMessage && <span role="status" className="text-xs text-slate-600">{printMessage}</span>}
              </div>
            )}
          </div>
        </div>

        {pdfUrl ? (
          <iframe title="Pratinjau PDF struk" src={pdfUrl} className="min-h-0 w-full flex-1 border-0 bg-slate-200" />
        ) : error ? (
          <div className="grid flex-1 place-items-center p-6 text-center text-sm text-rose-700">Gagal membuat pratinjau PDF. {error}</div>
        ) : (
          <div className="flex flex-1 items-center justify-center gap-2 text-sm text-slate-500"><Loader2 size={18} className="animate-spin" /> Menyiapkan pratinjau PDF...</div>
        )}
      </section>
    </div>
  );
}
