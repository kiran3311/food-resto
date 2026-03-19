import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import toast from "react-hot-toast";
import { PageHeader } from "../components/PageHeader";
import { menuService } from "../services/menuService";
import { MenuItem } from "../types";
import { formatMoney, getCurrencySymbol } from "../utils/currency";
import { resolveMediaUrl } from "../utils/media";

type CurrencyCode = MenuItem["currency"];

interface MenuFormState {
  itemName: string;
  description: string;
  price: string;
  costPrice: string;
  currency: CurrencyCode;
  category: string;
  isAvailable: boolean;
}

const CURRENCY_OPTIONS: Array<{ code: CurrencyCode; symbol: string; label: string }> = [
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "INR", symbol: "Rs", label: "Indian Rupee" },
  { code: "EUR", symbol: "EUR", label: "Euro" },
  { code: "GBP", symbol: "GBP", label: "British Pound" }
];

const emptyForm: MenuFormState = {
  itemName: "",
  description: "",
  price: "",
  costPrice: "",
  currency: "USD",
  category: "",
  isAvailable: true
};

export const MenuPage = (): JSX.Element => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [visibleCards, setVisibleCards] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState<MenuFormState>(emptyForm);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const cardRefs = useRef<Record<string, HTMLElement | null>>({});

  const isEditing = useMemo(() => Boolean(editingId), [editingId]);
  const selectedCurrencySymbol = useMemo(
    () => getCurrencySymbol(form.currency),
    [form.currency]
  );

  const loadMenu = (): Promise<void> =>
    menuService
      .list({ page: 1, limit: 100 })
      .then((response) => setItems(response.items))
      .finally(() => setLoading(false));

  useEffect(() => {
    loadMenu().catch(() => toast.error("Failed to load menu"));
  }, []);

  useEffect(() => {
    if (!isModalOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent | globalThis.KeyboardEvent): void => {
      if (event.key === "Escape") {
        closeModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen]);

  useEffect(() => {
    if (items.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        setVisibleCards((prev) => {
          const next = { ...prev };
          let changed = false;

          entries.forEach((entry) => {
            if (!entry.isIntersecting) {
              return;
            }

            const id = entry.target.getAttribute("data-id");
            if (id && !next[id]) {
              next[id] = true;
              changed = true;
            }

            observer.unobserve(entry.target);
          });

          return changed ? next : prev;
        });
      },
      { threshold: 0.2 }
    );

    items.forEach((item) => {
      const element = cardRefs.current[item._id];
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [items]);

  const resetForm = (): void => {
    setEditingId(null);
    setImageFile(null);
    setForm(emptyForm);
  };

  const closeModal = (): void => {
    setIsModalOpen(false);
    resetForm();
  };

  const openCreateModal = (): void => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (item: MenuItem): void => {
    setEditingId(item._id);
    setImageFile(null);
    setForm({
      itemName: item.itemName,
      description: item.description ?? "",
      price: String(item.price),
      costPrice: String(item.costPrice ?? 0),
      currency: item.currency ?? "USD",
      category: item.category ?? "",
      isAvailable: item.isAvailable
    });
    setIsModalOpen(true);
  };

  const buildPayload = (): FormData => {
    const payload = new FormData();
    payload.append("itemName", form.itemName);
    payload.append("description", form.description);
    payload.append("price", form.price);
    payload.append("costPrice", form.costPrice);
    payload.append("currency", form.currency);
    payload.append("category", form.category);
    payload.append("isAvailable", String(form.isAvailable));
    if (imageFile) {
      payload.append("image", imageFile);
    }
    return payload;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!form.itemName || !form.price) {
      toast.error("Item name and price are required");
      return;
    }

    setSaving(true);
    try {
      const payload = buildPayload();
      if (editingId) {
        await menuService.update(editingId, payload);
        toast.success("Menu item updated");
      } else {
        await menuService.create(payload);
        toast.success("Menu item created");
      }
      await loadMenu();
      closeModal();
    } catch (_error: unknown) {
      toast.error("Failed to save menu item");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    if (!window.confirm("Delete this menu item?")) {
      return;
    }
    try {
      await menuService.remove(id);
      setItems((prev) => prev.filter((item) => item._id !== id));
      toast.success("Menu item deleted");
    } catch (_error: unknown) {
      toast.error("Failed to delete menu item");
    }
  };

  if (loading) {
    return <div className="text-slate-600 dark:text-slate-300">Loading menu...</div>;
  }

  return (
    <div>
      <PageHeader
        title="Menu Management"
        subtitle="Browse all menu cards first, then add or edit items in a focused modal"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
              Total Items: {items.length}
            </div>
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-1 hover:bg-brand-600 hover:shadow-card"
            >
              <Plus size={16} />
              Add New Menu Item
            </button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item, index) => {
          const isVisible = Boolean(visibleCards[item._id]);

          return (
            <article
              key={item._id}
              data-id={item._id}
              ref={(element) => {
                cardRefs.current[item._id] = element;
              }}
              className={`group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-700 dark:border-slate-700 dark:bg-slate-900 ${
                isVisible
                  ? "translate-y-0 opacity-100 hover:-translate-y-2 hover:border-brand-300 hover:shadow-card"
                  : "translate-y-6 opacity-0"
              }`}
              style={{ transitionDelay: `${(index % 6) * 60}ms` }}
            >
              {item.image ? (
                <img
                  src={resolveMediaUrl(item.image)}
                  alt={item.itemName}
                  className="h-40 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-40 w-full items-center justify-center bg-slate-100 text-sm text-slate-500 transition-colors duration-300 group-hover:bg-orange-50 dark:bg-slate-800 dark:group-hover:bg-slate-800">
                  No image
                </div>
              )}

              <div className="space-y-2 p-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-semibold text-slate-900 transition-colors duration-300 group-hover:text-brand-600 dark:text-slate-100 dark:group-hover:text-orange-300">
                    {item.itemName}
                  </h3>
                  <span className="rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-700 transition-transform duration-300 group-hover:scale-105 dark:bg-orange-950/40 dark:text-orange-300">
                    {formatMoney(item.price, item.currency ?? "USD")}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>{item.category ?? "Uncategorized"}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800">
                    {item.currency}
                  </span>
                </div>

                <p className="min-h-10 text-sm text-slate-600 dark:text-slate-300">
                  {item.description || "No description provided."}
                </p>

                <div className="flex items-center justify-between pt-1">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      item.isAvailable
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                    }`}
                  >
                    {item.isAvailable ? "Available" : "Unavailable"}
                  </span>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="rounded-lg border border-slate-300 px-2 py-1 text-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-400 hover:bg-brand-50 dark:border-slate-600 dark:hover:border-brand-500/60 dark:hover:bg-slate-800"
                      onClick={() => openEditModal(item)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-rose-300 px-2 py-1 text-xs text-rose-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                      onClick={() => handleDelete(item._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {isModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-2xl rounded-3xl border border-white/30 bg-white/95 p-5 shadow-2xl transition-all duration-300 dark:border-slate-700 dark:bg-slate-900/95"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  {isEditing ? "Edit Menu Item" : "Add New Menu Item"}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Set the item details, choose the currency, and save when ready.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full border border-slate-300 p-2 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
                aria-label="Close menu form"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-2">
              <input
                className="rounded-xl border border-slate-300 px-3 py-2 transition-all duration-200 focus:-translate-y-0.5 focus:border-brand-500 focus:shadow-sm dark:border-slate-700 dark:bg-slate-800"
                placeholder="Item name"
                value={form.itemName}
                onChange={(event) => setForm((prev) => ({ ...prev, itemName: event.target.value }))}
              />
              <input
                className="rounded-xl border border-slate-300 px-3 py-2 transition-all duration-200 focus:-translate-y-0.5 focus:border-brand-500 focus:shadow-sm dark:border-slate-700 dark:bg-slate-800"
                placeholder="Category"
                value={form.category}
                onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
              />

              <div className="grid grid-cols-[110px_1fr] gap-2">
                <select
                  className="rounded-xl border border-slate-300 px-3 py-2 transition-all duration-200 focus:-translate-y-0.5 focus:border-brand-500 focus:shadow-sm dark:border-slate-700 dark:bg-slate-800"
                  value={form.currency}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      currency: event.target.value as CurrencyCode
                    }))
                  }
                >
                  {CURRENCY_OPTIONS.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.code}
                    </option>
                  ))}
                </select>
                <label className="relative block">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">
                    {selectedCurrencySymbol}
                  </span>
                  <input
                    className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 transition-all duration-200 focus:-translate-y-0.5 focus:border-brand-500 focus:shadow-sm dark:border-slate-700 dark:bg-slate-800"
                    placeholder="Price"
                    type="number"
                    step="0.01"
                    value={form.price}
                    onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
                  />
                </label>
              </div>

              <label className="relative block">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">
                  {selectedCurrencySymbol}
                </span>
                <input
                  className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 transition-all duration-200 focus:-translate-y-0.5 focus:border-brand-500 focus:shadow-sm dark:border-slate-700 dark:bg-slate-800"
                  placeholder="Cost price"
                  type="number"
                  step="0.01"
                  value={form.costPrice}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, costPrice: event.target.value }))
                  }
                />
              </label>

              <textarea
                className="rounded-xl border border-slate-300 px-3 py-2 transition-all duration-200 focus:-translate-y-0.5 focus:border-brand-500 focus:shadow-sm dark:border-slate-700 dark:bg-slate-800 md:col-span-2"
                placeholder="Description"
                rows={3}
                value={form.description}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, description: event.target.value }))
                }
              />

              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={form.isAvailable}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, isAvailable: event.target.checked }))
                  }
                />
                Available
              </label>

              <div className="grid gap-1 text-sm text-slate-700 dark:text-slate-200">
                <span>Image Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setImageFile(event.target.files?.[0] ?? null)
                  }
                />
              </div>

              <div className="flex gap-2 md:col-span-2">
                <button
                  disabled={saving}
                  className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-600 hover:shadow-card disabled:opacity-70"
                  type="submit"
                >
                  {saving ? "Saving..." : isEditing ? "Update Item" : "Add Item"}
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 dark:border-slate-600 dark:hover:border-slate-500 dark:hover:bg-slate-800"
                  onClick={closeModal}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
};
