"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { trpc } from "@/utils/trpc";
import { useRouter } from "next/router";
import Image from "next/image";
import ClientNavbar from "@/components/ClientNavbar";

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
  image?: string;
};

function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("cart") ?? "[]");
  } catch {
    return [];
  }
}

function saveCart(cart: CartItem[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem("cart", JSON.stringify(cart));
  }
}

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkoutError, setCheckoutError] = useState("");
  const { status } = useSession();
  const router = useRouter();

  const orderCreate = trpc.orders.create.useMutation({
    onSuccess: () => {
      setCart([]);
      saveCart([]);
      router.push("/orders");
    },
  });

  // Fetch missing product images
  const productIds = cart.map((i) => i.productId);
  const { data: fullProducts } = trpc.products.publicList.useQuery(
    { ids: productIds },
    { enabled: productIds.length > 0 }
  );

  useEffect(() => {
    setCart(getCart());
  }, []);

  // Merge fetched images into cart items
  useEffect(() => {
    if (fullProducts && cart.length > 0) {
      const map = new Map(fullProducts.map((p) => [p.id, p.image]));
      setCart((prev) =>
        prev.map((item) => ({
          ...item,
          image: map.get(item.productId) ?? item.image,
        }))
      );
    }
  }, [fullProducts, cart.length]);

  function removeItem(productId: string) {
    const updated = cart.filter((ci) => ci.productId !== productId);
    setCart(updated);
    saveCart(updated);
  }

  function updateQuantity(productId: string, qty: number) {
    if (qty <= 0) return;
    const updated = cart.map((ci) =>
      ci.productId === productId ? { ...ci, quantity: qty } : ci
    );
    setCart(updated);
    saveCart(updated);
  }

  function clearCart() {
    setCart([]);
    saveCart([]);
  }

  function proceedCheckout() {
    setCheckoutError("");
    if (status !== "authenticated") {
      setCheckoutError("You must sign in to checkout.");
      return;
    }
    orderCreate.mutate();
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ClientNavbar />
      <div className="max-w-6xl py-10 mx-auto">
        <h1 className="text-4xl font-extrabold mb-8 text-primary ">
          Your Shopping Cart
        </h1>

        {cart.length === 0 ? (
          <div className="text-center bg-secondary/20 p-10 rounded-lg border border-border shadow-sm">
            <p className="text-muted-foreground mb-4 ">
              Your cart is empty
            </p>
            <Link
              href="/shop"
              className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition"
            >
              Shop Now
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left: Product List */}
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center gap-4 bg-card border border-border rounded-lg p-4 shadow-sm hover:shadow-md transition"
                >
                  {/* Product Image */}
                  <div className="w-24 h-24 relative rounded-md overflow-hidden border">
                    <Image
                      src={
                        item.image
                          ? item.image.startsWith("/uploads")
                            ? item.image
                            : `/uploads/${item.image}`
                          : "/placeholder.png"
                      }
                      alt={item.name}
                      fill
                      className="object-contain"
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg line-clamp-2">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      KES {item.price.toLocaleString()}
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        updateQuantity(item.productId, item.quantity - 1)
                      }
                      className="w-8 h-8 rounded border flex items-center justify-center transition hover:bg-muted"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={item.stock}
                      value={item.quantity}
                      onChange={(e) =>
                        updateQuantity(
                          item.productId,
                          Math.max(1, parseInt(e.target.value) || 1)
                        )
                      }
                      className="w-14 text-center border border-border rounded bg-background"
                    />
                    <button
                      onClick={() =>
                        updateQuantity(item.productId, item.quantity + 1)
                      }
                      className="w-8 h-8 rounded border flex items-center justify-center transition hover:bg-muted"
                    >
                      +
                    </button>
                  </div>

                  {/* Subtotal */}
                  <div className="font-semibold text-right min-w-[80px]">
                    KES {(item.price * item.quantity).toLocaleString()}
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="text-red-500 hover:text-red-600 transition"
                    title="Remove"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {/* Right: Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-secondary border border-border rounded-lg p-6 shadow-sm sticky top-6">
                <h2 className="text-xl font-bold mb-4 text-secondary-foreground">Order Summary</h2>

                <div className="space-y-3 text-lg">
                  <div className="flex justify-between">
                    <span className="text-secondary-foreground">Subtotal</span>
                    <span className="text-secondary-foreground">KES {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-secondary-foreground">
                    <span>VAT</span>
                    <span>KES 0</span>
                  </div>
                  <div className="border-t border-border pt-3 flex justify-between font-bold text-xl">
                    <span className="text-secondary-foreground">Total</span>
                    <span className="text-primary">KES {subtotal.toLocaleString()}</span>
                  </div>
                </div>

                {checkoutError && (
                  <div className="mt-4 text-red-600 bg-red-100 p-3 rounded text-sm">
                    {checkoutError}
                  </div>
                )}

                <div className="mt-6 space-y-3">
                  <button
                    onClick={proceedCheckout}
                    disabled={orderCreate.isLoading}
                    className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary/90 transition disabled:opacity-50"
                  >
                    {orderCreate.isLoading ? "Processing..." : "Proceed to Checkout"}
                  </button>

                  <div className="flex justify-between text-sm">
                    <button
                      onClick={clearCart}
                      className="text-red-600 underline hover:text-red-700"
                    >
                      Clear Cart
                    </button>
                    <Link
                      href="/shop"
                      className="text-primary underline hover:text-primary/80"
                    >
                      Continue Shopping
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}