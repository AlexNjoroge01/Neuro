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

  const [form, setForm] = useState({ name: "", price: "", stock: "", category: "" });

  function submit(e: FormEvent) {
    e.preventDefault();
    const price = parseFloat(form.price);
    const stock = parseInt(form.stock, 10);
    if (!form.name || isNaN(price) || isNaN(stock) || !form.category) return;
    createProduct.mutate({ name: form.name, price, stock, category: form.category });
    setForm({ name: "", price: "", stock: "", category: "" });
  }

  return (
    <SidebarLayout>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Products</h1>
      </div>

      <form onSubmit={submit} className="grid gap-2 md:grid-cols-5 border rounded-lg p-3 mb-6">
        <input className="border rounded px-2 py-1" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="border rounded px-2 py-1" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        <input className="border rounded px-2 py-1" placeholder="Stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
        <input className="border rounded px-2 py-1" placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
        <button className="bg-black text-white rounded px-3 py-1">Add</button>
      </form>

      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-t">
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Price</th>
              <th className="text-left p-3">Stock</th>
              <th className="text-left p-3">Category</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(products ?? []).map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-3">{p.name}</td>
                <td className="p-3">{p.price.toFixed(2)}</td>
                <td className="p-3">{p.stock}</td>
                <td className="p-3">{p.category}</td>
                <td className="p-3 space-x-2">
                  <button
                    className="underline"
                    onClick={() => updateProduct.mutate({ id: p.id, stock: p.stock + 1 })}
                  >
                    +1 Stock
                  </button>
                  <button className="text-red-600 underline" onClick={() => deleteProduct.mutate(p.id)}>
                    Delete
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


