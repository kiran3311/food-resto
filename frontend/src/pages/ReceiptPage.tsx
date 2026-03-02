import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { orderService } from "../services/orderService";
import { Order, Stall } from "../types";
import { resolveMediaUrl } from "../utils/media";

export const ReceiptPage = (): JSX.Element => {
  const { id } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [stall, setStall] = useState<Stall | null>(null);

  useEffect(() => {
    if (!id) {
      return;
    }
    orderService.getById(id).then((response) => {
      setOrder(response.order);
      setStall(response.stall);
      setTimeout(() => {
        window.print();
      }, 350);
    });
  }, [id]);

  if (!order) {
    return <div className="p-6 text-slate-700">Loading receipt...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 print:bg-white print:p-0">
      <style>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 4mm;
          }
          body {
            margin: 0;
          }
        }
      `}</style>

      <div className="mx-auto w-[300px] rounded-xl bg-white p-3 text-[12px] text-slate-900 shadow-lg print:shadow-none">
        <div className="text-center">
          {stall?.logo ? (
            <img src={resolveMediaUrl(stall.logo)} alt="logo" className="mx-auto mb-2 h-12 w-12 rounded-full object-cover" />
          ) : null}
          <h1 className="text-sm font-bold">{stall?.stallName ?? "Food Stall"}</h1>
          <p>{stall?.contact ?? ""}</p>
          <p>{stall?.address ?? ""}</p>
        </div>

        <div className="my-2 border-y border-dashed border-slate-400 py-2">
          <p>
            <strong>Order Token:</strong> {order.orderToken}
          </p>
          <p>
            <strong>Customer:</strong> {order.customerName}
          </p>
          <p>
            <strong>Date:</strong> {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>

        <table className="w-full text-left">
          <thead>
            <tr>
              <th>Item</th>
              <th className="text-right">Qty</th>
              <th className="text-right">Price</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, index) => (
              <tr key={`${item.itemId}-${index}`}>
                <td>{item.name}</td>
                <td className="text-right">{item.quantity}</td>
                <td className="text-right">${(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-2 border-t border-dashed border-slate-400 pt-2">
          <p className="text-right text-sm font-bold">Total: ${order.totalAmount.toFixed(2)}</p>
        </div>

        <p className="mt-3 text-center text-[11px]">Thank you. Please keep this token for pickup.</p>
      </div>
    </div>
  );
};
