import path from "path";
import { fileURLToPath } from "url";
import { app, BrowserWindow, ipcMain } from "electron";
const isDevelopment = Boolean(process.env.VITE_DEV_SERVER_URL);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let mainWindow = null;
const createMainWindow = async () => {
    mainWindow = new BrowserWindow({
        width: 1440,
        height: 920,
        minWidth: 1100,
        minHeight: 720,
        backgroundColor: "#f8fafc",
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true
        }
    });
    if (isDevelopment) {
        await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
        mainWindow.webContents.openDevTools({ mode: "detach" });
    }
    else {
        await mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
    }
};
const getPrinterList = async () => {
    if (!mainWindow) {
        throw new Error("Main window is not ready.");
    }
    return mainWindow.webContents.getPrintersAsync();
};
const printReceipt = async ({ html, printerName }) => {
    const printers = await getPrinterList();
    const selectedPrinter = printerName?.trim() || printers.find((printer) => printer.isDefault)?.name || "";
    if (!selectedPrinter) {
        throw new Error("No printer was selected and no default printer is available.");
    }
    const printerExists = printers.some((printer) => printer.name === selectedPrinter);
    if (!printerExists) {
        throw new Error(`Printer "${selectedPrinter}" was not found.`);
    }
    const printWindow = new BrowserWindow({
        show: false,
        autoHideMenuBar: true,
        webPreferences: {
            sandbox: true,
            contextIsolation: true,
            javascript: true
        }
    });
    try {
        await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
        await new Promise((resolve, reject) => {
            printWindow.webContents.once("did-finish-load", () => {
                setTimeout(() => {
                    printWindow.webContents.print({
                        silent: true,
                        deviceName: selectedPrinter,
                        printBackground: true,
                        margins: {
                            marginType: "none"
                        }
                    }, (success, failureReason) => {
                        if (!success) {
                            reject(new Error(failureReason || "Silent print failed."));
                            return;
                        }
                        resolve();
                    });
                }, 150);
            });
            printWindow.webContents.once("did-fail-load", (_event, code, description) => {
                reject(new Error(`Print window failed to load (${code}): ${description}`));
            });
        });
    }
    finally {
        if (!printWindow.isDestroyed()) {
            printWindow.close();
        }
    }
};
app.whenReady().then(async () => {
    ipcMain.handle("printer:get-available", async () => {
        const printers = await getPrinterList();
        return printers.map((printer) => ({
            name: printer.name,
            displayName: printer.displayName,
            isDefault: printer.isDefault
        }));
    });
    ipcMain.handle("printer:get-default", async () => {
        const printers = await getPrinterList();
        const defaultPrinter = printers.find((printer) => printer.isDefault);
        return defaultPrinter?.name ?? null;
    });
    ipcMain.handle("printer:print-receipt", async (_event, payload) => {
        try {
            await printReceipt(payload);
            return { success: true };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Silent printing failed.";
            console.error("Silent print failed", error);
            throw new Error(message);
        }
    });
    await createMainWindow();
    app.on("activate", async () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            await createMainWindow();
        }
    });
});
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});
