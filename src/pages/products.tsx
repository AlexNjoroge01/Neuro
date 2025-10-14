import SidebarLayout from "@/components/Layout";
import { trpc } from "@/utils/trpc";
import { FormEvent, useState } from "react";

export default function ProductsPage() {
  const utils = trpc.useUtils();
  const { data: products } = trpc.products.list.useQuery();
  const createProduct = trpc.products.create.useMutation({
    onSuccess: () => utils.products.list.invalidate(),
  });
  const updateProduct = trpc.products.update.useMutation({
    onSuccess: () => utils.products.list.invalidate(),
  });
  const deleteProduct = trpc.products.delete.useMutation({
    onSuccess: () => utils.products.list.invalidate(),
  });
  const restoreProduct = trpc.products.restore.useMutation({
    onSuccess: () => utils.products.list.invalidate(),
  });

  const [form, setForm] = useState({ name: "", unit: "TRAY", size: "", price: "", costPrice: "", stock: "" });

  function submit(e: FormEvent) {
    e.preventDefault();
    const price = parseFloat(form.price);
    const costPrice = form.costPrice ? parseFloat(form.costPrice) : 0;
    const stock = parseInt(form.stock, 10);
    if (!form.name || isNaN(price) || isNaN(stock) || !form.unit) return;
    createProduct.mutate({ name: form.name, unit: form.unit as any, size: form.size || undefined, price, costPrice, stock });
    setForm({ name: "", unit: "TRAY", size: "", price: "", costPrice: "", stock: "" });
  }

  return (
    <SidebarLayout>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Products</h1>
      </div>

      {/* Trigger modal instead of inline form (basic inline placeholder for now) */}
      <form onSubmit={submit} className="hidden grid gap-2 md:grid-cols-6 border rounded-lg p-3 mb-6">
        <input className="border rounded px-2 py-1" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <select className="border rounded px-2 py-1" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
          <option value="TRAY">Tray</option>
          <option value="DOZEN">Dozen</option>
          <option value="PIECE">Piece</option>
        </select>
        <input className="border rounded px-2 py-1" placeholder="Size (optional)" value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} />
        <input className="border rounded px-2 py-1" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        <input className="border rounded px-2 py-1" placeholder="Cost Price" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} />
        <div className="flex gap-2">
          <input className="border rounded px-2 py-1 flex-1" placeholder="Stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
          <button className="bg-black text-white rounded px-3 py-1">Add</button>
        </div>
      </form>

      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-t">
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Unit</th>
              <th className="text-left p-3">Size</th>
              <th className="text-left p-3">Price</th>
              <th className="text-left p-3">Stock</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(products ?? []).map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-3">{p.name}</td>
                <td className="p-3">{p.unit}</td>
                <td className="p-3">{p.size ?? "-"}</td>
                <td className="p-3">{formatKES(p.price)}</td>
                <td className="p-3">{p.stock}</td>
                <td className="p-3 space-x-2">
                  <button
                    className="underline"
                    onClick={() => updateProduct.mutate({ id: p.id, stock: p.stock + 1 })}
                  >
                    +1 Stock
                  </button>
                  <button className="text-red-600 underline" onClick={() => deleteProduct.mutate(p.id)}>
                    Archive
                  </button>
                  <button className="underline" onClick={() => restoreProduct.mutate(p.id)}>
                    Restore
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SidebarLayout>
  );
}

function formatKES(amount: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "KES" }).format(amount);
}

