"use client";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { trpc } from "@/utils/trpc";
import ClientNavbar from "@/components/ClientNavbar";
import Image from "next/image";

export default function CartPage() {
  const { status } = useSession();
  const utils = trpc.useUtils();
  const { data: cart } = trpc.cart.get.useQuery(undefined, {
    enabled: status === "authenticated",
  });
  const update = trpc.cart.addOrUpdate.useMutation({
    onSuccess: () => utils.cart.get.invalidate(),
  });
  const remove = trpc.cart.remove.useMutation({
    onSuccess: () => utils.cart.get.invalidate(),
  });
  const clear = trpc.cart.clear.useMutation({
    onSuccess: () => utils.cart.get.invalidate(),
  });

  if (status !== "authenticated") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background text-foreground">
        <div className="bg-card border border-border shadow-md rounded-xl p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold mb-3 text-primary">
            Shopping Cart
          </h1>
          <p className="text-muted-foreground">
            Please{" "}
            <Link href="/auth/login" className="underline text-primary">
              sign in
            </Link>{" "}
            to use the cart.
          </p>
        </div>
      </div>
    );
  }

  const items = cart?.items ?? [];
  const subtotal = items.reduce(
    (sum, i) => sum + (i.product?.price ?? 0) * i.quantity,
    0
  );

  function onQtyChange(productId: string, qty: number) {
    if (qty <= 0) return;
    update.mutate({ productId, quantity: qty });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ClientNavbar />
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-extrabold mb-8 py-8 text-primary">
          Your Shopping Cart 🛒
        </h1>

        {items.length === 0 ? (
          <div className="text-center bg-secondary/20 p-10 rounded-lg border border-border shadow-sm">
            <p className="text-muted-foreground mb-4">
              Your cart is empty 😢
            </p>
            <Link
              href="/shop"
              className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition"
            >
              Shop Now
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-10">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 bg-card border border-border rounded-lg p-4 shadow-sm hover:shadow-md transition"
                >
                  {/* Product Image */}
                  <div className="w-20 h-20 relative rounded-md overflow-hidden">
                    <Image
                      src={
                        item.product?.image
                          ? item.product.image.startsWith("/uploads")
                            ? item.product.image
                            : `/uploads/${item.product.image}`
                          : "/placeholder.png"
                      }
                      alt={item.product?.name ?? "Product"}
                      fill
                      className="object-contain"
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">
                      {item.product ? (
                        <Link
                          href={`/shop/${item.productId}`}
                          className="hover:underline"
                        >
                          {item.product.name}
                        </Link>
                      ) : (
                        item.productId
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      KES {(item.product?.price ?? 0).toLocaleString()}
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        onQtyChange(item.productId, item.quantity - 1)
                      }
                      className="px-3 py-1  rounded  transition"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) =>
                        onQtyChange(
                          item.productId,
                          parseInt(e.target.value) || 1
                        )
                      }
                      className="w-14 text-center border border-border rounded bg-background"
                    />
                    <button
                      onClick={() =>
                        onQtyChange(item.productId, item.quantity + 1)
                      }
                      className="px-3 py-1  rounded transition"
                    >
                      +
                    </button>
                  </div>

                  {/* Subtotal */}
                  <div className="font-semibold text-sm">
                    KES{" "}
                    {(
                      (item.product?.price ?? 0) * item.quantity
                    ).toLocaleString()}
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => remove.mutate(item.productId)}
                    className="text-red-500 text-xs hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            {/* Summary Section */}
            <div className="bg-secondary border border-border p-6 rounded-lg shadow-sm space-y-4 max-w-md ml-auto">
              <div className="flex justify-between text-white text-lg font-semibold">
                <span>Subtotal</span>
                <span className="text-primary">
                  KES {subtotal.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center mt-4">
                <button
                  onClick={() => clear.mutate()}
                  className="text-red-600 underline text-sm hover:text-red-700"
                >
                  Clear Cart
                </button>
                <Link
                  href="/orders"
                  className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition"
                >
                  Proceed to Checkout
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
