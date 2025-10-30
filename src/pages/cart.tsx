import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { trpc } from "@/utils/trpc";
import { useRouter } from "next/router";

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
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
      setCart([]); saveCart([]); router.push("/orders");
    }
  });

  useEffect(() => {
    setCart(getCart());
  }, []);

  function removeItem(productId: string) {
    const updated = cart.filter((ci) => ci.productId !== productId);
    setCart(updated);
    saveCart(updated);
  }

  function updateQuantity(productId: string, qty: number) {
    if (qty <= 0) return;
    const updated = cart.map((ci) => ci.productId === productId ? { ...ci, quantity: qty } : ci);
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
    <div className="max-w-2xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-4">Shopping Cart</h1>
      {cart.length === 0 ? (
        <div className="text-gray-400 mb-4">Your cart is empty. <Link href="/shop" className="underline text-primary">Shop now!</Link></div>
      ) : (
        <>
          <table className="w-full mb-6 text-sm">
            <thead>
              <tr>
                <th className="text-left p-2">Product</th>
                <th className="text-left p-2">Price</th>
                <th className="text-left p-2">Qty</th>
                <th className="text-left p-2">Subtotal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item) => (
                <tr key={item.productId}>
                  <td className="p-2">{item.name}</td>
                  <td className="p-2">KES {item.price.toLocaleString()}</td>
                  <td className="p-2">
                    <input type="number" min={1} max={item.stock} value={item.quantity}
                      onChange={e => updateQuantity(item.productId, parseInt(e.target.value) || 1)}
                      className="border px-2 py-1 w-16" />
                  </td>
                  <td className="p-2">KES {(item.price * item.quantity).toLocaleString()}</td>
                  <td className="p-2">
                    <button className="text-red-600 underline text-xs" onClick={() => removeItem(item.productId)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mb-6 flex justify-between">
            <button className="text-xs underline text-red-600" onClick={clearCart}>Clear cart</button>
            <div className="font-bold">Subtotal: KES {subtotal.toLocaleString()}</div>
          </div>
          {checkoutError && <div className="mb-4 text-red-700 bg-red-100 p-2 rounded">{checkoutError}</div>}
          <button
            className="bg-primary text-white px-8 py-3 rounded font-bold text-lg"
            disabled={cart.length === 0 || orderCreate.isLoading}
            onClick={proceedCheckout}
          >
            Proceed to Checkout
          </button>
        </>
      )}
    </div>
  );
}
