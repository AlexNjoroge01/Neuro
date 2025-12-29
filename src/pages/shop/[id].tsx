import { trpc } from "@/utils/trpc";
import { useRouter } from "next/router";
import { useState } from "react";
import { useSession } from "next-auth/react";
import ClientNavbar from "@/components/ClientNavbar";
import Footer from "@/components/Footer";
import { toast } from "react-toastify";
import Image from "next/image";

export default function ProductDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { status } = useSession();
  const utils = trpc.useUtils();
  const add = trpc.cart.add.useMutation({
    onSuccess: () => utils.cart.get.invalidate(),
  });
  const { data: product, isLoading } = trpc.products.publicGet.useQuery(
    typeof id === "string" ? id : "",
    { enabled: !!id }
  );

  const [qty, setQty] = useState(1);

  if (isLoading) return <div className="p-8">Loading...</div>;
  if (!product) return <div className="p-8">Product not found.</div>;

  // Handle both Cloudinary URLs (https://) and legacy /uploads/ paths
  const baseImg = product.image
    ? product.image.startsWith('https://')
      ? product.image
      : product.image.startsWith("/uploads")
        ? product.image
        : `/uploads/${product.image}`
    : "";
  const gallery = [baseImg, baseImg, baseImg, baseImg].filter(Boolean);


  async function addToCart() {
    if (status !== "authenticated") {
      toast.error("Please login to add items to cart");
      // Preserve the product page so we can redirect back here after login
      const callbackUrl = typeof router.asPath === "string" ? router.asPath : `/shop/${id}`;
      router.push(`/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      return;
    }
    if (!product) return;
    await add.mutateAsync({ productId: product.id, delta: qty });
    toast.success("Item added to cart!");
  }



  return (
    <div>
      {/* ✅ Navbar stays on top */}
      <ClientNavbar />

      {/* ✅ Grid for main content */}
      <div className="max-w-6xl mx-auto py-10 grid grid-cols-1 md:grid-cols-2 gap-10 px-4">
        {/* Left: Image gallery */}
        <div>
          <div className="border rounded-lg bg-gray-50 h-[420px] flex items-center justify-center overflow-hidden mb-3">
            {gallery[0] ? (
              <Image
                src={gallery[0]}
                alt={product.name}
                width={420}
                height={420}
                className="object-contain w-full h-full"
              />
            ) : (
              <div className="text-6xl text-gray-300">🎧</div>
            )}
          </div>
          {/* <div className="grid grid-cols-5 gap-2">
            {gallery.map((g, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImg(idx)}
                className={`border rounded-md h-16 bg-white overflow-hidden ${
                  activeImg === idx ? "ring-2 ring-primary" : ""
                }`}
              >
                <img
                  src={g}
                  alt={`thumb-${idx}`}
                  className="object-contain w-full h-full"
                />
              </button>
            ))}
          </div> */}
        </div>

        {/* Right: Details */}
        <div>
          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
          <div className="text-sm text-muted-foreground mb-2">
            Categories: {product.category ?? "General"}
            {product.brand ? `, ${product.brand}` : ""}
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="text-3xl font-extrabold text-primary">
              KES {product.price.toLocaleString()}
            </div>
            {/* {limitedStock && (
              <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                Limited Stock
              </span>
            )} */}
          </div>

          <div className="mb-4">
            <div className="text-sm font-semibold mb-2">Size</div>
            <div className="flex gap-2">
              {[(product.size ?? "")]
                .filter(Boolean)
                .map((s) => (
                  <span
                    key={s}
                    className="px-3 py-1 rounded border text-sm bg-background"
                  >
                    {s}
                  </span>
                ))}
            </div>
          </div>

          <div className="mb-6">
            <div className="text-sm font-semibold mb-2">Quantity</div>
            <div className="flex items-center gap-3">
              <button
                className="h-8 w-8 border rounded"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
              >
                –
              </button>
              <div className="w-10 text-center">{qty}</div>
              <button
                className="h-8 w-8 border rounded"
                onClick={() => setQty((q) => q + 1)}
              >
                +
              </button>
            </div>
          </div>

          <div className="flex gap-3">

            <button
              onClick={addToCart}
              className="px-6 py-3 rounded bg-primary text-primary-foreground font-bold"
            >
              ADD TO CART
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
