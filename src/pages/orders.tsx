import ClientNavbar from "@/components/ClientNavbar";
import { trpc } from "@/utils/trpc";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

export default function OrdersPage() {
  const { data: session, status } = useSession();
  const { data: orders, isLoading } = trpc.orders.list.useQuery(undefined, {
    enabled: status === "authenticated",
  });
  const fulfill = trpc.orders.fulfill.useMutation();
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPERUSER";
  const [statusUpdating, setStatusUpdating] = useState("");

  if (status !== "authenticated")
    return (
      <div className="flex h-screen items-center justify-center text-center px-6">
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100 max-w-sm w-full">
          <h2 className="text-lg font-semibold mb-2">Access Denied</h2>
          <p className="text-sm text-gray-600">
            You must be logged in to view your orders.
          </p>
        </div>
      </div>
    );

  async function handleFulfill(orderId: string, nextStatus: string) {
    setStatusUpdating(orderId);
    await fulfill.mutateAsync({ orderId, status: nextStatus });
    setStatusUpdating("");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientNavbar />
      <div className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">
          {isAdmin ? "All Orders" : "My Orders"}
        </h1>

        {isLoading && (
          <div className="text-center text-gray-500 py-10">Loading orders...</div>
        )}

        {!isLoading && (orders ?? []).length === 0 && (
          <div className="text-gray-600 mb-4">
            No orders yet.{" "}
            {!isAdmin && (
              <Link href="/shop" className="text-primary underline">
                Go shopping
              </Link>
            )}
          </div>
        )}

        <div className="space-y-8">
          {(orders ?? []).map((order) => (
            <div
              key={order.id}
              className="bg-white border border-gray-100 shadow-sm rounded-xl p-5 transition hover:shadow-md"
            >
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 text-sm text-gray-600 border-b border-gray-100 pb-3">
                <div>
                  <span className="font-medium text-gray-800">Order ID:</span> {order.id}
                </div>
                <div>{new Date(order.createdAt).toLocaleString()}</div>
                <div>
                  Status:{" "}
                  <span className="font-semibold text-primary">{order.status}</span>
                </div>
                <div className="font-semibold text-gray-900">
                  Total: KES {order.total.toLocaleString()}
                </div>
                {isAdmin && (
                  <div className="italic text-xs text-gray-500">
                    User: {order.user?.email || order.userId}
                  </div>
                )}
              </div>

              {isAdmin && order.status !== "COMPLETED" && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {order.status === "PENDING" && (
                    <button
                      className="px-3 py-1 text-xs rounded bg-primary text-white hover:bg-primary/90 transition"
                      disabled={statusUpdating === order.id}
                      onClick={() => handleFulfill(order.id, "PAID")}
                    >
                      Mark Paid
                    </button>
                  )}
                  {order.status === "PAID" && (
                    <button
                      className="px-3 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 transition"
                      disabled={statusUpdating === order.id}
                      onClick={() => handleFulfill(order.id, "SHIPPED")}
                    >
                      Mark Shipped
                    </button>
                  )}
                  {order.status === "SHIPPED" && (
                    <button
                      className="px-3 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700 transition"
                      disabled={statusUpdating === order.id}
                      onClick={() => handleFulfill(order.id, "COMPLETED")}
                    >
                      Mark Completed
                    </button>
                  )}
                </div>
              )}

              <div className="overflow-x-auto mt-4">
                <table className="w-full text-xs border border-gray-100 rounded-lg">
                  <thead className="bg-gray-50 text-gray-700 font-medium">
                    <tr>
                      <th className="text-left py-2 px-3">Item</th>
                      <th className="text-left py-2 px-3">Price</th>
                      <th className="text-left py-2 px-3">Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item) => (
                      <tr
                        key={item.id}
                        className="border-t border-gray-100 text-gray-700"
                      >
                        <td className="px-3 py-2">
                          {item.product?.name ?? item.productId}
                        </td>
                        <td className="px-3 py-2">
                          KES {item.price.toLocaleString()}
                        </td>
                        <td className="px-3 py-2">{item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
