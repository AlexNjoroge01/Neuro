import { trpc } from "@/utils/trpc";
import Link from "next/link";
import { useState, useMemo } from "react";
import ClientNavbar from "@/components/ClientNavbar";

const BANNER_IMAGE = "/b1.jpg";

export default function ShopPage() {
  const { data: products, isLoading } = trpc.products.publicList.useQuery();
  const [selectedCategory, setSelectedCategory] = useState("All");

  // 🧩 Extract unique categories from products dynamically
  const categories = useMemo(() => {
    if (!products) return ["All"];
    const unique = Array.from(
      new Set(products.map((p) => p.category).filter(Boolean))
    );
    return ["All", ...unique];
  }, [products]);

  // 🛒 Filter by selected category
  const displayProducts = (products ?? []).filter(
    (p) => selectedCategory === "All" || p.category === selectedCategory
  );

  return (
    <div className="min-h-screen bg-background pb-10">
      <ClientNavbar />

      {/* Header Banner */}
      <div className="bg-secondary/20 flex flex-col md:flex-row items-center gap-8 px-8 py-10 rounded-lg max-w-6xl mx-auto mt-6 mb-8 border border-border shadow-sm">
        <div className="flex-1">
          <h2 className="text-3xl font-bold mb-3 text-primary">
            Grab Upto 50% Off On <br />Selected Items
          </h2>
          <p className="mb-6 text-muted-foreground">
            Shop from premium quality audio brands. Limited time only.
          </p>
          <Link
            href="/shop"
            className="bg-primary text-primary-foreground px-7 py-3 rounded-lg font-semibold hover:bg-primary/90 transition"
          >
            Buy Now
          </Link>
        </div>
        <div className="flex-shrink-0 w-56 h-56 relative">
          <img
            src={BANNER_IMAGE}
            alt="Hero"
            className="object-cover w-full h-full rounded-xl shadow-lg"
          />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="max-w-6xl mx-auto flex flex-wrap gap-3 px-2 mb-10">
        <select
          className="border border-border px-3 py-2 rounded text-sm bg-background text-foreground focus:ring-1 focus:ring-primary"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          {categories.map((cat) => (
            <option key={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Product Cards */}
      <div className="max-w-6xl mx-auto grid gap-6 px-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {(displayProducts ?? []).map((prod) => (
          <div
            key={prod.id}
            className="group bg-card rounded-lg p-4 shadow-sm hover:shadow-lg transition border border-border flex flex-col cursor-pointer"
          >
            <Link href={`/shop/${prod.id}`} className="flex flex-col h-full">
              <div className="aspect-square bg-gray-100/10 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                {prod.image ? (
                  <img
                    src={prod.image.startsWith("/uploads") ? prod.image : `/uploads/${prod.image}`}
                    alt={prod.name}
                    className="w-full h-full object-contain group-hover:scale-105 transition"
                  />
                ) : (
                  <span className="text-gray-300 text-6xl">🎧</span>
                )}
              </div>
              <div className="flex-1">
                <div className="text-xs mb-1 text-primary font-semibold">
                  {prod.brand || "Brand"}
                </div>
                <div className="font-semibold text-lg mb-1 text-foreground truncate">
                  {prod.name}
                </div>
                <div className="text-xs text-muted-foreground mb-1">
                  {prod.category || "Category"}
                </div>
              </div>
              <div className="mt-1 mb-2 font-bold text-xl text-primary">
                {formatKES(prod.price ?? 0)}
              </div>
              <div className="text-[11px] text-muted-foreground">
                In Stock: <b>{prod.stock}</b>
              </div>
            </Link>
          </div>
        ))}
        {isLoading && <div>Loading...</div>}
      </div>
    </div>
  );
}

function formatKES(amount: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "KES",
  }).format(amount);
}
