import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("electron", {
    printReceipt: (payload) => ipcRenderer.invoke("printer:print-receipt", payload),
    getAvailablePrinters: () => ipcRenderer.invoke("printer:get-available"),
    getDefaultPrinter: () => ipcRenderer.invoke("printer:get-default")
});
