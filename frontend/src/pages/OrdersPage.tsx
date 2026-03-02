import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { PageHeader } from "../components/PageHeader";
import { comboService } from "../services/comboService";
import { menuService } from "../services/menuService";
import { orderService } from "../services/orderService";
import { Combo, MenuItem, Order, OrderStatus } from "../types";
import { resolveMediaUrl } from "../utils/media";

interface DraftLine {
  key: string;
  itemType: "menu" | "combo";
  entityId: string;
  quantity: number;
}

const ORDER_STATUSES: OrderStatus[] = ["Pending", "Preparing", "Ready", "Completed", "Cancelled"];

const createLine = (): DraftLine => ({
  key: crypto.randomUUID(),
  itemType: "menu",
  entityId: "",
  quantity: 1
});

export const OrdersPage = (): JSX.Element => {
  const [customerName, setCustomerName] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([createLine()]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"" | OrderStatus>("");

  const loadData = (): Promise<void> =>
    Promise.all([
      menuService.list({ page: 1, limit: 100 }),
      comboService.list(),
      orderService.list({ page: 1, limit: 50, status: statusFilter || undefined })
    ])
      .then(([menuResponse, comboResponse, orderResponse]) => {
        setMenuItems(menuResponse.items.filter((item) => item.isAvailable));
        setCombos(comboResponse);
        setOrders(orderResponse.orders);
      })
      .finally(() => setLoading(false));

  useEffect(() => {
    setLoading(true);
    loadData().catch(() => toast.error("Failed to load order data"));
  }, [statusFilter]);

  const priceMap = useMemo(() => {
    const map = new Map<string, number>();
    menuItems.forEach((item) => map.set(`menu:${item._id}`, item.price));
    combos.forEach((combo) => map.set(`combo:${combo._id}`, combo.comboPrice));
    return map;
  }, [menuItems, combos]);

  const draftTotal = useMemo(() => {
    return lines.reduce((sum, line) => {
      const price = priceMap.get(`${line.itemType}:${line.entityId}`) ?? 0;
      return sum + price * line.quantity;
    }, 0);
  }, [lines, priceMap]);

  const addLine = (): void => setLines((prev) => [...prev, createLine()]);
  const removeLine = (key: string): void =>
    setLines((prev) => prev.filter((line) => line.key !== key));

  const updateLine = (key: string, patch: Partial<DraftLine>): void => {
    setLines((prev) => prev.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  };

  const addMenuItemToOrder = (menuItemId: string): void => {
    setLines((prev) => [
      ...prev,
      {
        key: crypto.randomUUID(),
        itemType: "menu",
        entityId: menuItemId,
        quantity: 1
      }
    ]);
  };

  const createOrder = async (): Promise<void> => {
    const validLines = lines.filter((line) => Boolean(line.entityId));
    if (validLines.length === 0) {
      toast.error("Add at least one valid order line");
      return;
    }

    try {
      const created = await orderService.create({
        customerName: customerName.trim() || undefined,
        lines: validLines.map((line) => ({
          itemType: line.itemType,
          entityId: line.entityId,
          quantity: line.quantity
        }))
      });
      toast.success(`Order created (${created.orderToken})`);
      setCustomerName("");
      setLines([createLine()]);
      await loadData();
      window.open(`/orders/${created._id}/receipt`, "_blank");
    } catch (_error: unknown) {
      toast.error("Failed to create order");
    }
  };

  const updateStatus = async (id: string, status: OrderStatus): Promise<void> => {
    try {
      await orderService.updateStatus(id, status);
      setOrders((prev) => prev.map((order) => (order._id === id ? { ...order, status } : order)));
    } catch (_error: unknown) {
      toast.error("Failed to update status");
    }
  };

  if (loading) {
    return <div className="text-slate-600 dark:text-slate-300">Loading orders...</div>;
  }

  return (
    <div>
      <PageHeader title="Order Management" subtitle="Create counter orders and track preparation status" />

      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Create New Order</h2>

        <input
          className="mb-3 w-full rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
          placeholder="Customer name (optional)"
          value={customerName}
          onChange={(event) => setCustomerName(event.target.value)}
        />

        <div className="space-y-2">
          {lines.map((line) => {
            const selectedMenuItem =
              line.itemType === "menu"
                ? menuItems.find((menuItem) => menuItem._id === line.entityId)
                : null;

            return (
              <div key={line.key} className="grid gap-2 rounded-xl border border-slate-200 p-2 dark:border-slate-700 md:grid-cols-4">
                <select
                  className="rounded-lg border border-slate-300 px-2 py-2 dark:border-slate-700 dark:bg-slate-800"
                  value={line.itemType}
                  onChange={(event) => updateLine(line.key, { itemType: event.target.value as "menu" | "combo", entityId: "" })}
                >
                  <option value="menu">Menu Item</option>
                  <option value="combo">Combo</option>
                </select>

                <div className="flex items-center gap-2">
                  {selectedMenuItem?.image ? (
                    <img
                      src={resolveMediaUrl(selectedMenuItem.image)}
                      alt={selectedMenuItem.itemName}
                      className="h-10 w-10 rounded-lg border border-slate-200 object-cover dark:border-slate-700"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  ) : null}
                  <select
                    className="w-full rounded-lg border border-slate-300 px-2 py-2 dark:border-slate-700 dark:bg-slate-800"
                    value={line.entityId}
                    onChange={(event) => updateLine(line.key, { entityId: event.target.value })}
                  >
                    <option value="">Select item</option>
                    {(line.itemType === "menu" ? menuItems : combos).map((entry) => (
                      <option key={entry._id} value={entry._id}>
                        {line.itemType === "menu"
                          ? `${(entry as MenuItem).itemName} ($${(entry as MenuItem).price.toFixed(2)})`
                          : `${(entry as Combo).comboName} ($${(entry as Combo).comboPrice.toFixed(2)})`}
                      </option>
                    ))}
                  </select>
                </div>

                <input
                  className="rounded-lg border border-slate-300 px-2 py-2 dark:border-slate-700 dark:bg-slate-800"
                  type="number"
                  min={1}
                  value={line.quantity}
                  onChange={(event) =>
                    updateLine(line.key, {
                      quantity: Math.max(1, Number(event.target.value || 1))
                    })
                  }
                />

                <button
                  type="button"
                  className="rounded-lg border border-rose-300 px-2 py-2 text-xs text-rose-700"
                  onClick={() => removeLine(line.key)}
                  disabled={lines.length === 1}
                >
                  Remove
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600"
            onClick={addLine}
          >
            Add Line
          </button>
          <button
            type="button"
            className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white"
            onClick={createOrder}
          >
            Place Order
          </button>
          <p className="ml-auto text-sm font-semibold text-slate-700 dark:text-slate-200">
            Total: ${draftTotal.toFixed(2)}
          </p>
        </div>
      </section>

      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Available Menu Items</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {menuItems.map((item) => (
            <div key={item._id} className="rounded-xl border border-slate-200 p-2 dark:border-slate-700">
              {item.image ? (
                <img
                  src={resolveMediaUrl(item.image)}
                  alt={item.itemName}
                  className="h-28 w-full rounded-lg object-cover"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className="flex h-28 w-full items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-500 dark:bg-slate-800">
                  No image
                </div>
              )}
              <div className="mt-2 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{item.itemName}</p>
                  <p className="text-xs text-slate-500">${item.price.toFixed(2)}</p>
                </div>
                <button
                  type="button"
                  className="rounded-lg border border-brand-500 px-2 py-1 text-xs text-brand-600"
                  onClick={() => addMenuItemToOrder(item._id)}
                >
                  Add
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Recent Orders</h2>
          <select
            className="rounded-lg border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800"
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
                <tr key={order._id} className="border-t border-slate-200 dark:border-slate-700">
                  <td className="p-2 font-semibold">{order.orderToken}</td>
                  <td className="p-2">{order.customerName}</td>
                  <td className="p-2">${order.totalAmount.toFixed(2)}</td>
                  <td className="p-2">
                    <select
                      className="rounded-lg border border-slate-300 px-2 py-1 dark:border-slate-700 dark:bg-slate-800"
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
                      className="rounded-lg border border-slate-300 px-2 py-1 text-xs dark:border-slate-600"
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
