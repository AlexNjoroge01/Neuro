import Head from "next/head";
import { useRouter } from "next/router";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  ogType?: "website" | "product" | "article" | "profile";
  twitterCard?: "summary" | "summary_large_image";
  canonical?: string;
  noIndex?: boolean;
  structuredData?: object | object[];
  breadcrumbs?: { name: string; item: string }[];
}

const defaultSEO = {
  title: "Dukafiy - Premium Shopping Experience",
  description:
    "Shop premium quality products at Dukafiy. Your go-to platform for an unmatched shopping experience in Kenya. We sell lifestyle, not just products.",
  keywords: [
    "Dukafiy",
    "shopping",
    "Kenya",
    "premium products",
    "online store",
    "ecommerce",
    "beauty products",
    "skincare",
    "cosmetics",
  ],
  ogImage: "/og-image.jpg",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://dukafiy.com",
  twitterHandle: "@dukafiy",
};

export default function SEO({
  title,
  description,
  keywords = [],
  ogImage,
  ogType = "website",
  twitterCard = "summary_large_image",
  canonical,
  noIndex = false,
  structuredData,
  breadcrumbs,
}: SEOProps) {
  const router = useRouter();
  const currentUrl = `${defaultSEO.siteUrl}${router.asPath}`;
  const canonicalUrl = canonical || currentUrl;

  const pageTitle = title
    ? `${title} | Dukafiy`
    : defaultSEO.title;

  const pageDescription = description || defaultSEO.description;
  const pageKeywords = [...defaultSEO.keywords, ...keywords].join(", ");
  const pageOgImage = ogImage
    ? ogImage.startsWith("http")
      ? ogImage
      : `${defaultSEO.siteUrl}${ogImage}`
    : `${defaultSEO.siteUrl}${defaultSEO.ogImage}`;

  // Generate structured data scripts
  const generateStructuredData = () => {
    const scripts: object[] = [];

    // Organization schema
    scripts.push({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Dukafiy",
      url: defaultSEO.siteUrl,
      logo: `${defaultSEO.siteUrl}/logo.png`,
      description: defaultSEO.description,
      sameAs: [
        "https://facebook.com/dukafiy",
        "https://twitter.com/dukafiy",
        "https://instagram.com/dukafiy",
      ],
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+254-745-933-849",
        contactType: "customer service",
        availableLanguage: ["English", "Swahili"],
      },
    });

    // Website schema
    scripts.push({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Dukafiy",
      url: defaultSEO.siteUrl,
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${defaultSEO.siteUrl}/shop?search={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    });

    // BreadcrumbList schema
    if (breadcrumbs && breadcrumbs.length > 0) {
      scripts.push({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbs.map((crumb, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: crumb.name,
          item: crumb.item.startsWith("http")
            ? crumb.item
            : `${defaultSEO.siteUrl}${crumb.item}`,
        })),
      });
    }

    // Custom structured data
    if (structuredData) {
      if (Array.isArray(structuredData)) {
        scripts.push(...structuredData);
      } else {
        scripts.push(structuredData);
      }
    }

    return scripts.map((data, index) => (
      <script
        key={index}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(data),
        }}
      />
    ));
  };

  return (
    <Head>
      {/* Primary Meta Tags */}
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta name="keywords" content={pageKeywords} />
      <meta name="author" content="Dukafiy" />
      <meta name="robots" content={noIndex ? "noindex,nofollow" : "index,follow"} />
      <meta name="googlebot" content={noIndex ? "noindex,nofollow" : "index,follow"} />

      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content="Dukafiy" />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:image" content={pageOgImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:locale" content="en_KE" />

      {/* Twitter */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:site" content={defaultSEO.twitterHandle} />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={pageOgImage} />

      {/* Additional SEO Tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta httpEquiv="content-language" content="en" />
      <meta name="geo.region" content="KE" />
      <meta name="geo.placename" content="Nairobi" />

      {/* Structured Data */}
      {generateStructuredData()}
    </Head>
  );
}

// Helper function to generate product structured data
export function generateProductSchema(product: {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string | null;
  category?: string | null;
  brand?: string | null;
  slug: string;
  availability?: "InStock" | "OutOfStock" | "PreOrder";
  rating?: number;
  reviewCount?: number;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://dukafiy.com";

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description:
      product.description ||
      `Buy ${product.name} at Dukafiy. Premium quality guaranteed.`,
    image: product.image
      ? product.image.startsWith("http")
        ? product.image
        : `${siteUrl}${product.image.startsWith("/uploads") ? product.image : `/uploads/${product.image}`}`
      : `${siteUrl}/og-image.jpg`,
    sku: product.id,
    brand: {
      "@type": "Brand",
      name: product.brand || "Dukafiy",
    },
    category: product.category || "General",
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/shop/${product.slug}`,
      priceCurrency: "KES",
      price: product.price.toString(),
      availability: `https://schema.org/${product.availability || "InStock"}`,
      seller: {
        "@type": "Organization",
        name: "Dukafiy",
      },
    },
    ...(product.rating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: product.rating.toString(),
        reviewCount: product.reviewCount?.toString() || "0",
      },
    }),
  };
}

// Helper function to generate breadcrumb data for shop pages
export function generateShopBreadcrumbs(
  category?: string,
  productName?: string,
  productSlug?: string
) {
  const breadcrumbs = [{ name: "Home", item: "/" }];

  if (category) {
    breadcrumbs.push({ name: category, item: `/shop?category=${encodeURIComponent(category)}` });
  } else {
    breadcrumbs.push({ name: "Shop", item: "/shop" });
  }

  if (productName && productSlug) {
    breadcrumbs.push({ name: productName, item: `/shop/${productSlug}` });
  }

  return breadcrumbs;
}
