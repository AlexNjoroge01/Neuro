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
  const [isModalOpen, setIsModalOpen] = useState(false);

  const productMap = useMemo(() => Object.fromEntries((products ?? []).map((p) => [p.id, p.name])), [products]);

  const inventoryStats = useMemo(() => {
    const stats = {
      totalProducts: products?.length ?? 0,
      totalStock: products?.reduce((sum, p) => sum + p.stock, 0) ?? 0,
      trayCount: products?.filter(p => p.unit === "TRAY").length ?? 0,
      dozenCount: products?.filter(p => p.unit === "DOZEN").length ?? 0,
      pieceCount: products?.filter(p => p.unit === "PIECE").length ?? 0,
    };
    return stats;
  }, [products]);

  function submit(e: FormEvent) {
    e.preventDefault();
    const delta = parseInt(change, 10);
    if (!productId || isNaN(delta) || !reason) return;
    adjust.mutate({ productId, change: delta, reason });
    setChange("");
    setIsModalOpen(false);
  }

  return (
    <SidebarLayout>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Inventory</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-5 mb-6">
        <Stat title="Total Products" value={inventoryStats.totalProducts.toString()} index={0} />
        <Stat title="Total Stock" value={inventoryStats.totalStock.toString()} index={1} />
        <Stat title="Tray Units" value={inventoryStats.trayCount.toString()} index={2} />
        <Stat title="Dozen Units" value={inventoryStats.dozenCount.toString()} index={3} />
        <Stat title="Piece Units" value={inventoryStats.pieceCount.toString()} index={4} />
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
              <input
                className="border rounded px-2 py-1 bg-gray-100/10"
                placeholder="Change (+/-)"
                value={change}
                onChange={(e) => setChange(e.target.value)}
              />
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

function Stat({ title, value, index }: { title: string; value: string; index: number }) {
  const bgColor = index % 2 === 0 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground';
  return (
    <div className={`border rounded-lg px-8 py-10 ${bgColor}`}>
      <div className="text-sm">{title}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}