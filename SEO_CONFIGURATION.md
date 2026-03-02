# SEO Configuration Guide for Dukafiy

This document outlines the comprehensive SEO optimization strategy implemented for the Dukafiy ecommerce platform.

## Overview

The SEO implementation includes:
- Meta tags and Open Graph optimization
- Structured data (Schema.org) for products
- Dynamic sitemap generation
- Robots.txt configuration
- Canonical URLs
- Image optimization
- Core Web Vitals optimization

## Environment Variables

Add the following environment variables to your `.env.local` or hosting platform:

```bash
# Site URL (required for SEO)
NEXT_PUBLIC_SITE_URL=https://yourdomain.com

# Google Search Console verification (optional)
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=your-verification-code
```

## SEO Features Implemented

### 1. App Router Metadata (src/app/layout.tsx)

Comprehensive metadata configuration including:
- Title templates
- Description and keywords
- Open Graph tags
- Twitter Cards
- Robots directives
- Canonical URLs
- Language and region settings

### 2. SEO Component (src/components/SEO.tsx)

Reusable SEO component for pages router with:
- Dynamic meta tags
- Open Graph integration
- Twitter Card support
- Structured data (JSON-LD)
- Breadcrumb generation
- Product schema generation

### 3. Public Pages SEO

All public-facing pages now have SEO optimization:

#### Shop Page (`/shop`)
- Title: "Shop | Dukafiy"
- Description optimized for category browsing
- Breadcrumb navigation

#### Product Detail Page (`/shop/[slug]`)
- Dynamic title with product name
- Product description with category and brand
- Product schema structured data
- Dynamic Open Graph images
- Breadcrumb with category hierarchy

#### Cart Page (`/cart`)
- Title: "Shopping Cart | Dukafiy"
- No-index directive (prevents search indexing)
- Breadcrumb navigation

#### Auth Pages (`/auth/login`, `/auth/register`)
- No-index directive
- Basic SEO metadata

### 4. Dynamic Sitemap (src/pages/api/sitemap.xml.ts)

Automatically generates sitemap.xml including:
- Static pages (Home, Shop, Cart, Auth)
- All active product pages
- Last modified dates
- Priority and change frequency

Access at: `https://yourdomain.com/api/sitemap.xml`

### 5. Robots.txt (public/robots.txt)

Configured to:
- Allow indexing of public pages
- Block admin routes
- Block API routes
- Reference sitemap location

### 6. Next.js Configuration (next.config.ts)

SEO-optimized settings:
- Image optimization with WebP/AVIF support
- i18n configuration
- Compression enabled
- Security headers
- Performance optimizations

## Structured Data (Schema.org)

Implemented schemas:

### Organization Schema
```json
{
  "@type": "Organization",
  "name": "Dukafiy",
  "url": "https://dukafiy.com",
  "logo": "https://dukafiy.com/logo.png",
  "contactPoint": {...}
}
```

### WebSite Schema
```json
{
  "@type": "WebSite",
  "name": "Dukafiy",
  "url": "https://dukafiy.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://dukafiy.com/shop?search={search_term_string}"
  }
}
```

### Product Schema
```json
{
  "@type": "Product",
  "name": "Product Name",
  "description": "Product description",
  "image": "https://dukafiy.com/product-image.jpg",
  "sku": "product-id",
  "brand": {...},
  "offers": {
    "@type": "Offer",
    "price": "1000",
    "priceCurrency": "KES",
    "availability": "https://schema.org/InStock"
  }
}
```

### BreadcrumbList Schema
Automatically generated for navigation pages.

## Google Search Console Setup

1. **Verify Ownership**:
   - Add your domain to Google Search Console
   - Use HTML tag verification
   - Add the verification code to `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`

2. **Submit Sitemap**:
   - Go to Sitemaps section
   - Submit: `https://yourdomain.com/api/sitemap.xml`

3. **Monitor Performance**:
   - Track indexing status
   - Monitor Core Web Vitals
   - Check mobile usability

## Bing Webmaster Tools Setup

1. Add your site to Bing Webmaster Tools
2. Submit sitemap URL
3. Verify ownership

## Best Practices Implemented

1. **Meta Tags**:
   - Unique titles for each page
   - Descriptive meta descriptions (150-160 characters)
   - Relevant keywords

2. **Open Graph**:
   - OG image (1200x630px)
   - Site name and type
   - Locale settings (en_KE)

3. **Technical SEO**:
   - Canonical URLs
   - XML sitemap
   - Robots.txt
   - HTTPS enforcement
   - Mobile-friendly design

4. **Performance**:
   - Image optimization
   - Next.js automatic optimization
   - Code splitting
   - Lazy loading

## Image SEO

- All images use Next.js Image component
- Proper alt text included
- WebP/AVIF format support
- Responsive images
- Priority loading for above-fold images

## Monitoring & Maintenance

### Regular Tasks:
1. Monitor Google Search Console for errors
2. Check Core Web Vitals scores
3. Update sitemap when adding new products
4. Review and update meta descriptions

