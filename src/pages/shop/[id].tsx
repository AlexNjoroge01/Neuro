import { trpc } from "@/utils/trpc";
import { useRouter } from "next/router";
import { useState } from "react";
import { useSession } from "next-auth/react";

export default function ProductDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { status } = useSession();
  const utils = trpc.useUtils();
  const add = trpc.cart.add.useMutation({ onSuccess: () => utils.cart.get.invalidate() });
  const { data: product, isLoading } = trpc.products.publicGet.useQuery(typeof id === "string" ? id : "", { enabled: !!id });
  const [added, setAdded] = useState(false);

  async function addToCart() {
    if (!product) return;
    if (status !== "authenticated") {
      router.push("/auth/login");
      return;
    }
    await add.mutateAsync({ productId: product.id, delta: 1 });
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  }

  if (isLoading) return <div className="p-8">Loading...</div>;
  if (!product) return <div className="p-8">Product not found.</div>;

  const imgSrc = product.image ? (product.image.startsWith("/uploads") ? product.image : `/uploads/${product.image}`) : "";

  return (
    <div className="max-w-2xl mx-auto py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-2 bg-gray-50">
          {imgSrc ? (
            <img src={imgSrc} alt={product.name} className="w-full h-auto object-contain rounded" />
          ) : (
            <div className="aspect-square flex items-center justify-center text-4xl text-gray-300">🎧</div>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
          <div className="text-sm text-gray-500 mb-1">{product.brand || "Brand"}</div>
          <div className="text-sm text-gray-500 mb-3">{product.category || "Category"}</div>
          <div className="text-xl mb-1">KES {product.price.toLocaleString()}</div>
          <div className="mb-2 text-gray-400">Stock: {product.stock}</div>
          {added && <div className="p-2 mb-2 rounded bg-green-100 text-green-700">Added to cart</div>}
          <button className="bg-primary text-white px-7 py-2 rounded mt-2 cursor-pointer" onClick={addToCart}>
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
