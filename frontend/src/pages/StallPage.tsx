import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { PageHeader } from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";
import { stallService } from "../services/stallService";
import { Stall } from "../types";
import { resolveMediaUrl } from "../utils/media";

export const StallPage = (): JSX.Element => {
  const { user } = useAuth();
  const [stall, setStall] = useState<Stall | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    stallName: "",
    description: "",
    contact: "",
    address: "",
    businessHours: ""
  });

  useEffect(() => {
    stallService
      .getMyStall()
      .then((response) => {
        setStall(response);
        setForm({
          stallName: response.stallName ?? "",
          description: response.description ?? "",
          contact: response.contact ?? "",
          address: response.address ?? "",
          businessHours: response.businessHours ?? ""
        });
      })
      .catch(() => {
        setStall(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!form.stallName.trim()) {
      toast.error("Stall name is required");
      return;
    }

    const payload = new FormData();
    payload.append("stallName", form.stallName);
    payload.append("description", form.description);
    payload.append("contact", form.contact);
    payload.append("address", form.address);
    payload.append("businessHours", form.businessHours);
    if (logoFile) {
      payload.append("logo", logoFile);
    }

    setSubmitting(true);
    try {
      const updated = await stallService.upsert(payload);
      setStall(updated);
      setLogoFile(null);
      toast.success("Stall profile saved");
    } catch (_error: unknown) {
      toast.error("Failed to save profile");
    } finally {
      setSubmitting(false);
    }
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0] ?? null;
    setLogoFile(file);
  };

  if (loading) {
    return <div className="text-slate-600 dark:text-slate-300">Loading stall profile...</div>;
  }

  return (
    <div>
      <PageHeader
        title="Stall Profile"
        subtitle="Manage your restaurant details shown in receipts and order workflow"
      />

      <div className="mb-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
        Owner: <span className="font-semibold">{user?.name ?? "N/A"}</span>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
          Stall Name
          <input
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
            value={form.stallName}
            onChange={(event) => setForm((prev) => ({ ...prev, stallName: event.target.value }))}
            required
          />
        </label>

        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
          Description
          <textarea
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
            rows={3}
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Contact
            <input
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              value={form.contact}
              onChange={(event) => setForm((prev) => ({ ...prev, contact: event.target.value }))}
            />
          </label>

          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Business Hours
            <input
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              value={form.businessHours}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, businessHours: event.target.value }))
              }
            />
          </label>
        </div>

        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
          Address
          <input
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
            value={form.address}
            onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
          />
        </label>

        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
          Logo Image
          <input className="mt-1 block w-full text-sm" type="file" accept="image/*" onChange={onFileChange} />
        </label>

        {stall?.logo ? (
          <img
            src={resolveMediaUrl(stall.logo)}
            alt="Stall logo"
            className="h-20 w-20 rounded-xl border border-slate-200 object-cover dark:border-slate-700"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : null}

        <div>
          <button
            disabled={submitting}
            type="submit"
            className="rounded-xl bg-brand-500 px-4 py-2 font-semibold text-white hover:bg-brand-600 disabled:opacity-70"
          >
            {submitting ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </form>
    </div>
  );
};
