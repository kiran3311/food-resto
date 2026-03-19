import { PrintableOrder } from "../types";
import { buildReceiptHtml } from "../utils/receiptHtml";

const DEFAULT_PRINTER_STORAGE_KEY = "electron.defaultPrinter";

export class PrintServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PrintServiceError";
  }
}

class PrintService {
  private ensureElectron(): ElectronBridge {
    if (!window.electron) {
      throw new PrintServiceError(
        "Electron printing is only available inside the desktop app."
      );
    }

    return window.electron;
  }

  async getAvailablePrinters(): Promise<AvailablePrinter[]> {
    const electron = this.ensureElectron();
    return electron.getAvailablePrinters();
  }

  async getDefaultPrinter(): Promise<string | null> {
    const storedPrinter = localStorage.getItem(DEFAULT_PRINTER_STORAGE_KEY);
    if (storedPrinter) {
      return storedPrinter;
    }

    const electron = this.ensureElectron();
    const systemDefault = await electron.getDefaultPrinter();
    if (systemDefault) {
      this.setDefaultPrinter(systemDefault);
    }
    return systemDefault;
  }

  setDefaultPrinter(printerName: string): void {
    localStorage.setItem(DEFAULT_PRINTER_STORAGE_KEY, printerName);
  }

  async printReceipt(order: PrintableOrder): Promise<void> {
    const electron = this.ensureElectron();
    const printerName = await this.getDefaultPrinter();

    if (!printerName) {
      throw new PrintServiceError(
        "No default printer selected. Choose a printer before printing."
      );
    }

    const html = buildReceiptHtml(order);
    await electron.printReceipt({
      html,
      printerName
    });
  }
}

export const printService = new PrintService();
