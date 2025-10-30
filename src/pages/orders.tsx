import { trpc } from "@/utils/trpc";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

export default function OrdersPage() {
  const { data: session, status } = useSession();
  const { data: orders, isLoading } = trpc.orders.list.useQuery(undefined, { enabled: status === "authenticated" });
  const fulfill = trpc.orders.fulfill.useMutation();
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPERUSER";
  const [statusUpdating, setStatusUpdating] = useState('');

  if (status !== "authenticated") return <div className="p-8">You must be logged in to view your orders.</div>;

  async function handleFulfill(orderId: string, nextStatus: string) {
    setStatusUpdating(orderId);
    await fulfill.mutateAsync({ orderId, status: nextStatus });
    setStatusUpdating('');
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl mb-3 font-bold">{isAdmin ? "All Orders" : "My Orders"}</h1>
      {isLoading ? <div>Loading...</div> : null}
      {(orders ?? []).length === 0 && !isLoading ? (
        <div className="mb-4">No orders yet. {isAdmin ? null : <Link href="/shop" className="underline">Go shopping</Link>}</div>
      ) : null}
      <div className="space-y-8">
        {(orders ?? []).map(order => (
          <div key={order.id} className="border rounded-lg mb-6 bg-white shadow p-4">
            <div className="mb-2 flex flex-col md:flex-row md:justify-between text-sm text-gray-500 gap-2">
              <div>ID: {order.id}</div>
              <div>{new Date(order.createdAt).toLocaleString()}</div>
              <div>Status: <span className="font-bold text-primary">{order.status}</span></div>
              <div className="font-bold">Total: KES {order.total.toLocaleString()}</div>
              {isAdmin && <div className="italic text-xs">User: {order.user?.email || order.userId}</div>}
              {isAdmin && order.status !== 'COMPLETED' && (
                <div className="flex gap-1">
                  {order.status === 'PENDING' && (
                    <button className="px-3 py-1 text-xs rounded bg-primary text-white" disabled={statusUpdating === order.id} onClick={() => handleFulfill(order.id, 'PAID')}>Mark Paid</button>
                  )}
                  {order.status === 'PAID' && (
                    <button className="px-3 py-1 text-xs rounded bg-blue-600 text-white" disabled={statusUpdating === order.id} onClick={() => handleFulfill(order.id, 'SHIPPED')}>Mark Shipped</button>
                  )}
                  {order.status === 'SHIPPED' && (
                    <button className="px-3 py-1 text-xs rounded bg-green-600 text-white" disabled={statusUpdating === order.id} onClick={() => handleFulfill(order.id, 'COMPLETED')}>Mark Completed</button>
                  )}
                </div>
              )}
            </div>
            <table className="w-full bg-gray-50 rounded text-xs mt-2">
              <thead>
                <tr>
                  <th className="text-left py-1 px-2">Item</th>
                  <th className="text-left py-1 px-2">Price</th>
                  <th className="text-left py-1 px-2">Qty</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map(item => (
                  <tr key={item.id}>
                    <td className="px-2 py-1">{item.product?.name ?? item.productId}</td>
                    <td className="px-2 py-1">KES {item.price.toLocaleString()}</td>
                    <td className="px-2 py-1">{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
