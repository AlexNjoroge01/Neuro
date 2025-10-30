import { trpc } from "@/utils/trpc";
import { useRouter } from "next/router";
import { useState } from "react";
import type { CartItem } from "../cart";

export default function ProductDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { data: product, isLoading } = trpc.products.publicGet.useQuery(typeof id === "string" ? id : "", { enabled: !!id });
  const [added, setAdded] = useState(false);

  function addToCart() {
    if (!product) return;
    let cart: CartItem[] = [];
    try {
      cart = JSON.parse(localStorage.getItem("cart") ?? "[]");
    } catch {}
    const idx = cart.findIndex(ci => ci.productId === product.id);
    if (idx >= 0) {
      cart[idx].quantity += 1;
    } else {
      cart.push({ productId: product.id, name: product.name, price: product.price, quantity: 1, stock: product.stock });
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  }

  if (isLoading) return <div className="p-8">Loading...</div>;
  if (!product) return <div className="p-8">Product not found.</div>;

  return (
    <div className="max-w-xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
      <div className="text-xl mb-1">KES {product.price.toLocaleString()}</div>
      <div className="mb-2 text-gray-400">Stock: {product.stock}</div>
      {added && <div className="p-2 mb-2 rounded bg-green-100 text-green-700">Added to cart</div>}
      <button className="bg-primary text-white px-7 py-2 rounded mt-4 cursor-pointer" onClick={addToCart}>
        Add to Cart
      </button>
    </div>
  );
}
