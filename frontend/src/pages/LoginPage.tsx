import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { z } from "zod";
import { useAuth } from "../context/AuthContext";
import { AuthShell } from "../components/AuthShell";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const LoginPage = (): JSX.Element => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const parsed = loginSchema.safeParse(form);
    if (!parsed.success) {
      toast.error("Enter valid email and password");
      return;
    }

    setLoading(true);
    try {
      await login(form);
      toast.success("Welcome back");
      navigate("/");
    } catch (_error: unknown) {
      toast.error("Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Sign in"
      subtitle="Manage orders, menu, and sales from one place"
      footerText="New here?"
      footerLinkLabel="Create account"
      footerLinkTo="/register"
    >
      <form className="space-y-3" onSubmit={onSubmit}>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          Email
          <input
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800"
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            required
          />
        </label>

        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          Password
          <input
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800"
            type="password"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            required
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-brand-500 px-4 py-2 font-semibold text-white hover:bg-brand-600 disabled:opacity-70"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
        Demo login after seeding: <span className="font-semibold">owner@example.com / Password@123</span>
      </div>
      <Link to="/register" className="sr-only">register</Link>
    </AuthShell>
  );
};