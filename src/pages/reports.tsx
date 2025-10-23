import SidebarLayout from "@/components/Layout";
import { trpc } from "@/utils/trpc";
import { useState } from "react";

export default function ReportsPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const { data } = trpc.reports.stats.useQuery(
    from || to ? { from: from || undefined, to: to || undefined } : undefined
  );

  return (
    <SidebarLayout>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Reports</h1>
      </div>

      <div className="grid gap-2 md:grid-cols-5 border rounded-lg p-3 mb-6 bg-background">
        <input 
          type="datetime-local" 
          className="border rounded px-2 py-1 bg-gray-100/10" 
          value={from} 
          onChange={(e) => setFrom(e.target.value)} 
        />
        <input 
          type="datetime-local" 
          className="border rounded px-2 py-1 bg-gray-100/10" 
          value={to} 
          onChange={(e) => setTo(e.target.value)} 
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Stat title="Revenue" value={formatKES(data?.totalRevenue ?? 0)} index={0} />
        <Stat title="Sales" value={(data?.totalSales ?? 0).toString()} index={1} />
      </div>

      <div className="mt-6 border rounded-lg overflow-x-auto bg-background">
        <div className="p-3 font-medium">Top Products</div>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-t">
              <th className="text-left p-3">ProductId</th>
              <th className="text-left p-3">Quantity</th>
              <th className="text-left p-3">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {(data?.topProducts ?? []).map((p) => (
              <tr key={p.productId} className="border-t">
                <td className="p-3">{p.productId}</td>
                <td className="p-3">{p._sum.quantity ?? 0}</td>
                <td className="p-3">{formatKES(p._sum.totalPrice ?? 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
  return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES" }).format(amount);
}