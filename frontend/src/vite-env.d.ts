/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_SERVER_URL?: string;
}

interface AvailablePrinter {
  name: string;
  displayName: string;
  isDefault: boolean;
}

interface ElectronBridge {
  printReceipt: (payload: { html: string; printerName?: string | null }) => Promise<{ success: true }>;
  getAvailablePrinters: () => Promise<AvailablePrinter[]>;
  getDefaultPrinter: () => Promise<string | null>;
}

interface Window {
  electron?: ElectronBridge;
}
