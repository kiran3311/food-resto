import { useMemo, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Receipt,
  History,
  Soup,
  PackageOpen,
  Settings,
  Store,
  Moon,
  Sun,
  LogOut
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useDarkMode } from "../hooks/useDarkMode";

const mainNavItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/orders", label: "Order", icon: Receipt },
  { to: "/recent-orders", label: "Recent Order", icon: History },
  { to: "/menu", label: "Menu", icon: Soup },
  { to: "/combos", label: "Combo", icon: PackageOpen }
];

const settingNavItems = [{ to: "/settings/shop-profile", label: "Shop Profile", icon: Store }];

export const AdminLayout = (): JSX.Element => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const { isDark, toggleDarkMode } = useDarkMode();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(true);

  const handleLogout = async (): Promise<void> => {
    await logout();
    navigate("/login");
  };

  const isSettingsActive = useMemo(
    () => settingNavItems.some((item) => location.pathname.startsWith(item.to)),
    [location.pathname]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-sky-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="flex w-full flex-col gap-4 p-4 lg:flex-row">
        <aside
          className={`flex flex-col rounded-3xl border border-slate-200/70 bg-white/80 p-4 shadow-card backdrop-blur transition-all duration-300 dark:border-slate-800 dark:bg-slate-900/70 lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] ${
            isSidebarCollapsed ? "lg:w-24" : "lg:w-72"
          }`}
        >
          <div className={`flex ${isSidebarCollapsed ? "justify-center" : "items-center"} gap-2`}>
            <Link
              to="/"
              title="FoodOps Admin"
              className={`rounded-2xl bg-brand-500 text-lg font-semibold text-white transition-all duration-300 hover:-translate-y-1 hover:bg-brand-600 hover:shadow-card ${
                isSidebarCollapsed ? "px-4 py-3" : "block flex-1 px-4 py-3"
              }`}
            >
              {isSidebarCollapsed ? "FO" : "FoodOps Admin"}
            </Link>
          </div>

          <nav className="mt-5 space-y-2">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  title={isSidebarCollapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `group relative flex items-center rounded-xl text-sm font-medium transition-all duration-300 ${
                      isSidebarCollapsed ? "justify-center px-3 py-3" : "gap-3 px-3 py-2"
                    } ${
                      isActive
                        ? "translate-x-1 bg-slate-900 text-white shadow-card dark:bg-slate-100 dark:text-slate-900"
                        : "text-slate-700 hover:translate-x-1 hover:bg-slate-100 hover:shadow-sm dark:text-slate-200 dark:hover:bg-slate-800"
                    }`
                  }
                >
                  <span className="absolute inset-y-2 left-1 w-1 rounded-full bg-gradient-to-b from-orange-400 to-sky-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <Icon
                    size={18}
                    className="shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-6deg]"
                  />
                  {isSidebarCollapsed ? null : item.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
            <button
              type="button"
              title={isSidebarCollapsed ? "Setting" : undefined}
              onClick={() => setIsSettingsOpen((prev) => !prev)}
              className={`group relative flex w-full items-center rounded-xl text-sm font-medium transition-all duration-300 ${
                isSidebarCollapsed ? "justify-center px-3 py-3" : "gap-3 px-3 py-2"
              } ${
                isSettingsActive
                  ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                  : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              }`}
            >
              <Settings
                size={18}
                className="shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-6deg]"
              />
              {isSidebarCollapsed ? null : (
                <>
                  <span className="flex-1 text-left">Setting</span>
                  {isSettingsOpen ? <ChevronLeft size={16} className="-rotate-90" /> : <ChevronRight size={16} />}
                </>
              )}
            </button>

            {isSettingsOpen ? (
              <div className={`mt-2 space-y-2 ${isSidebarCollapsed ? "" : "pl-3"}`}>
                {settingNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      title={isSidebarCollapsed ? item.label : undefined}
                      className={({ isActive }) =>
                        `group relative flex items-center rounded-xl text-sm font-medium transition-all duration-300 ${
                          isSidebarCollapsed ? "justify-center px-3 py-3" : "gap-3 px-3 py-2"
                        } ${
                          isActive
                            ? "translate-x-1 bg-slate-900 text-white shadow-card dark:bg-slate-100 dark:text-slate-900"
                            : "text-slate-700 hover:translate-x-1 hover:bg-slate-100 hover:shadow-sm dark:text-slate-200 dark:hover:bg-slate-800"
                        }`
                      }
                    >
                      <Icon
                        size={18}
                        className="shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-6deg]"
                      />
                      {isSidebarCollapsed ? null : item.label}
                    </NavLink>
                  );
                })}
              </div>
            ) : null}
          </div>

          <div className="mt-auto border-t border-slate-200 pt-4 dark:border-slate-800">
            <div className={`${isSidebarCollapsed ? "flex justify-center" : "flex justify-end"} mb-3`}>
              <button
                type="button"
                title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                onClick={() => setIsSidebarCollapsed((prev) => !prev)}
                className="hidden rounded-xl border border-slate-300 p-2 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 lg:inline-flex"
              >
                {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
              </button>
            </div>

            <div className={`flex gap-2 ${isSidebarCollapsed ? "flex-col items-center" : "items-center"}`}>
            <button
              type="button"
              title="Theme"
              onClick={toggleDarkMode}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
              {isSidebarCollapsed ? null : "Theme"}
            </button>
            <button
              type="button"
              title="Logout"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-lg border border-rose-300 px-3 py-2 text-xs text-rose-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-rose-50 dark:hover:bg-rose-950/20"
            >
              <LogOut size={14} />
              {isSidebarCollapsed ? null : "Logout"}
            </button>
            </div>
          </div>
        </aside>

        <main className="w-full rounded-3xl border border-slate-200/70 bg-white/75 p-4 shadow-card backdrop-blur dark:border-slate-800 dark:bg-slate-900/60 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
