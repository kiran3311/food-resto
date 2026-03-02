import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Line,
  LineChart,
  Legend
} from "recharts";
import { PageHeader } from "../components/PageHeader";
import { StatCard } from "../components/StatCard";
import { dashboardService } from "../services/dashboardService";
import { stallService } from "../services/stallService";
import { DashboardSummary } from "../types";
import { Stall } from "../types";
import { resolveMediaUrl } from "../utils/media";

const currency = (value: number): string => `$${value.toFixed(2)}`;

export const DashboardPage = (): JSX.Element => {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [stall, setStall] = useState<Stall | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([dashboardService.getSummary(), stallService.getMyStall()])
      .then((results) => {
        const summaryResult = results[0];
        const stallResult = results[1];

        if (summaryResult.status === "fulfilled") {
          setData(summaryResult.value);
        }

        if (stallResult.status === "fulfilled") {
          setStall(stallResult.value);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-slate-600 dark:text-slate-300">Loading dashboard...</div>;
  }

  if (!data) {
    return <div className="text-slate-600 dark:text-slate-300">No dashboard data found.</div>;
  }

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Track orders, revenue, and item performance in real time"
        actions={
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
            {stall?.logo ? (
              <img
                src={resolveMediaUrl(stall.logo)}
                alt={stall.stallName}
                className="h-12 w-12 rounded-lg border border-slate-200 object-cover dark:border-slate-700"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-500 dark:bg-slate-800">
                Logo
              </div>
            )}
            <div className="text-right">
              <p className="text-xs text-slate-500 dark:text-slate-400">Active Stall</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{stall?.stallName ?? "Not configured"}</p>
            </div>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Orders Today" value={String(data.today.totalOrdersToday)} />
        <StatCard label="Cancelled Today" value={String(data.today.cancelledOrdersToday)} />
        <StatCard label="Revenue Today" value={currency(data.today.totalRevenueToday)} />
        <StatCard label="Profit Today" value={currency(data.today.totalProfitToday)} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Monthly Revenue / Profit / Cancelled</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="money" />
                <YAxis yAxisId="orders" orientation="right" allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line yAxisId="money" type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} />
                <Line yAxisId="money" type="monotone" dataKey="profit" stroke="#0ea5e9" strokeWidth={2} />
                <Line yAxisId="orders" type="monotone" dataKey="cancelledOrders" stroke="#ef4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Top Selling Items</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.topSellingItems}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="quantitySold" fill="#f97316" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Combo Sales Analytics</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="pb-2">Combo</th>
                <th className="pb-2">Units</th>
                <th className="pb-2">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.comboSales.map((row) => (
                <tr key={row._id} className="border-t border-slate-200 dark:border-slate-700">
                  <td className="py-2">{row._id}</td>
                  <td className="py-2">{row.count}</td>
                  <td className="py-2">{currency(row.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
