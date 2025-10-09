import SidebarLayout from "@/components/Layout";
import { trpc } from "@/utils/trpc";
import { FormEvent, useMemo, useState } from "react";

export default function InventoryPage() {
  const utils = trpc.useUtils();
  const { data: products } = trpc.products.list.useQuery();
  const { data: logs } = trpc.inventory.logs.useQuery();
  const adjust = trpc.inventory.adjust.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
      utils.inventory.logs.invalidate();
    },
  });

  const [productId, setProductId] = useState("");
  const [change, setChange] = useState("");
  const [reason, setReason] = useState("Manual Adjustment");

  function submit(e: FormEvent) {
    e.preventDefault();
    const delta = parseInt(change, 10);
    if (!productId || isNaN(delta) || !reason) return;
    adjust.mutate({ productId, change: delta, reason });
    setChange("");
  }

  const productMap = useMemo(() => Object.fromEntries((products ?? []).map((p) => [p.id, p.name])), [products]);

  return (
    <SidebarLayout>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Inventory</h1>
      </div>

      <form onSubmit={submit} className="grid gap-2 md:grid-cols-5 border rounded-lg p-3 mb-6">
        <select className="border rounded px-2 py-1" value={productId} onChange={(e) => setProductId(e.target.value)}>
          <option value="">Select Product</option>
          {(products ?? []).map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <input className="border rounded px-2 py-1" placeholder="Change (+/-)" value={change} onChange={(e) => setChange(e.target.value)} />
        <input className="border rounded px-2 py-1" placeholder="Reason" value={reason} onChange={(e) => setReason(e.target.value)} />
        <div />
        <button className="bg-black text-white rounded px-3 py-1">Apply</button>
      </form>

      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-t">
              <th className="text-left p-3">Date</th>
              <th className="text-left p-3">Product</th>
              <th className="text-left p-3">Change</th>
              <th className="text-left p-3">Reason</th>
            </tr>
          </thead>
          <tbody>
            {(logs ?? []).map((l) => (
              <tr key={l.id} className="border-t">
                <td className="p-3">{new Date(l.createdAt).toLocaleString()}</td>
                <td className="p-3">{productMap[l.productId] ?? l.productId}</td>
                <td className="p-3">{l.change}</td>
                <td className="p-3">{l.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SidebarLayout>
  );
}


