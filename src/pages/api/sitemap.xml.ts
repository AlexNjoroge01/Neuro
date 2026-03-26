import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://dukafiy.com";

interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: string;
  priority: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Static pages
    const staticPages: SitemapUrl[] = [
      {
        loc: `${BASE_URL}/`,
        lastmod: new Date().toISOString(),
        changefreq: "daily",
        priority: "1.0",
      },
      {
        loc: `${BASE_URL}/shop`,
        lastmod: new Date().toISOString(),
        changefreq: "daily",
        priority: "0.9",
      },
      {
        loc: `${BASE_URL}/cart`,
        lastmod: new Date().toISOString(),
        changefreq: "weekly",
        priority: "0.6",
      },
      {
        loc: `${BASE_URL}/auth/login`,
        lastmod: new Date().toISOString(),
        changefreq: "monthly",
        priority: "0.4",
      },
      {
        loc: `${BASE_URL}/auth/register`,
        lastmod: new Date().toISOString(),
        changefreq: "monthly",
        priority: "0.4",
      },
    ];

    // Fetch all active products
    const products = await prisma.product.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        slug: true,
        updatedAt: true,
      },
    });

    // Product pages
    const productPages: SitemapUrl[] = products
      .filter((product) => product.slug)
      .map((product) => ({
        loc: `${BASE_URL}/shop/${product.slug}`,
        lastmod: product.updatedAt.toISOString(),
        changefreq: "weekly",
        priority: "0.8",
      }));

    // Combine all URLs
    const allUrls = [...staticPages, ...productPages];

    // Generate XML
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (url) => `  <url>
    <loc>${escapeXml(url.loc)}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

    // Set headers
    res.setHeader("Content-Type", "application/xml");
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");

    res.status(200).send(sitemap);
  } catch (error) {
    console.error("Error generating sitemap:", error);
    res.status(500).json({ error: "Failed to generate sitemap" });
  }
}

// Helper function to escape XML special characters
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&" + "amp;")
    .replace(/</g, "&" + "lt;")
    .replace(/>/g, "&" + "gt;")
    .replace(/"/g, "&" + "quot;")
    .replace(/'/g, "&" + "apos;");
}
