"use client";
import { trpc } from "@/utils/trpc";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import ClientNavbar from "@/components/ClientNavbar";
import Image from "next/image";
import Footer from "@/components/Footer";
import FAQs from "@/components/FAQs";
import Testimonials from "@/components/Testimonials";


export default function ShopPage() {
  const { data: products, isLoading } = trpc.products.publicList.useQuery();
  const [selectedCategory, setSelectedCategory] = useState("All");

  // 🖼️ Background carousel setup
  const images = ["/b4.jpg", "/c1.jpg", "/c2.jpg", "/c3.jpg"];
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 7000); // change image every 7 seconds
    return () => clearInterval(interval);
  }, [images.length]);

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
      <div className="relative rounded-lg max-w-6xl mx-auto mt-10 mb-10 p-24 border border-border shadow-sm overflow-hidden">
        {/* Background carousel */}
        {images.map((img, index) => (
          <Image
            key={img}
            src={img}
            alt="Banner background"
            fill
            quality={95}
            className={`object-cover object-center absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentImage ? "opacity-100" : "opacity-0"
            }`}
            priority={index === 0}
          />
        ))}

        {/* Overlay */}
        <div className="absolute inset-0 bg-secondary/40" />

        {/* Content */}
        <div className="relative flex flex-col md:flex-row items-center gap-8 px-8 py-10 z-10">
          <div className="flex-1">
            <h2 className="text-5xl font-bold mb-4 text-primary drop-shadow">
              Grab Upto 50% Off On <br />Selected Items
            </h2>
            <p className="mb-10 text-white">
              Shop from premium quality audio brands. Limited time only.
            </p>
            <Link
              href="/shop"
              className="bg-primary text-primary-foreground px-7 py-3 rounded-lg font-semibold hover:bg-primary/90 transition"
            >
              Buy Now
            </Link>
          </div>
        </div>
      </div>

      {/* Filter Bar — changed to horizontal category cards */}
      <div className="max-w-6xl mx-auto flex gap-3 px-2 mb-10 overflow-x-auto scrollbar-hide">
        {categories.map((cat, index) => {
          const isSelected = selectedCategory === cat;
          const isAlt = index % 2 === 0;

          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap px-5 py-2 rounded-lg font-medium text-sm transition-all border border-border shadow-sm 
                ${
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : isAlt
                    ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    : "bg-muted text-foreground hover:bg-muted/80"
                }`}
            >
              {cat}
            </button>
          );
        })}
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
                    src={
                      prod.image.startsWith("/uploads")
                        ? prod.image
                        : `/uploads/${prod.image}`
                    }
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
      <Testimonials/>
      <FAQs/>
      <Footer/>
      
    </div>
  );
}

function formatKES(amount: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "KES",
  }).format(amount);
}
