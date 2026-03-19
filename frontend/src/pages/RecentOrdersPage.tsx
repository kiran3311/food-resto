import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { PageHeader } from "../components/PageHeader";
import { orderService } from "../services/orderService";
import { Order, OrderStatus } from "../types";
import { formatMoney } from "../utils/currency";

const ORDER_STATUSES: OrderStatus[] = ["Pending", "Preparing", "Ready", "Completed", "Cancelled"];

const getTodayDate = (): string => new Date().toISOString().slice(0, 10);

export const RecentOrdersPage = (): JSX.Element => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"" | OrderStatus>("");
  const [dateFrom, setDateFrom] = useState(getTodayDate);
  const [dateTo, setDateTo] = useState(getTodayDate);

  const loadOrders = (): Promise<void> =>
    orderService
      .list({
        page: 1,
        limit: 50,
        status: statusFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined
      })
      .then((response) => setOrders(response.orders))
      .finally(() => setLoading(false));

  useEffect(() => {
    setLoading(true);
    loadOrders().catch(() => toast.error("Failed to load recent orders"));
  }, [statusFilter, dateFrom, dateTo]);

  const updateStatus = async (id: string, status: OrderStatus): Promise<void> => {
    try {
      await orderService.updateStatus(id, status);
      setOrders((prev) => prev.map((order) => (order._id === id ? { ...order, status } : order)));
    } catch (_error: unknown) {
      toast.error("Failed to update status");
    }
  };

  const showTodayOrders = (): void => {
    const today = getTodayDate();
    setDateFrom(today);
    setDateTo(today);
  };

  const showAllOrders = (): void => {
    setDateFrom("");
    setDateTo("");
  };

  if (loading) {
    return <div className="text-slate-600 dark:text-slate-300">Loading recent orders...</div>;
  }

  return (
    <div>
      <PageHeader
        title="Recent Orders"
        subtitle="Review date-wise orders, update status, and print receipts"
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-card dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Order History</h2>
          <div className="flex flex-wrap items-center gap-2">
            <input
              className="rounded-lg border border-slate-300 px-2 py-1 text-sm transition-all duration-200 focus:border-brand-500 focus:shadow-sm dark:border-slate-700 dark:bg-slate-800"
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
            />
            <input
              className="rounded-lg border border-slate-300 px-2 py-1 text-sm transition-all duration-200 focus:border-brand-500 focus:shadow-sm dark:border-slate-700 dark:bg-slate-800"
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(event) => setDateTo(event.target.value)}
            />
            <select
              className="rounded-lg border border-slate-300 px-2 py-1 text-sm transition-all duration-200 focus:border-brand-500 focus:shadow-sm dark:border-slate-700 dark:bg-slate-800"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "" | OrderStatus)}
            >
              <option value="">All statuses</option>
              {ORDER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-3 py-1 text-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 dark:border-slate-600 dark:hover:border-slate-500 dark:hover:bg-slate-800"
              onClick={showTodayOrders}
            >
              Today
            </button>
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-3 py-1 text-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 dark:border-slate-600 dark:hover:border-slate-500 dark:hover:bg-slate-800"
              onClick={showAllOrders}
            >
              All
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="p-2">Token</th>
                <th className="p-2">Customer</th>
                <th className="p-2">Total</th>
                <th className="p-2">Status</th>
                <th className="p-2">Receipt</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order._id}
                  className="border-t border-slate-200 transition-colors duration-200 hover:bg-orange-50/60 dark:border-slate-700 dark:hover:bg-slate-800/60"
                >
                  <td className="p-2 font-semibold transition-colors duration-200 hover:text-brand-600 dark:hover:text-orange-300">
                    {order.orderToken}
                  </td>
                  <td className="p-2">{order.customerName}</td>
                  <td className="p-2">{formatMoney(order.totalAmount, order.currency ?? "USD")}</td>
                  <td className="p-2">
                    <select
                      className="rounded-lg border border-slate-300 px-2 py-1 transition-all duration-200 focus:border-brand-500 focus:shadow-sm dark:border-slate-700 dark:bg-slate-800"
                      value={order.status}
                      onChange={(event) =>
                        updateStatus(order._id, event.target.value as OrderStatus)
                      }
                    >
                      {ORDER_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2">
                    <button
                      type="button"
                      className="rounded-lg border border-slate-300 px-2 py-1 text-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-400 hover:bg-brand-50 dark:border-slate-600 dark:hover:border-brand-500/60 dark:hover:bg-slate-800"
                      onClick={() => window.open(`/orders/${order._id}/receipt`, "_blank")}
                    >
                      Print
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
