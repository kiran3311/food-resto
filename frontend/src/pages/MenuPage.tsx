import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { PageHeader } from "../components/PageHeader";
import { menuService } from "../services/menuService";
import { MenuItem } from "../types";
import { resolveMediaUrl } from "../utils/media";

interface MenuFormState {
  itemName: string;
  description: string;
  price: string;
  costPrice: string;
  category: string;
  isAvailable: boolean;
}

const emptyForm: MenuFormState = {
  itemName: "",
  description: "",
  price: "",
  costPrice: "",
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

  const cardRefs = useRef<Record<string, HTMLElement | null>>({});

  const isEditing = useMemo(() => Boolean(editingId), [editingId]);

  const loadMenu = (): Promise<void> =>
    menuService
      .list({ page: 1, limit: 100 })
      .then((response) => setItems(response.items))
      .finally(() => setLoading(false));

  useEffect(() => {
    loadMenu().catch(() => toast.error("Failed to load menu"));
  }, []);

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

  const fillFromItem = (item: MenuItem): void => {
    setEditingId(item._id);
    setForm({
      itemName: item.itemName,
      description: item.description ?? "",
      price: String(item.price),
      costPrice: String(item.costPrice ?? 0),
      category: item.category ?? "",
      isAvailable: item.isAvailable
    });
  };

  const buildPayload = (): FormData => {
    const payload = new FormData();
    payload.append("itemName", form.itemName);
    payload.append("description", form.description);
    payload.append("price", form.price);
    payload.append("costPrice", form.costPrice);
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
      resetForm();
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
        subtitle="Add, edit, and control item availability"
        actions={
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
            Total Items: {items.length}
          </div>
        }
      />

      <form
        onSubmit={handleSubmit}
        className="mb-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 md:grid-cols-2"
      >
        <input
          className="rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
          placeholder="Item name"
          value={form.itemName}
          onChange={(event) => setForm((prev) => ({ ...prev, itemName: event.target.value }))}
        />
        <input
          className="rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
          placeholder="Category"
          value={form.category}
          onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
        />
        <input
          className="rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
          placeholder="Price"
          type="number"
          step="0.01"
          value={form.price}
          onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
        />
        <input
          className="rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
          placeholder="Cost price"
          type="number"
          step="0.01"
          value={form.costPrice}
          onChange={(event) => setForm((prev) => ({ ...prev, costPrice: event.target.value }))}
        />
        <textarea
          className="rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800 md:col-span-2"
          placeholder="Description"
          rows={2}
          value={form.description}
          onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
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

        <input
          type="file"
          accept="image/*"
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setImageFile(event.target.files?.[0] ?? null)
          }
        />

        <div className="flex gap-2 md:col-span-2">
          <button
            disabled={saving}
            className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
            type="submit"
          >
            {saving ? "Saving..." : isEditing ? "Update Item" : "Add Item"}
          </button>
          {isEditing ? (
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
              className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-700 dark:border-slate-700 dark:bg-slate-900 ${
                isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
              }`}
              style={{ transitionDelay: `${(index % 6) * 60}ms` }}
            >
              {item.image ? (
                <img
                  src={resolveMediaUrl(item.image)}
                  alt={item.itemName}
                  className="h-40 w-full object-cover"
                />
              ) : (
                <div className="flex h-40 w-full items-center justify-center bg-slate-100 text-sm text-slate-500 dark:bg-slate-800">
                  No image
                </div>
              )}

              <div className="space-y-2 p-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{item.itemName}</h3>
                  <span className="rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-700 dark:bg-orange-950/40 dark:text-orange-300">
                    ${item.price.toFixed(2)}
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400">{item.category ?? "Uncategorized"}</p>
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
                      className="rounded-lg border border-slate-300 px-2 py-1 text-xs dark:border-slate-600"
                      onClick={() => fillFromItem(item)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-rose-300 px-2 py-1 text-xs text-rose-700"
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
    </div>
  );
};
