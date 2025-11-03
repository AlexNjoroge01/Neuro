// DashboardPage.tsx
import SidebarLayout from "@/components/Layout";
import { useEffect, useState } from "react";
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
      <div className="overflow-y-auto h-screen">
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard title="Total Income" value={formatKES(overview?.totalIncome ?? 0)} index={0} />
          <StatCard title="Total Expenses" value={formatKES(overview?.totalExpenses ?? 0)} index={1} />
          <StatCard title="Net Profit" value={formatKES(overview?.netProfit ?? 0)} index={2} />
          <StatCard title="Stock Count" value={(overview?.stockCount ?? 0).toString()} index={3} />
        </div>

        <div className="grid gap-6 md:grid-cols-2 mt-6">
          <div className="border rounded-lg p-4 bg-white">
            <div className="mb-2 font-medium">Daily Sales</div>
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
          <div className="border rounded-lg p-4 bg-white">
            <div className="mb-2 font-medium">Income by Product</div>
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

        <div className="mt-6 border rounded-lg bg-white">
          <div className="p-4 font-medium">Top Recent Sales</div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-t">
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Product</th>
                  <th className="text-left p-3">Qty</th>
                  <th className="text-left p-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {(recentSales ?? []).map((s) => (
                  <tr key={s.id} className="border-t">
                    <td className="p-3">{new Date(s.createdAt).toLocaleString()}</td>
                    <td className="p-3">{s.product?.name}</td>
                    <td className="p-3">{s.quantity}</td>
                    <td className="p-3">{formatKES(s.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}

function StatCard({ title, value, index }: { title: string; value: string; index: number }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const bgColor =
    index % 2 === 0
      ? "bg-primary text-primary-foreground"
      : "bg-secondary text-secondary-foreground";

  return (
    <div className={`border rounded-lg px-8 py-10 ${bgColor}`}>
      <div className="text-xl">{title}</div>
      <div className="text-2xl font-semibold">
        {mounted ? value : "KES 0.00"}
      </div>
    </div>
  );
}

function formatKES(amount: number) {
  return new Intl.NumberFormat("en-KE", { 
    style: "currency", 
    currency: "KES", 
    minimumFractionDigits: 2 
  }).format(amount);
}