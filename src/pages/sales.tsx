import SidebarLayout from "@/components/Layout";
import ClientOnly from "@/components/ClientOnly";
import { trpc } from "@/utils/trpc";
import { useState, FormEvent, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function SalesPage() {
  const utils = trpc.useUtils();
  const { data: products } = trpc.products.list.useQuery();
  const { data: recent } = trpc.sales.list.useQuery();
  const createSale = trpc.sales.create.useMutation({ 
    onSuccess: () => { 
      utils.sales.list.invalidate(); 
      utils.dashboard.overview.invalidate(); 
    } 
  });

  const [form, setForm] = useState({ productId: "", quantity: "", paymentMethod: "CASH" as "CASH" | "MPESA" });
  const selected = useMemo(() => products?.find(p => p.id === form.productId), [products, form.productId]);
  const total = useMemo(() => selected && form.quantity ? selected.price * Number(form.quantity) : 0, [selected, form.quantity]);

  const barData = useMemo(() => {
    const buckets: Record<string, number> = {};
    (recent ?? []).forEach((s) => {
      const d = new Date(s.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      buckets[key] = (buckets[key] ?? 0) + s.totalPrice;
    });
    return Object.entries(buckets)
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([date, revenue]) => ({ date, revenue }));
  }, [recent]);

  const salesStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());

    const stats = {
      todaySales: 0,
      weekSales: 0,
      cashSales: 0,
      mpesaSales: 0,
    };

    (recent ?? []).forEach((s) => {
      const saleDate = new Date(s.createdAt);
      if (saleDate >= today) {
        stats.todaySales += s.totalPrice;
      }
      if (saleDate >= weekStart) {
        stats.weekSales += s.totalPrice;
      }
      if (s.paymentMethod === "CASH") {
        stats.cashSales += s.totalPrice;
      } else if (s.paymentMethod === "MPESA") {
        stats.mpesaSales += s.totalPrice;
      }
    });

    return stats;
  }, [recent]);

  function submit(e: FormEvent) {
    e.preventDefault();
    const qty = parseInt(form.quantity, 10);
    if (!form.productId || !qty || qty <= 0) return;
    createSale.mutate({ productId: form.productId, quantity: qty, paymentMethod: form.paymentMethod });
    setForm({ productId: "", quantity: "", paymentMethod: "CASH" });
  }

  // same palette as dashboard donut chart
  const SYSTEM_COLORS = [
    "#0F172A", // deep navy (secondary)
    "#D6FF00", // primary highlight
    "#94A300", // muted olive
    "#4C5250", // soft gray
    "#BFD600", // lighter lime accent
  ];

  return (
    <SidebarLayout>
      <ClientOnly>
      <div className="grid gap-6 md:grid-cols-2">
        <form onSubmit={submit} className="border rounded-lg p-3 grid gap-2 bg-background">
          <div className="font-medium">New Sale</div>
          <select 
            className="border rounded px-2 py-1 bg-gray-100/10" 
            value={form.productId} 
            onChange={(e) => setForm({ ...form, productId: e.target.value })}
          >
            <option value="">Select product</option>
            {(products ?? []).map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.unit}{p.size ? ` - ${p.size}` : ""}) - {formatKES(p.price)} - Stock: {p.stock}</option>
            ))}
          </select>
          <input 
            className="border rounded px-2 py-1 bg-gray-100/10" 
            placeholder="Quantity" 
            value={form.quantity} 
            onChange={(e) => setForm({ ...form, quantity: e.target.value })} 
          />
          <select 
            className="border rounded px-2 py-1 bg-gray-100/10" 
            value={form.paymentMethod} 
            onChange={(e) => setForm({ ...form, paymentMethod: e.target.value as any })}
          >
            <option value="CASH">Cash</option>
            <option value="MPESA">Mpesa</option>
          </select>
          <div className="text-sm">Total: {formatKES(total)}</div>
          <button className="bg-primary text-primary-foreground rounded px-2 py-1">Record Sale</button>
        </form>

        <div className="border rounded-lg p-3 bg-background">
          <div className="font-medium mb-2">Recent Sales</div>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
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
                {(recent ?? []).map((s) => (
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

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="border rounded-lg p-4 bg-background">
          <div className="mb-2 font-medium">Daily Sales Trend</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill={SYSTEM_COLORS[1]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Stat title="Today's Sales" value={formatKES(salesStats.todaySales)} index={0} />
          <Stat title="This Week's Sales" value={formatKES(salesStats.weekSales)} index={1} />
          <Stat title="Cash Sales" value={formatKES(salesStats.cashSales)} index={2} />
          <Stat title="Mpesa Sales" value={formatKES(salesStats.mpesaSales)} index={3} />
        </div>
      </div>
      </ClientOnly>
    </SidebarLayout>
  );
}

function Stat({ title, value, index }: { title: string; value: string; index: number }) {
  const bgColor = index % 2 === 0 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground';
  return (
    <div className={`border rounded-lg p-4 ${bgColor}`}>
      <div className="text-sm">{title}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}

function formatKES(amount: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "KES" }).format(amount);
}