### Tools:
- Google Search Console
- Google PageSpeed Insights
- Bing Webmaster Tools
- Schema.org Validator

## Testing SEO Implementation

1. **Meta Tags**: Use browser dev tools to inspect `<head>`
2. **Structured Data**: Test with [Google Rich Results Test](https://search.google.com/test/rich-results)
3. **Sitemap**: Validate at [XML-Sitemaps.com](https://www.xml-sitemaps.com/validate-xml-sitemap.html)
4. **Robots.txt**: Test with [Google Robots Testing Tool](https://support.google.com/webmasters/answer/6062598)

## Troubleshooting

### Common Issues:

1. **Meta tags not showing**:
   - Check if SEO component is properly imported
   - Verify no conflicting Head components

2. **Sitemap errors**:
   - Ensure `NEXT_PUBLIC_SITE_URL` is set
   - Check database connection

3. **Structured data not detected**:
   - Validate JSON-LD syntax
   - Check Schema.org type compatibility

## Future Enhancements

Consider adding:
- FAQ schema for FAQs component
- Review/Rating schema when reviews feature is added
- Article schema for blog posts
- LocalBusiness schema with physical location
- Video schema if product videos are added

## Support

For SEO-related issues:
1. Check environment variables
2. Verify site URL configuration
3. Test in Google Search Console
4. Review structured data validation

---

**Last Updated**: March 2026
**Maintained by**: Alex Njoroge




I've implemented a comprehensive SEO optimization strategy for the Dukafiy ecommerce platform. Here's a summary of what was done:

## Files Created/Modified

### New Files Created:
1. **[`src/components/SEO.tsx`](src/components/SEO.tsx)** - Reusable SEO component for pages router with:
   - Dynamic meta tags (title, description, keywords)
   - Open Graph and Twitter Card support
   - Canonical URLs
   - JSON-LD structured data
   - Breadcrumb generation
   - Product schema helper functions

2. **[`src/pages/api/sitemap.xml.ts`](src/pages/api/sitemap.xml.ts)** - Dynamic sitemap API that:
   - Generates XML sitemap automatically
   - Includes all static pages and active products
   - Updates with last modified dates
   - Caches for 1 hour

3. **[`public/robots.txt`](public/robots.txt)** - Robots configuration:
   - Allows public pages indexing
   - Blocks admin and API routes
   - References sitemap location

4. **[`SEO_CONFIGURATION.md`](SEO_CONFIGURATION.md)** - Comprehensive documentation for SEO setup and maintenance

### Modified Files:

1. **[`src/app/layout.tsx`](src/app/layout.tsx)** - Updated with comprehensive metadata:
   - Site title and description
   - Open Graph and Twitter cards
   - Robots directives
   - Canonical URLs
   - Kenya-specific geo targeting

2. **[`next.config.ts`](next.config.ts)** - Enhanced with:
   - Image optimization (WebP/AVIF)
   - i18n configuration
   - Performance optimizations
   - Security headers

3. **[`src/pages/shop.tsx`](src/pages/shop.tsx)** - Added SEO with breadcrumb navigation

4. **[`src/pages/shop/[slug].tsx`](src/pages/shop/[slug].tsx)** - Added:
   - Dynamic product meta tags
   - Product structured data
   - Dynamic Open Graph images
   - Breadcrumb hierarchy

5. **[`src/pages/cart.tsx`](src/pages/cart.tsx)** - Added SEO with no-index directive

6. **[`src/pages/auth/login.tsx`](src/pages/auth/login.tsx)** - Added SEO with no-index

7. **[`src/pages/auth/register.tsx`](src/pages/auth/register.tsx)** - Added SEO with no-index

## Key SEO Features Implemented

### 1. Meta Tags & Open Graph
- Unique titles and descriptions for each page
- Open Graph tags for social sharing (1200x630 images)
- Twitter Cards integration
- Kenya locale optimization (en_KE)

### 2. Structured Data (Schema.org)
- Organization schema with contact info
- WebSite schema with search action
- Product schema with pricing, availability, and brand
- BreadcrumbList for navigation

### 3. Technical SEO
- Dynamic XML sitemap at `/api/sitemap.xml`
- Robots.txt with proper crawl directives
- Canonical URLs to prevent duplicate content
- HTTPS enforcement via headers

### 4. Performance Optimization
- Image optimization with Next.js Image component
- WebP/AVIF format support
- Compression enabled
- Core Web Vitals optimization

## Environment Setup Required

Add to your `.env.local`:
```bash
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=your-code (optional)
```

## Next Steps

1. Add your domain to Google Search Console
2. Submit the sitemap: `https://yourdomain.com/api/sitemap.xml`
3. Upload an OG image to `/public/og-image.jpg` (1200x630px)
4. Monitor performance in Search Console

The system is now fully SEO-optimized and ready to rank higher on Google searches for Kenya-focused ecommerce queries.