import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { printService } from "../services/printService";

export const PrinterSelector = (): JSX.Element | null => {
  const [printers, setPrinters] = useState<AvailablePrinter[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!window.electron) {
      return;
    }

    const loadPrinters = async (): Promise<void> => {
      try {
        setLoading(true);
        const [availablePrinters, defaultPrinter] = await Promise.all([
          printService.getAvailablePrinters(),
          printService.getDefaultPrinter()
        ]);
        setPrinters(availablePrinters);
        setSelectedPrinter(defaultPrinter ?? "");
      } catch (error: unknown) {
        toast.error(error instanceof Error ? error.message : "Failed to load printers");
      } finally {
        setLoading(false);
      }
    };

    loadPrinters().catch(() => toast.error("Failed to load printers"));
  }, []);

  if (!window.electron) {
    return null;
  }

  return (
    <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
      <span className="whitespace-nowrap">Printer</span>
      <select
        className="rounded-lg border border-slate-300 px-2 py-1 text-sm transition-all duration-200 focus:border-brand-500 focus:shadow-sm dark:border-slate-700 dark:bg-slate-800"
        disabled={loading || printers.length === 0}
        value={selectedPrinter}
        onChange={(event) => {
          const printerName = event.target.value;
          setSelectedPrinter(printerName);
          printService.setDefaultPrinter(printerName);
          toast.success(`Default printer set to ${printerName}`);
        }}
      >
        <option value="">
          {loading ? "Loading printers..." : printers.length === 0 ? "No printers found" : "Select printer"}
        </option>
        {printers.map((printer) => (
          <option key={printer.name} value={printer.name}>
            {printer.displayName || printer.name}
          </option>
        ))}
      </select>
    </label>
  );
};
