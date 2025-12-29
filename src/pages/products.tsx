import SidebarLayout from "@/components/Layout";
import { trpc } from "@/utils/trpc";
import { FormEvent, useState, useMemo } from "react";
import Image from "next/image";
import { useCloudinaryUpload } from "@/hooks/useCloudinaryUpload";

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

  const [form, setForm] = useState({ name: "", unit: "", size: "", price: "", costPrice: "", stock: "", image: "", category: "", brand: "" });
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  const { uploadImage, isUploading } = useCloudinaryUpload();

  const productStats = useMemo(() => {
    return { totalProducts: products?.length ?? 0 };
  }, [products]);

  function openEditModal(product: { id: string; name: string; unit: string; size: string | null; price: number; costPrice: number; stock: number; image: string | null; category: string | null; brand: string | null }) {
    setEditingProductId(product.id);
    setForm({
      name: product.name,
      unit: product.unit,
      size: product.size || "",
      price: product.price.toString(),
      costPrice: product.costPrice.toString(),
      stock: product.stock.toString(),
      image: product.image || "",
      category: product.category || "",
      brand: product.brand || "",
    });
    setFile(null);
    setFilePreview("");
    setIsModalOpen(true);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const price = parseFloat(form.price);
    const costPrice = form.costPrice ? parseFloat(form.costPrice) : 0;
    const stock = parseInt(form.stock, 10);
    if (!form.name || isNaN(price) || isNaN(stock) || !form.unit) return;

    let image = form.image;
    if (file) {
      const cloudinaryUrl = await uploadImage(file);
      image = cloudinaryUrl || "";
    }

    if (editingProductId) {
      updateProduct.mutate({
        id: editingProductId,
        name: form.name,
        unit: form.unit,
        size: form.size || undefined,
        price,
        costPrice,
        stock,
        image: image || undefined,
        category: form.category || undefined,
        brand: form.brand || undefined,
      });
    } else {
      createProduct.mutate({
        name: form.name,
        unit: form.unit,
        size: form.size || undefined,
        price,
        costPrice,
        stock,
        image: image || undefined,
        category: form.category || undefined,
        brand: form.brand || undefined,
      });
    }
    setForm({ name: "", unit: "", size: "", price: "", costPrice: "", stock: "", image: "", category: "", brand: "" });
    setFile(null);
    setFilePreview("");
    setIsModalOpen(false);
    setEditingProductId(null);
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
            <h2 className="text-lg font-semibold mb-4">{editingProductId ? "Edit Product" : "Add New Product"}</h2>
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
              {/* Product file/image upload */}
              <input
                type="file"
                accept="image/*"
                className="border rounded px-2 py-1 bg-gray-100/10"
                onChange={e => {
                  const f = e.target.files ? e.target.files[0] : null;
                  setFile(f);
                  setFilePreview(f ? URL.createObjectURL(f) : "");
                }}
              />
              {filePreview ? (
                <Image
                  src={filePreview}
                  alt="Preview"
                  width={96}
                  height={96}
                  className="h-24 w-24 object-cover rounded"
                />
              ) : form.image ? (
                <Image
                  src={form.image.startsWith('https://') ? form.image : "/uploads/" + form.image}
                  alt="Preview"
                  width={96}
                  height={96}
                  className="h-24 w-24 object-cover rounded"
                />
              ) : null}

              <input
                className="border rounded px-2 py-1 bg-gray-100/10"
                placeholder="Category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
              <input
                className="border rounded px-2 py-1 bg-gray-100/10"
                placeholder="Brand"
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  className="bg-secondary text-secondary-foreground rounded px-3 py-1"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingProductId(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary text-primary-foreground rounded px-3 py-1"
                  disabled={isUploading}
                >
                  {isUploading ? "Uploading..." : editingProductId ? "Update Product" : "Add Product"}
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
              <th className="text-left p-3">Category</th>
              <th className="text-left p-3">Brand</th>
              <th className="text-left p-3">Image</th>
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
                <td className="p-3">{p.category ?? "-"}</td>
                <td className="p-3">{p.brand ?? "-"}</td>
                <td className="p-3">
                  {p.image ? (
                    <Image
                      src={p.image.startsWith('https://') ? p.image : "/uploads/" + p.image}
                      alt={p.name}
                      width={40}
                      height={40}
                      className="h-10 w-10 object-cover rounded"
                    />
                  ) : (
                    "-"
                  )}
                </td>
                <td className="p-3 space-x-2">
                  <button
                    className="bg-blue-600 text-white px-2 py-1 rounded-2xl"
                    onClick={() => openEditModal(p)}
                  >
                    Edit
                  </button>
                  <button className="text-red-600 border bg-red-600 text-white px-2 py-1 rounded-2xl" onClick={() => deleteProduct.mutate(p.id)}>
                    Delete
                  </button>
                  {/* <button className="underline" onClick={() => restoreProduct.mutate(p.id)}>
                    Restore
                  </button> */}
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