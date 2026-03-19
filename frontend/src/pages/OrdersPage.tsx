import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { PageHeader } from "../components/PageHeader";
import { comboService } from "../services/comboService";
import { menuService } from "../services/menuService";
import { orderService } from "../services/orderService";
import { Combo, MenuItem } from "../types";
import { formatMoney, getPrimaryCurrency } from "../utils/currency";
import { resolveMediaUrl } from "../utils/media";

interface DraftLine {
  key: string;
  itemType: "menu" | "combo";
  entityId: string;
  quantity: number;
}

const createLine = (): DraftLine => ({
  key: crypto.randomUUID(),
  itemType: "menu",
  entityId: "",
  quantity: 1
});

export const OrdersPage = (): JSX.Element => {
  const [customerName, setCustomerName] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([createLine()]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = (): Promise<void> =>
    Promise.all([menuService.list({ page: 1, limit: 100 }), comboService.list()])
      .then(([menuResponse, comboResponse]) => {
        setMenuItems(menuResponse.items.filter((item) => item.isAvailable));
        setCombos(comboResponse);
      })
      .finally(() => setLoading(false));

  useEffect(() => {
    setLoading(true);
    loadData().catch(() => toast.error("Failed to load order data"));
  }, []);

  const priceMap = useMemo(() => {
    const map = new Map<string, number>();
    menuItems.forEach((item) => map.set(`menu:${item._id}`, item.price));
    combos.forEach((combo) => map.set(`combo:${combo._id}`, combo.comboPrice));
    return map;
  }, [menuItems, combos]);

  const currencyMap = useMemo(() => {
    const map = new Map<string, MenuItem["currency"]>();
    menuItems.forEach((item) => map.set(`menu:${item._id}`, item.currency ?? "USD"));
    combos.forEach((combo) => map.set(`combo:${combo._id}`, combo.currency ?? "USD"));
    return map;
  }, [menuItems, combos]);

  const draftCurrencies = useMemo(
    () =>
      lines
        .map((line) => currencyMap.get(`${line.itemType}:${line.entityId}`))
        .filter(Boolean),
    [currencyMap, lines]
  );

  const draftCurrency = useMemo(
    () => getPrimaryCurrency(draftCurrencies),
    [draftCurrencies]
  );

  const hasMixedCurrencies = useMemo(
    () => new Set(draftCurrencies).size > 1,
    [draftCurrencies]
  );

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

    if (hasMixedCurrencies) {
      toast.error("All order items must use the same currency");
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
      window.open(`/orders/${created._id}/receipt`, "_blank");
    } catch (_error: unknown) {
      toast.error("Failed to create order");
    }
  };

  if (loading) {
    return <div className="text-slate-600 dark:text-slate-300">Loading orders...</div>;
  }

  return (
    <div>
      <PageHeader
        title="Order Management"
        subtitle="Create new counter orders and add available menu items quickly"
      />

      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-card dark:border-slate-700 dark:bg-slate-900">
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Create New Order</h2>

        <input
          className="mb-3 w-full rounded-xl border border-slate-300 px-3 py-2 transition-all duration-200 focus:-translate-y-0.5 focus:border-brand-500 focus:shadow-sm dark:border-slate-700 dark:bg-slate-800"
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
              <div
                key={line.key}
                className="grid gap-2 rounded-xl border border-slate-200 p-2 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:bg-orange-50/50 dark:border-slate-700 dark:hover:border-brand-500/40 dark:hover:bg-slate-800/70 md:grid-cols-4"
              >
                <select
                  className="rounded-lg border border-slate-300 px-2 py-2 transition-all duration-200 focus:border-brand-500 focus:shadow-sm dark:border-slate-700 dark:bg-slate-800"
                  value={line.itemType}
                  onChange={(event) =>
                    updateLine(line.key, {
                      itemType: event.target.value as "menu" | "combo",
                      entityId: ""
                    })
                  }
                >
                  <option value="menu">Menu Item</option>
                  <option value="combo">Combo</option>
                </select>

                <div className="flex items-center gap-2">
                  {selectedMenuItem?.image ? (
                    <img
                      src={resolveMediaUrl(selectedMenuItem.image)}
                      alt={selectedMenuItem.itemName}
                      className="h-10 w-10 rounded-lg border border-slate-200 object-cover transition-transform duration-300 hover:scale-105 dark:border-slate-700"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  ) : null}
                  <select
                    className="w-full rounded-lg border border-slate-300 px-2 py-2 transition-all duration-200 focus:border-brand-500 focus:shadow-sm dark:border-slate-700 dark:bg-slate-800"
                    value={line.entityId}
                    onChange={(event) => updateLine(line.key, { entityId: event.target.value })}
                  >
                    <option value="">Select item</option>
                    {(line.itemType === "menu" ? menuItems : combos).map((entry) => (
                      <option key={entry._id} value={entry._id}>
                        {line.itemType === "menu"
                          ? `${(entry as MenuItem).itemName} (${formatMoney(
                              (entry as MenuItem).price,
                              (entry as MenuItem).currency ?? "USD"
                            )})`
                          : `${(entry as Combo).comboName} (${formatMoney(
                              (entry as Combo).comboPrice,
                              (entry as Combo).currency ?? "USD"
                            )})`}
                      </option>
                    ))}
                  </select>
                </div>

                <input
                  className="rounded-lg border border-slate-300 px-2 py-2 transition-all duration-200 focus:border-brand-500 focus:shadow-sm dark:border-slate-700 dark:bg-slate-800"
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
                  className="rounded-lg border border-rose-300 px-2 py-2 text-xs text-rose-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-rose-50 dark:hover:bg-rose-950/20"
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
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 dark:border-slate-600 dark:hover:border-slate-500 dark:hover:bg-slate-800"
            onClick={addLine}
          >
            Add Line
          </button>
          <button
            type="button"
            className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-600 hover:shadow-card"
            onClick={createOrder}
          >
            Place Order
          </button>
          <p className="ml-auto rounded-full bg-orange-50 px-3 py-2 text-sm font-semibold text-slate-700 transition-all duration-300 hover:scale-[1.02] hover:bg-orange-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
            {hasMixedCurrencies
              ? "Total: Mixed currencies"
              : `Total: ${formatMoney(draftTotal, draftCurrency)}`}
          </p>
        </div>
      </section>

      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-card dark:border-slate-700 dark:bg-slate-900">
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Available Menu Items</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {menuItems.map((item) => (
            <div
              key={item._id}
              className="group rounded-xl border border-slate-200 p-2 transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-300 hover:shadow-card dark:border-slate-700 dark:hover:border-brand-500/40"
            >
              {item.image ? (
                <img
                  src={resolveMediaUrl(item.image)}
                  alt={item.itemName}
                  className="h-28 w-full rounded-lg object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className="flex h-28 w-full items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-500 transition-colors duration-300 group-hover:bg-orange-50 dark:bg-slate-800 dark:group-hover:bg-slate-800">
                  No image
                </div>
              )}
              <div className="mt-2 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800 transition-colors duration-300 group-hover:text-brand-600 dark:text-slate-100 dark:group-hover:text-orange-300">
                    {item.itemName}
                  </p>
                  <p className="text-xs text-slate-500">{formatMoney(item.price, item.currency ?? "USD")}</p>
                </div>
                <button
                  type="button"
                  className="rounded-lg border border-brand-500 px-2 py-1 text-xs text-brand-600 transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-50 dark:hover:bg-slate-800"
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
        <h2 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
          Currency Rules
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Orders can only contain items with one currency at a time. Combos also require menu items with the same currency.
        </p>
      </section>
    </div>
  );
};
