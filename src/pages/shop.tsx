import { trpc } from "@/utils/trpc";
import Link from "next/link";
import { useState } from "react";

const BANNER_IMAGE = "/b1.jpg"; // Replace with your hero or marketing image

const categories = ["All", "Headphones", "Earbuds", "Speakers", "Accessories"];

export default function ShopPage() {
  const { data: products, isLoading } = trpc.products.publicList.useQuery();
  const [selectedCategory, setSelectedCategory] = useState("All");
  // TODO: Add filters for Price, Brand, etc.
  const displayProducts = (products ?? []).filter(
    p => selectedCategory === "All" || p.category === selectedCategory
  );

  return (
    <div className="min-h-screen bg-[#FAF6DE] pb-10">
      {/* Header Banner */}
      <div className="bg-[#FFF6CF] flex flex-col md:flex-row items-center gap-8 px-8 py-10 rounded-lg max-w-6xl mx-auto mt-6 mb-8 shadow">
        <div className="flex-1">
          <h2 className="text-3xl font-bold mb-4 text-primary">Grab Upto 50% Off On <br />Selected Headphone</h2>
          <p className="mb-6 text-muted-foreground">Shop from premium quality audio brands. Limited time only.</p>
          <Link href="/shop" className="bg-primary text-primary-foreground px-7 py-3 rounded-lg font-semibold hover:bg-primary/90 transition">Buy Now</Link>
        </div>
        <div className="flex-shrink-0 w-56 h-56 relative">
          <img src={BANNER_IMAGE} alt="Hero" className="object-cover w-full h-full rounded-xl shadow-lg" />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="max-w-6xl mx-auto flex flex-wrap gap-3 px-2 mb-10">
        {/* Category */}
        <select
          className="border px-3 py-2 rounded text-sm bg-white shadow"
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
        >
          {categories.map((cat) => <option key={cat}>{cat}</option>)}
        </select>
        {/* TODO: More filter dropdowns for brand, price etc. can be added here */}
      </div>

      {/* Product Cards List */}
      <div className="max-w-6xl mx-auto grid gap-6 px-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {(displayProducts).map((prod) => (
          <div key={prod.id} className="group bg-white rounded-2xl p-4 shadow hover:shadow-xl transition relative flex flex-col cursor-pointer border border-gray-100">
            <button className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-xl">♡</button>
            <Link href={`/shop/${prod.id}`} className="flex flex-col h-full">
              <div className="aspect-square bg-gray-50 rounded-xl mb-3 flex items-center justify-center overflow-hidden">
                {prod.image ? (
                  <img src={prod.image} alt={prod.name}
                       className="w-full h-full object-contain group-hover:scale-105 transition" />
                ) : (
                  <span className="text-gray-300 text-6xl">🎧</span>
                )}
              </div>
              <div className="flex-1">
                <div className="text-xs mb-1 text-primary font-semibold">{prod.brand || 'Brand'}</div>
                <div className="font-semibold text-lg mb-1 text-gray-900 truncate">{prod.name}</div>
                <div className="text-xs text-gray-400 mb-1">{prod.category || 'Category'}</div>
              </div>
              <div className="mt-1 mb-2 font-bold text-xl text-primary">KES {prod.price?.toLocaleString()}</div>
              <div className="text-[11px] text-gray-400">In Stock: <b>{prod.stock}</b></div>
            </Link>
          </div>
        ))}
        {isLoading && <div>Loading...</div>}
      </div>
    </div>
  );
}
