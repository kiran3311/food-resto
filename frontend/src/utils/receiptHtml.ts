import { PrintableOrder } from "../types";
import { formatMoney } from "./currency";

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const buildReceiptHtml = (order: PrintableOrder): string => {
  const rows = order.items
    .map(
      (item: PrintableOrder["items"][number]) => `
        <tr>
          <td>${escapeHtml(item.name)}</td>
          <td class="right">${item.quantity}</td>
          <td class="right">${escapeHtml(
            formatMoney(item.price * item.quantity, item.currency ?? "USD")
          )}</td>
        </tr>
      `
    )
    .join("");

  const stallName = escapeHtml(order.stall?.stallName ?? "Food Stall");
  const contact = escapeHtml(order.stall?.contact ?? "");
  const address = escapeHtml(order.stall?.address ?? "");
  const createdAt = escapeHtml(new Date(order.createdAt).toLocaleString());
  const total = escapeHtml(formatMoney(order.totalAmount, order.currency ?? "USD"));

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Receipt ${escapeHtml(order.orderToken)}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }

          html, body {
            margin: 0;
            padding: 0;
            width: 80mm;
            background: #ffffff;
            color: #0f172a;
            font-family: "Segoe UI", Arial, sans-serif;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          body {
            padding: 4mm;
            box-sizing: border-box;
          }

          .receipt {
            width: 100%;
            font-size: 12px;
            line-height: 1.4;
          }

          .center {
            text-align: center;
          }

          .right {
            text-align: right;
          }

          .logo {
            width: 48px;
            height: 48px;
            border-radius: 999px;
            object-fit: cover;
            margin: 0 auto 8px;
            display: block;
          }

          .divider {
            border-top: 1px dashed #94a3b8;
            margin: 8px 0;
            padding-top: 8px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
          }

          th, td {
            padding: 2px 0;
            vertical-align: top;
          }

          .total {
            font-weight: 700;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="center">
            ${order.stall?.logo ? `<img class="logo" src="${escapeHtml(order.stall.logo)}" alt="logo" />` : ""}
            <div><strong>${stallName}</strong></div>
            <div>${contact}</div>
            <div>${address}</div>
          </div>

          <div class="divider">
            <div><strong>Order Token:</strong> ${escapeHtml(order.orderToken)}</div>
            <div><strong>Customer:</strong> ${escapeHtml(order.customerName)}</div>
            <div><strong>Date:</strong> ${createdAt}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th class="right">Qty</th>
                <th class="right">Price</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>

          <div class="divider right total">
            Total: ${total}
          </div>

          <div class="center">Thank you. Please keep this token for pickup.</div>
        </div>
      </body>
    </html>
  `;
};
