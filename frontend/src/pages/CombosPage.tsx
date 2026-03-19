import { FormEvent, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { PageHeader } from "../components/PageHeader";
import { comboService } from "../services/comboService";
import { menuService } from "../services/menuService";
import { Combo, MenuItem } from "../types";
import { formatMoney, getCurrencySymbol } from "../utils/currency";

interface ComboFormState {
  comboName: string;
  items: string[];
  comboPrice: string;
}

const emptyForm: ComboFormState = {
  comboName: "",
  items: [],
  comboPrice: ""
};

export const CombosPage = (): JSX.Element => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [form, setForm] = useState<ComboFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const selectedOriginal = useMemo(() => {
    return form.items.reduce((sum, itemId) => {
      const found = menuItems.find((menuItem) => menuItem._id === itemId);
      return sum + (found?.price ?? 0);
    }, 0);
  }, [form.items, menuItems]);

  const selectedCurrency = useMemo(() => {
    const selectedItem = menuItems.find((menuItem) => form.items.includes(menuItem._id));
    return selectedItem?.currency ?? "USD";
  }, [form.items, menuItems]);

  const selectedDiscount = useMemo(() => {
    const comboPrice = Number(form.comboPrice || 0);
    if (!selectedOriginal || comboPrice > selectedOriginal) {
      return 0;
    }
    return Number((((selectedOriginal - comboPrice) / selectedOriginal) * 100).toFixed(2));
  }, [selectedOriginal, form.comboPrice]);

  const loadData = (): Promise<void> =>
    Promise.all([menuService.list({ page: 1, limit: 100 }), comboService.list()])
      .then(([menuResponse, comboResponse]) => {
        setMenuItems(menuResponse.items);
        setCombos(comboResponse);
      })
      .finally(() => setLoading(false));

  useEffect(() => {
    loadData().catch(() => toast.error("Failed to load combos"));
  }, []);

  const resetForm = (): void => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!form.comboName || form.items.length < 2 || !form.comboPrice) {
      toast.error("Enter combo name, select at least 2 items, and set combo price");
      return;
    }

    try {
      const payload = {
        comboName: form.comboName,
        items: form.items,
        comboPrice: Number(form.comboPrice)
      };

      if (editingId) {
        await comboService.update(editingId, payload);
        toast.success("Combo updated");
      } else {
        await comboService.create(payload);
        toast.success("Combo created");
      }

      await loadData();
      resetForm();
    } catch (_error: unknown) {
      toast.error("Failed to save combo");
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    if (!window.confirm("Delete this combo?")) {
      return;
    }
    try {
      await comboService.remove(id);
      setCombos((prev) => prev.filter((combo) => combo._id !== id));
      toast.success("Combo deleted");
    } catch (_error: unknown) {
      toast.error("Failed to delete combo");
    }
  };

  const startEdit = (combo: Combo): void => {
    setEditingId(combo._id);
    setForm({
      comboName: combo.comboName,
      items: combo.items.map((item) => item._id),
      comboPrice: String(combo.comboPrice)
    });
  };

  const getComboItemNames = (combo: Combo): string => {
    return combo.items
      .map((item) => item.itemName ?? menuItems.find((menu) => menu._id === item._id)?.itemName ?? "")
      .filter(Boolean)
      .join(", ");
  };

  if (loading) {
    return <div className="text-slate-600 dark:text-slate-300">Loading combos...</div>;
  }

  return (
    <div>
      <PageHeader title="Special Combos" subtitle="Bundle menu items and track discount-driven sales" />

      <form
        className="mb-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
        onSubmit={handleSubmit}
      >
        <input
          className="rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
          placeholder="Combo name"
          value={form.comboName}
          onChange={(event) => setForm((prev) => ({ ...prev, comboName: event.target.value }))}
        />

        <div className="grid gap-2 md:grid-cols-2">
          {menuItems.map((item) => (
            <label key={item._id} className="flex items-center gap-2 rounded-lg border border-slate-200 p-2 dark:border-slate-700">
              <input
                type="checkbox"
                checked={form.items.includes(item._id)}
                onChange={(event) => {
                  setForm((prev) => ({
                    ...prev,
                    items: event.target.checked
                      ? [...prev.items, item._id]
                      : prev.items.filter((id) => id !== item._id)
                  }));
                }}
              />
              <span>
                {item.itemName} ({formatMoney(item.price, item.currency ?? "USD")})
              </span>
            </label>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <input
            className="rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
            type="number"
            step="0.01"
            placeholder={`Combo price (${getCurrencySymbol(selectedCurrency)})`}
            value={form.comboPrice}
            onChange={(event) => setForm((prev) => ({ ...prev, comboPrice: event.target.value }))}
          />
          <div className="rounded-xl border border-slate-200 p-2 text-sm dark:border-slate-700">
            Original: {formatMoney(selectedOriginal, selectedCurrency)}
          </div>
          <div className="rounded-xl border border-slate-200 p-2 text-sm dark:border-slate-700">
            Discount: {selectedDiscount.toFixed(2)}%
          </div>
        </div>

        <div className="flex gap-2">
          <button className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white" type="submit">
            {editingId ? "Update Combo" : "Create Combo"}
          </button>
          {editingId ? (
            <button
              type="button"
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm dark:border-slate-600"
              onClick={resetForm}
            >
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="p-2">Combo</th>
              <th className="p-2">Items</th>
              <th className="p-2">Price</th>
              <th className="p-2">Discount</th>
              <th className="p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {combos.map((combo) => (
              <tr key={combo._id} className="border-t border-slate-200 dark:border-slate-700">
                <td className="p-2 font-medium">{combo.comboName}</td>
                <td className="p-2">{getComboItemNames(combo)}</td>
                <td className="p-2">{formatMoney(combo.comboPrice, combo.currency ?? "USD")}</td>
                <td className="p-2">{combo.discountPercentage.toFixed(2)}%</td>
                <td className="p-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="rounded-lg border border-slate-300 px-2 py-1 text-xs dark:border-slate-600"
                      onClick={() => startEdit(combo)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-rose-300 px-2 py-1 text-xs text-rose-700"
                      onClick={() => handleDelete(combo._id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
