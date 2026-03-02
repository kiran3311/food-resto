import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Store,
  Soup,
  PackageOpen,
  Receipt,
  Moon,
  Sun,
  LogOut
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useDarkMode } from "../hooks/useDarkMode";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/stall", label: "Stall Profile", icon: Store },
  { to: "/menu", label: "Menu", icon: Soup },
  { to: "/combos", label: "Combos", icon: PackageOpen },
  { to: "/orders", label: "Orders", icon: Receipt }
];

export const AdminLayout = (): JSX.Element => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { isDark, toggleDarkMode } = useDarkMode();

  const handleLogout = async (): Promise<void> => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-sky-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="flex w-full flex-col gap-4 p-4 lg:flex-row">
        <aside className="w-full rounded-3xl border border-slate-200/70 bg-white/80 p-4 shadow-card backdrop-blur dark:border-slate-800 dark:bg-slate-900/70 lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:w-72">
          <Link to="/" className="block rounded-2xl bg-brand-500 px-4 py-3 text-lg font-semibold text-white">
            FoodOps Admin
          </Link>

          <nav className="mt-5 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                      isActive
                        ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                        : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                    }`
                  }
                >
                  <Icon size={18} />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="mt-auto flex items-center gap-2 pt-6">
            <button
              type="button"
              onClick={toggleDarkMode}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs dark:border-slate-700"
            >
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
              Theme
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-lg border border-rose-300 px-3 py-2 text-xs text-rose-700"
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </aside>

        <main className="w-full rounded-3xl border border-slate-200/70 bg-white/75 p-4 shadow-card backdrop-blur dark:border-slate-800 dark:bg-slate-900/60 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
