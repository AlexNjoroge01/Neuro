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
import SEO, { generateShopBreadcrumbs } from "@/components/SEO";

export default function ShopPage() {
  const { data: session, status } = useSession();
  const isAdmin =
    status === "authenticated" &&
    (session?.user?.role === "ADMIN" || session?.user?.role === "SUPERUSER");
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
      {/* Hero Banner - Elegant & Sophisticated */}
      <div className="relative w-full overflow-hidden">
        <div className="absolute inset-0">
          {images.map((img, index) => (
            <Image
              key={img}
              src={img}
              alt="Banner background"
              fill
              quality={95}
              className={`object-cover object-center transition-all duration-1000 ease-in-out ${
                index === currentImage ? "opacity-100 scale-100" : "opacity-0 scale-105"
              }`}
              priority={index === 0}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 py-32 sm:py-40 lg:px-8 lg:py-48">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-medium text-white/90">New Arrivals Available</span>
            </div>
            <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
              Discover
              <span className="block text-primary">Premium Quality</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-white/80 max-w-xl">
              Explore our curated collection of premium products. Handpicked for quality,
              designed for elegance, delivered with care.
            </p>
            <div className="mt-10 flex items-center gap-4">
              <Link
                href="#categories"
                className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-primary text-primary-foreground font-semibold text-lg hover:bg-primary/90 transition-all duration-300 shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5"
              >
                Shop Now
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Link>
              <Link
                href="#products"
                className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-white/10 backdrop-blur-sm text-white font-semibold text-lg border border-white/20 hover:bg-white/20 transition-all duration-300"
              >
                View Collection
              </Link>
            </div>
          </div>
        </div>

        {/* Carousel Indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImage(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentImage ? "w-8 bg-primary" : "bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Category Filter - Modern Pills */}
      <div id="categories" className="bg-gradient-to-b from-muted/50 to-background py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">Browse</span>
            <h2 className="text-3xl font-bold text-foreground mt-2">Shop by Category</h2>
            <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
              Find exactly what you're looking for from our carefully curated categories
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-6 py-3 rounded-full font-medium text-sm transition-all duration-300 ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105"
                      : "bg-card text-foreground border border-border hover:border-primary/50 hover:bg-accent"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Products Section - Elegant Cards */}
      <div id="products" className="max-w-7xl mx-auto px-6 py-12">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="mt-4 text-muted-foreground">Loading products...</p>
          </div>
        ) : (
          <div className="space-y-20">
            {Object.entries(groupedProducts).map(([category, items]) => {
              if (selectedCategory !== "All" && selectedCategory !== category)
                return null;

              return (
                <section key={category} className="scroll-mt-20">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">{category}</h2>
                      <div className="h-1 w-20 bg-primary rounded-full mt-2" />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {items.length} {items.length === 1 ? "product" : "products"}
                    </span>
                  </div>

                  <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {items.map((prod) => {
                      const imageSrc = prod.image
                        ? prod.image.startsWith('https://')
                          ? prod.image
                          : prod.image.startsWith("/uploads")
                            ? prod.image
                            : `/uploads/${prod.image}`
                        : "";

                      return (
                        <Link
                          key={prod.id}
                          href={`/shop/${prod.slug || prod.id}`}
                          className="group block"
                        >
                          <div className="relative bg-card rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
                            {/* Product Image */}
                            <div className="relative aspect-square overflow-hidden bg-muted">
                              {imageSrc ? (
                                <Image
                                  src={imageSrc}
                                  alt={prod.name}
                                  fill
                                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                  quality={85}
                                />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                                  <svg className="w-16 h-16 text-muted-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              )}
                              {/* Hover Overlay */}
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                              {/* Quick View Button */}
                              <div className="absolute bottom-4 left-4 right-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                <div className="bg-white/95 backdrop-blur-sm text-foreground text-center py-3 rounded-xl font-medium text-sm shadow-lg">
                                  View Details
                                </div>
                              </div>
                            </div>

                            {/* Product Info */}
                            <div className="p-5">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                                  {prod.brand || "Premium"}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {prod.category}
                                </span>
                              </div>
                              <h3 className="font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                                {prod.name}
                              </h3>
                              <div className="flex items-center justify-between pt-3 border-t border-border">
                                <span className="text-xl font-bold text-foreground">
                                  {formatKES(prod.price ?? 0)}
                                </span>
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-muted-foreground">
                                    {prod.stock > 0 ? "In Stock" : "Out of Stock"}
                                  </span>
                                  <div className={`w-2 h-2 rounded-full ${prod.stock > 0 ? "bg-green-500" : "bg-red-500"}`} />
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      {/* Features Section */}
      <div className="bg-muted/30 py-16 mt-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Authentic Products</h3>
                <p className="text-sm text-muted-foreground">100% genuine products from verified brands</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Fast Delivery</h3>
                <p className="text-sm text-muted-foreground">Quick and reliable shipping across Kenya</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Secure Payment</h3>
                <p className="text-sm text-muted-foreground">Safe M-Pesa and card payment options</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Testimonials />
      <FAQs />
    </>
  );

  if (isAdmin) {
    return (
      <>
        <SEO
          title="Shop"
          description="Browse our wide selection of premium products. Shop by category and find exactly what you need at Dukafiy Kenya."
          keywords={["shop", "products", "categories", "online shopping", "Kenya"]}
          breadcrumbs={generateShopBreadcrumbs()}
        />
        <SidebarLayout>
          <div className="overflow-y-auto h-screen">
            {shopContent}
          </div>
        </SidebarLayout>
      </>
    );
  }

  return (
    <>
      <SEO
        title="Shop"
        description="Browse our wide selection of premium products. Shop by category and find exactly what you need at Dukafiy Kenya."
        keywords={["shop", "products", "categories", "online shopping", "Kenya"]}
        breadcrumbs={generateShopBreadcrumbs()}
      />
      <div className="min-h-screen bg-background">
        <ClientNavbar />
        {shopContent}
        <Footer />
      </div>
    </>
  );
}

function formatKES(amount: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "KES",
  }).format(amount);
}
