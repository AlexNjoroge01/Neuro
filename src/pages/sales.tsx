import SidebarLayout from "@/components/Layout";
import { trpc } from "@/utils/trpc";
import { useState, FormEvent, useMemo } from "react";

export default function SalesPage() {
  const utils = trpc.useUtils();
  const { data: products } = trpc.products.list.useQuery();
  const { data: recent } = trpc.sales.list.useQuery();
  const createSale = trpc.sales.create.useMutation({ onSuccess: () => { utils.sales.list.invalidate(); utils.dashboard.overview.invalidate(); } });

  const [form, setForm] = useState({ productId: "", quantity: "", paymentMethod: "CASH" as "CASH" | "MPESA" });
  const selected = useMemo(() => products?.find(p => p.id === form.productId), [products, form.productId]);
  const total = useMemo(() => selected && form.quantity ? selected.price * Number(form.quantity) : 0, [selected, form.quantity]);

  function submit(e: FormEvent) {
    e.preventDefault();
    const qty = parseInt(form.quantity, 10);
    if (!form.productId || !qty || qty <= 0) return;
    createSale.mutate({ productId: form.productId, quantity: qty, paymentMethod: form.paymentMethod });
    setForm({ productId: "", quantity: "", paymentMethod: "CASH" });
  }

  return (
    <SidebarLayout>
      <div className="grid gap-6 md:grid-cols-2">
        <form onSubmit={submit} className="border rounded-lg p-3 grid gap-2">
          <div className="font-medium">New Sale</div>
          <select className="border rounded px-2 py-1" value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })}>
            <option value="">Select product</option>
            {(products ?? []).map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.unit}{p.size ? ` - ${p.size}` : ""}) - {formatKES(p.price)} - Stock: {p.stock}</option>
            ))}
          </select>
          <input className="border rounded px-2 py-1" placeholder="Quantity" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
          <select className="border rounded px-2 py-1" value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value as any })}>
            <option value="CASH">Cash</option>
            <option value="MPESA">Mpesa</option>
          </select>
          <div className="text-sm">Total: {formatKES(total)}</div>
          <button className="bg-black text-white rounded px-3 py-1">Record Sale</button>
        </form>

        <div className="border rounded-lg p-3">
          <div className="font-medium mb-2">Recent Sales</div>
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
    </SidebarLayout>
  );
}

function formatKES(amount: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "KES" }).format(amount);
}


