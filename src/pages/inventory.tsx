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
  const [type, setType] = useState<"ADD" | "REMOVE">("ADD");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("Manual adjustment");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const productMap = useMemo(() => Object.fromEntries((products ?? []).map((p) => [p.id, p.name])), [products]);

  const inventoryStats = useMemo(() => {
    return {
      totalProducts: products?.length ?? 0,
      totalStock: products?.reduce((sum, p) => sum + p.stock, 0) ?? 0,
    };
  }, [products]);

  function submit(e: FormEvent) {
    e.preventDefault();
    const qty = parseInt(amount, 10);
    if (!productId || isNaN(qty) || qty <= 0 || !reason) return;
    adjust.mutate({ productId, type, amount: qty, reason });
    setAmount("");
    setIsModalOpen(false);
  }

  return (
    <SidebarLayout>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Inventory</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <Stat title="Total Products" value={inventoryStats.totalProducts.toString()} index={0} />
        <Stat title="Total Stock" value={inventoryStats.totalStock.toString()} index={1} />
      </div>

      <div className="mb-6">
        <button
          className="bg-primary text-primary-foreground rounded px-3 py-1"
          onClick={() => setIsModalOpen(true)}
        >
          Adjust Inventory
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-background border border-gray-200/20 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Adjust Inventory</h2>
            <form onSubmit={submit} className="grid gap-4">
              <select
                className="border rounded px-2 py-1 bg-gray-100/10"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
              >
                <option value="">Select Product</option>
                {(products ?? []).map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <select
                  className="border rounded px-2 py-1 bg-gray-100/10"
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                >
                  <option value="ADD">Addition</option>
                  <option value="REMOVE">Reduction</option>
                </select>
                <input
                  className="border rounded px-2 py-1 bg-gray-100/10"
                  placeholder="Amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <input
                className="border rounded px-2 py-1 bg-gray-100/10"
                placeholder="Reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
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
                  Apply
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
                <td className="p-3">{l.type === "ADD" ? `+${l.change}` : `-${l.change}`}</td>
                <td className="p-3">{l.reason}</td>
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