"use client";
import { trpc } from "@/utils/trpc";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import ClientNavbar from "@/components/ClientNavbar";
import Image from "next/image";
import Footer from "@/components/Footer";
import FAQs from "@/components/FAQs";
import Testimonials from "@/components/Testimonials";
import SidebarLayout from "@/components/Layout";
import { useSession } from "next-auth/react";

export default function ShopPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPERUSER";
  const { data: products, isLoading } = trpc.products.publicList.useQuery();
  const [selectedCategory, setSelectedCategory] = useState<string | null>("All");

  // Background carousel setup
  const images = ["/b4.jpg", "/c1.jpg", "/c2.jpg", "/c3.jpg"];
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [images.length]);

  // Extract unique categories
  const categories = useMemo(() => {
    if (!products) return ["All"];
    const unique = Array.from(
      new Set(products.map((p) => p.category).filter(Boolean))
    );
    return ["All", ...unique];
  }, [products]);

  // Group products by category
  const groupedProducts = useMemo(() => {
    if (!products) return {};
    const groups: Record<string, typeof products> = {};
    products.forEach((p) => {
      const cat = p.category || "Uncategorized";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    });
    return groups;
  }, [products]);

  const shopContent = (
    <>
      {/* Header Banner - Now Full Width & Fully Responsive */}
      <div className="relative w-full mt-10 mb-10 overflow-hidden shadow-sm">
        {images.map((img, index) => (
          <Image
            key={img}
            src={img}
            alt="Banner background"
            fill
            quality={95}
            className={`object-cover object-center absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentImage ? "opacity-100" : "opacity-0"
              }`}
            priority={index === 0}
          />
        ))}

        <div className="absolute inset-0 bg-secondary/40" />

        <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <div className="flex flex-col items-start gap-8 text-left">
            <div className="max-w-2xl">
              <h2 className="text-4xl font-bold tracking-tight text-primary drop-shadow-lg sm:text-5xl lg:text-6xl">
                Grab Upto 50% Off On <br />Selected Items
              </h2>
              <p className="mt-6 text-lg leading-8 text-white drop-shadow">
                Shop from premium quality brands. Limited time only.
              </p>
              <div className="mt-10">
                <Link
                  href="/shop"
                  className="bg-primary text-primary-foreground px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary/90 transition shadow-lg"
                >
                  Buy Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar - Full Width Container Alignment */}
      <div className="bg-muted/30 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-foreground mb-8">
            Category name
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`
                    flex items-center justify-center
                    h-20 sm:h-24
                    rounded-xl
                    bg-card
                    border border-border
                    shadow-sm
                    hover:shadow-lg
                    transition-all duration-200
                    text-sm sm:text-base font-medium
                    ${isSelected
                      ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/50"
                      : "text-foreground hover:bg-accent hover:text-accent-foreground"
                    }
                  `}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Products by Category — Full Width Responsive Grid */}
      <div className="max-w-7xl mx-auto space-y-16 px-6">
        {isLoading ? (
          <div className="text-center py-20 text-muted-foreground">Loading products...</div>
        ) : (
          Object.entries(groupedProducts).map(([category, items]) => {
            if (selectedCategory !== "All" && selectedCategory !== category)
              return null;

            return (
              <section key={category} className="space-y-6">
                <h2 className="text-3xl font-bold text-foreground border-b border-border pb-3">
                  {category}
                </h2>

                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {items.map((prod) => {
                    // Handle both Cloudinary URLs (https://) and legacy /uploads/ paths
                    const imageSrc = prod.image
                      ? prod.image.startsWith('https://')
                        ? prod.image
                        : prod.image.startsWith("/uploads")
                          ? prod.image
                          : `/uploads/${prod.image}`
                      : "";

                    return (
                      <div
                        key={prod.id}
                        className="group bg-secondary rounded-lg p-5 shadow-lg hover:shadow-xl transition-all border border-border flex flex-col cursor-pointer"
                      >
                        <Link href={`/shop/${prod.id}`} className="flex flex-col h-full">
                          {/* ← PROPER NEXT/IMAGE IMPLEMENTATION */}
                          <div className="aspect-square rounded-lg mb-4 flex items-center justify-center overflow-hidden bg-transparent relative">
                            {imageSrc ? (
                              <Image
                                src={imageSrc}
                                alt={prod.name}
                                fill
                                className="object-contain group-hover:scale-105 transition"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                quality={85}
                              />
                            ) : (
                              <span className="text-gray-400 text-6xl">Headphones</span>
                            )}
                          </div>

                          <div className="flex-1">
                            <div className="text-xs mb-1 text-primary font-semibold uppercase tracking-wider">
                              {prod.brand || "Brand"}
                            </div>
                            <div className="font-bold text-lg mb-1 text-foreground line-clamp-2">
                              {prod.name}
                            </div>
                            <div className="text-xs text-white mb-1">
                              {prod.category || "Category"}
                            </div>
                          </div>
                          <div className="mt-2 mb-2 font-bold text-2xl text-primary">
                            {formatKES(prod.price ?? 0)}
                          </div>
                          <div className="text-sm text-white">
                            In Stock: <b className="text-white">{prod.stock}</b>
                          </div>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })
        )}
      </div>

      <Testimonials />
      <FAQs />
    </>
  );

  if (isAdmin) {
    return (
      <SidebarLayout>
        <div className="overflow-y-auto h-screen">
          {shopContent}
        </div>
      </SidebarLayout>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ClientNavbar />
      {shopContent}
      <Footer />
    </div>
  );
}

function formatKES(amount: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "KES",
  }).format(amount);
}