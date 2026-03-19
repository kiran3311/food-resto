import { useState } from "react";
import toast from "react-hot-toast";
import { Printer } from "lucide-react";
import { PrintableOrder } from "../types";
import { orderService } from "../services/orderService";
import { printService } from "../services/printService";

interface PrintButtonProps {
  order?: PrintableOrder;
  orderId?: string;
  className?: string;
  label?: string;
}

export const PrintButton = ({
  order,
  orderId,
  className,
  label = "Print"
}: PrintButtonProps): JSX.Element => {
  const [printing, setPrinting] = useState(false);

  const handlePrint = async (): Promise<void> => {
    try {
      setPrinting(true);

      let printable = order;
      if (!printable) {
        if (!orderId) {
          throw new Error("Missing order data for printing.");
        }

        const response = await orderService.getById(orderId);
        printable = {
          ...response.order,
          stall: response.stall
        };
      }

      await printService.printReceipt(printable);
      toast.success("Receipt sent to printer");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Silent print failed");
    } finally {
      setPrinting(false);
    }
  };

  return (
    <button
      type="button"
      disabled={printing}
      onClick={handlePrint}
      className={
        className ??
        "inline-flex items-center gap-2 rounded-lg border border-slate-300 px-2 py-1 text-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-400 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:hover:border-brand-500/60 dark:hover:bg-slate-800"
      }
    >
      <Printer size={14} />
      {printing ? "Printing..." : label}
    </button>
  );
};
