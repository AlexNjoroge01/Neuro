import SidebarLayout from "@/components/Layout";
import { trpc } from "@/utils/trpc";
import { FormEvent, useState, useMemo } from "react";

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

  const [form, setForm] = useState({ name: "", unit: "", size: "", price: "", costPrice: "", stock: "" });
  const [isModalOpen, setIsModalOpen] = useState(false);

  const productStats = useMemo(() => {
    return { totalProducts: products?.length ?? 0 };
  }, [products]);

  function submit(e: FormEvent) {
    e.preventDefault();
    const price = parseFloat(form.price);
    const costPrice = form.costPrice ? parseFloat(form.costPrice) : 0;
    const stock = parseInt(form.stock, 10);
    if (!form.name || isNaN(price) || isNaN(stock) || !form.unit) return;
    createProduct.mutate({ name: form.name, unit: form.unit as any, size: form.size || undefined, price, costPrice, stock });
    setForm({ name: "", unit: "", size: "", price: "", costPrice: "", stock: "" });
    setIsModalOpen(false);
  }

  return (
    <SidebarLayout>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Products</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Stat title="Total Products" value={productStats.totalProducts.toString()} index={0} />
      </div>

      <div className="mb-6">
        <button
          className="bg-primary text-primary-foreground rounded px-3 py-1"
          onClick={() => setIsModalOpen(true)}
        >
          Add Product
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50  flex items-center justify-center z-50">
          <div className="bg-background border border-gray-200/20 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Add New Product</h2>
            <form onSubmit={submit} className="grid gap-4">
              <input
                className="border rounded px-2 py-1 bg-gray-100/10"
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <input
                className="border rounded px-2 py-1 bg-gray-100/10"
                placeholder="Unit (e.g., kg, piece, tray)"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              />
              <input
                className="border rounded px-2 py-1 bg-gray-100/10"
                placeholder="Size (optional)"
                value={form.size}
                onChange={(e) => setForm({ ...form, size: e.target.value })}
              />
              <input
                className="border rounded px-2 py-1 bg-gray-100/10"
                placeholder="Price"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
              <input
                className="border rounded px-2 py-1 bg-gray-100/10"
                placeholder="Cost Price"
                value={form.costPrice}
                onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
              />
              <input
                className="border rounded px-2 py-1 bg-gray-100/10"
                placeholder="Stock"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  className="bg-secondary text-secondary-foreground rounded px-3 py-1"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary text-primary-foreground rounded px-3 py-1"
                >
                  Add Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="overflow-x-auto border rounded-lg bg-white">
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

function Stat({ title, value, index }: { title: string; value: string; index: number }) {
  const bgColor = index % 2 === 0 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground';
  return (
    <div className={`border rounded-lg px-8 py-10 ${bgColor}`}>
      <div className="text-sm">{title}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}

function formatKES(amount: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "KES" }).format(amount);
}