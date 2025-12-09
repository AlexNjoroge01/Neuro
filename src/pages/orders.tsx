import ClientNavbar from "@/components/ClientNavbar";
import SidebarLayout from "@/components/Layout";
import { trpc } from "@/utils/trpc";
import { useSession } from "next-auth/react";
import Image from "next/image";
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

  async function handleFulfill(orderId: string, nextStatus: "PAID" | "SHIPPED" | "COMPLETED") {
    setStatusUpdating(orderId);
    await fulfill.mutateAsync({ orderId, status: nextStatus });
    setStatusUpdating("");
  }

  const ordersContent = (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-900">
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
            className="bg-secondary text-white border border-white/10 shadow-sm rounded-xl p-5 transition hover:shadow-md"
          >
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 text-sm border-b border-white/20 pb-3">
              <div>
                <span className="font-medium text-white/90">Order ID:</span>{" "}
                {order.id}
              </div>
              <div className="text-white/80 text-sm">
                {new Date(order.createdAt).toLocaleString()}
              </div>
              <div className="text-sm">
                Status:{" "}
                <span className="font-semibold text-primary">{order.status}</span>
              </div>
              <div className="font-semibold text-white">
                Total: KES {order.total.toLocaleString()}
              </div>
            </div>

            {/* M-PESA Payment Information - Show for all users if available */}
            {order.transactions?.[0]?.mpesaReceiptNumber && (
              <div className="mt-3 pt-3 border-t border-white/20">
                <div className="text-xs text-primary font-semibold mb-2 flex items-center gap-1">
                  💳 Payment Information
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs bg-primary/10 p-3 rounded-lg border border-primary/20">
                  <div>
                    <span className="text-white/70">Status:</span>{" "}
                    <span className="text-green-400 font-semibold">✓ CONFIRMED</span>
                  </div>
                  <div>
                    <span className="text-white/70">M-PESA Receipt:</span>{" "}
                    <span className="text-white font-mono">{order.transactions[0].mpesaReceiptNumber}</span>
                  </div>
                  <div>
                    <span className="text-white/70">Transaction Date:</span>{" "}
                    <span className="text-white">
                      {order.transactions[0].transactionDate
                        ? (() => {
                          const dateStr = order.transactions[0].transactionDate;
                          const year = dateStr.substring(0, 4);
                          const month = dateStr.substring(4, 6);
                          const day = dateStr.substring(6, 8);
                          const hour = dateStr.substring(8, 10);
                          const minute = dateStr.substring(10, 12);
                          return `${day}/${month}/${year} ${hour}:${minute}`;
                        })()
                        : "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-white/70">Amount Paid:</span>{" "}
                    <span className="text-white font-semibold">
                      KES {order.transactions[0].amount?.toLocaleString() || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {isAdmin && (
              <div className="mt-3 pt-3 border-t border-white/20">
                <div className="text-xs text-white/70 font-medium mb-2">Customer Details:</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-white/70">Name:</span>{" "}
                    <span className="text-white">{order.user?.name || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-white/70">Email:</span>{" "}
                    <span className="text-white">{order.user?.email || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-white/70">Phone:</span>{" "}
                    <span className="text-white">
                      {order.user?.phone || order.transactions?.[0]?.phoneNumber || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-white/70">Address:</span>{" "}
                    <span className="text-white">{order.user?.address || order.address || "N/A"}</span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-white/70">Shipping Info:</span>{" "}
                    <span className="text-white">{order.user?.shippingInfo || "N/A"}</span>
                  </div>
                </div>
              </div>
            )}

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
              <table className="w-full text-xs border border-white/10 rounded-lg">
                <thead className="bg-white/5 text-white/80 font-medium">
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
                      className="border-t border-white/10 text-white/90"
                    >
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          {item.product?.image ? (
                            <Image
                              src={"/uploads/" + item.product.image}
                              alt={item.product?.name ?? "Product"}
                              width={32}
                              height={32}
                              className="h-8 w-8 rounded object-cover flex-shrink-0 ring-1 ring-white/20"
                            />
                          ) : (
                            <div className="h-8 w-8 bg-white/10 rounded flex-shrink-0" />
                          )}
                          <span>{item.product?.name ?? item.productId}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-white/90">
                        KES {item.price.toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-white/90">
                        {item.quantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (isAdmin) {
    return (
      <SidebarLayout>
        <div className="overflow-y-auto h-screen bg-gray-50">
          {ordersContent}
        </div>
      </SidebarLayout>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientNavbar />
      {ordersContent}
    </div>
  );
}