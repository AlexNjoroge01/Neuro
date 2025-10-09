import SidebarLayout from "@/components/Layout";
import { trpc } from "@/utils/trpc";
import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function DashboardPage() {
  const { data: overview } = trpc.dashboard.overview.useQuery();
  const { data: recentSales } = trpc.dashboard.recentSales.useQuery();

  const lineData = useMemo(() => {
    // Fake 7-day trend from recent sales timestamps
    const buckets: Record<string, number> = {};
    (recentSales ?? []).forEach((s) => {
      const d = new Date(s.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      buckets[key] = (buckets[key] ?? 0) + s.totalPrice;
    });
    return Object.entries(buckets)
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([date, revenue]) => ({ date, revenue }));
  }, [recentSales]);

  const pieData = useMemo(() => {
    // Distribution by product
    const byProduct: Record<string, number> = {};
    (recentSales ?? []).forEach((s) => {
      const key = s.product?.name ?? "Unknown";
      byProduct[key] = (byProduct[key] ?? 0) + s.totalPrice;
    });
    return Object.entries(byProduct).map(([name, value]) => ({ name, value }));
  }, [recentSales]);

  const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4"]; 

  return (
    <SidebarLayout>
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Total Income" value={formatCurrency(overview?.totalIncome ?? 0)} />
        <StatCard title="Total Sales" value={(overview?.totalSales ?? 0).toString()} />
        <StatCard title="Total Users" value={(overview?.totalUsers ?? 0).toString()} />
        <StatCard title="Transactions" value={(overview?.totalTransactions ?? 0).toString()} />
      </div>

      <div className="grid gap-6 md:grid-cols-2 mt-6">
        <div className="border rounded-lg p-4">
          <div className="mb-2 font-medium">Revenue Trend</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="mb-2 font-medium">Sales Distribution</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={100}>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-6 border rounded-lg">
        <div className="p-4 font-medium">Top Recent Sales</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-t">
                <th className="text-left p-3">Date</th>
                <th className="text-left p-3">Product</th>
                <th className="text-left p-3">Customer</th>
                <th className="text-left p-3">Qty</th>
                <th className="text-left p-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {(recentSales ?? []).map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="p-3">{new Date(s.createdAt).toLocaleString()}</td>
                  <td className="p-3">{s.product?.name}</td>
                  <td className="p-3">{s.customer?.name ?? "-"}</td>
                  <td className="p-3">{s.quantity}</td>
                  <td className="p-3">{formatCurrency(s.totalPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </SidebarLayout>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="border rounded-lg p-4">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(amount);
}


