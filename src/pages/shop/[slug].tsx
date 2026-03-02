import { trpc } from "@/utils/trpc";
import { useRouter } from "next/router";
import { useState } from "react";
import { useSession } from "next-auth/react";
import ClientNavbar from "@/components/ClientNavbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";
import SEO, {
  generateProductSchema,
  generateShopBreadcrumbs,
} from "@/components/SEO";

export default function ProductDetail() {
  const router = useRouter();
  const { slug } = router.query;
  const { status } = useSession();
  const utils = trpc.useUtils();
  const add = trpc.cart.add.useMutation({
    onSuccess: () => utils.cart.get.invalidate(),
  });
  const { data: rawProduct, isLoading } = trpc.products.publicGet.useQuery(
    typeof slug === "string" ? slug : "",
    { enabled: !!slug }
  );

  const [qty, setQty] = useState(1);
  const [selectedVariation, setSelectedVariation] = useState<string | null>(null);


  type ProductVariation = {
    id: string;
    name: string;
    image?: string | null;
  };


  type ProductWithVariations = {
    variations?: ProductVariation[];
  };


  const product = rawProduct as (typeof rawProduct & ProductWithVariations) | null;

  if (isLoading) return (
    <div className="min-h-screen bg-background">
      <ClientNavbar />
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="mt-4 text-muted-foreground">Loading product...</p>
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="min-h-screen bg-background">
      <ClientNavbar />
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <svg className="w-10 h-10 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Product Not Found</h2>
        <p className="text-muted-foreground mb-6">The product you're looking for doesn't exist or has been removed.</p>
        <Link
          href="/shop"
          className="inline-flex items-center px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Shop
        </Link>
      </div>
      <Footer />
    </div>
  );

  // Determine the currently displayed main image
  const selectedVar = product.variations?.find((v: ProductVariation) => v.id === selectedVariation);
  const mainImageSrc = selectedVar?.image
    ? selectedVar.image.startsWith('https://')
      ? selectedVar.image
      : selectedVar.image.startsWith("/uploads")
        ? selectedVar.image
        : `/uploads/${selectedVar.image}`
    : product.image
      ? product.image.startsWith('https://')
        ? product.image
        : product.image.startsWith("/uploads")
          ? product.image
          : `/uploads/${product.image}`
      : "";

  const gallery = [mainImageSrc, mainImageSrc, mainImageSrc, mainImageSrc].filter(Boolean);

  async function addToCart() {
    if (status !== "authenticated") {
      toast.error("Please login to add items to cart");
      const callbackUrl = typeof router.asPath === "string" ? router.asPath : `/shop/${slug}`;
      router.push(`/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      return;
    }
    if (!product) return;

    await add.mutateAsync({
      productId: product.id,
      delta: qty,
      variationId: selectedVariation || undefined
    });

    const itemName = selectedVariation
      ? product.variations?.find((v: ProductVariation) => v.id === selectedVariation)?.name
      : product.name;
    toast.success(`${itemName} added to cart!`);
  }

  const productSchema = generateProductSchema({
    id: product.id,
    name: product.name,
    price: product.price,
    image: mainImageSrc,
    category: product.category,
    brand: product.brand,
    slug: typeof slug === "string" ? slug : "",
    availability: product.stock > 0 ? "InStock" : "OutOfStock",
  });

  const breadcrumbs = generateShopBreadcrumbs(
    product.category || undefined,
    product.name,
    typeof slug === "string" ? slug : ""
  );

  return (
    <>
      <SEO
        title={product.name}
        description={`Buy ${product.name} at Dukafiy. ${
          product.category ? `Category: ${product.category}.` : ""
        } Premium quality guaranteed. Fast delivery in Kenya. Secure M-Pesa payments.`}
        keywords={[
          product.name,
          product.category || "",
          product.brand || "",
          "buy online",
          "Kenya",
          "shop",
        ].filter(Boolean)}
        ogImage={mainImageSrc || "/og-image.jpg"}
        ogType="product"
        structuredData={productSchema}
        breadcrumbs={breadcrumbs}
      />
    <div className="min-h-screen bg-background">
      <ClientNavbar />

      {/* Breadcrumb */}
      <div className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/shop" className="text-muted-foreground hover:text-foreground transition">
              Shop
            </Link>
            <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {product.category && (
              <>
                <span className="text-muted-foreground">{product.category}</span>
                <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </>
            )}
            <span className="text-foreground font-medium truncate max-w-[200px]">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Product Detail */}
      <div className="max-w-7xl mx-auto py-12 px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Left: Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted border border-border shadow-lg">
              {mainImageSrc ? (
                <Image
                  src={mainImageSrc}
                  alt={selectedVar?.name || product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                  <svg className="w-24 h-24 text-muted-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.stock > 0 ? (
                  <span className="px-3 py-1 rounded-full bg-green-500/90 text-white text-xs font-medium backdrop-blur-sm">
                    In Stock
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-red-500/90 text-white text-xs font-medium backdrop-blur-sm">
                    Out of Stock
                  </span>
                )}
              </div>
            </div>
            {/* Thumbnail Gallery */}
            <div className="grid grid-cols-4 gap-3">
              {gallery.slice(0, 4).map((img, idx) => (
                <button
                  key={idx}
                  className="relative aspect-square rounded-xl overflow-hidden border-2 border-transparent hover:border-primary transition bg-muted"
                >
                  {img ? (
                    <Image
                      src={img}
                      alt={`${product.name} view ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="25vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-8 h-8 text-muted-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Product Info */}
          <div className="flex flex-col">
            {/* Brand & Category */}
            <div className="flex items-center gap-3 mb-4">
              {product.brand && (
                <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                  {product.brand}
                </span>
              )}
              {product.category && (
                <span className="text-sm text-muted-foreground">
                  {product.category}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 leading-tight">
              {product.name}
            </h1>

            {/* Price */}
            <div className="flex items-baseline gap-4 mb-6">
              <span className="text-4xl font-bold text-primary">
                {formatKES(product.price)}
              </span>
              {product.stock <= 10 && product.stock > 0 && (
                <span className="text-sm text-orange-600 font-medium">
                  Only {product.stock} left
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-muted-foreground leading-relaxed mb-8">
              Experience premium quality with this exceptional product. Carefully selected for our collection,
              it offers outstanding value and performance. Perfect for those who appreciate quality craftsmanship.
            </p>

            {/* Variations */}
            {product.variations && product.variations.length > 0 ? (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-foreground mb-3">
                  Select Variant
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedVariation(null)}
                    className={`px-5 py-2.5 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${
                      selectedVariation === null
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    Default
                  </button>
                  {product.variations.map((variation: ProductVariation) => (
                    <button
                      key={variation.id}
                      onClick={() => setSelectedVariation(variation.id)}
                      className={`px-5 py-2.5 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${
                        selectedVariation === variation.id
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {variation.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              product.size && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-foreground mb-3">
                    Size
                  </label>
                  <div className="inline-flex px-5 py-2.5 rounded-xl border-2 border-primary bg-primary/5 text-primary text-sm font-medium">
                    {product.size}
                  </div>
                </div>
              )
            )}

            {/* Quantity */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-foreground mb-3">
                Quantity
              </label>
              <div className="inline-flex items-center gap-1 p-1.5 rounded-xl border border-border bg-card">
                <button
                  className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-muted transition disabled:opacity-50"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={qty <= 1}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <div className="w-14 text-center font-semibold text-lg">{qty}</div>
                <button
                  className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-muted transition disabled:opacity-50"
                  onClick={() => setQty((q) => q + 1)}
                  disabled={qty >= product.stock}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={addToCart}
                disabled={product.stock === 0}
                className="flex-1 inline-flex items-center justify-center px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-lg hover:bg-primary/90 transition-all duration-300 shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
              </button>
              <button className="inline-flex items-center justify-center px-6 py-4 rounded-xl border-2 border-border font-semibold text-lg hover:border-primary hover:bg-primary/5 transition-all duration-300">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                Wishlist
              </button>
            </div>

            {/* Trust Badges */}
            <div className="mt-10 pt-8 border-t border-border">
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-xs text-muted-foreground">Authentic</span>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-xs text-muted-foreground">Fast Delivery</span>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <span className="text-xs text-muted-foreground">Secure</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
