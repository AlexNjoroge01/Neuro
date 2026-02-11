import { PrismaClient } from '@prisma/client';
import { slugify } from "../src/utils/slugify";

const prisma = new PrismaClient();

async function main() {
    console.log("Starting slug migration...");

    const products = await prisma.product.findMany({
        where: {
            OR: [
                { slug: null },
                { slug: "" }
            ]
        }
    });

    console.log(`Found ${products.length} products to update.`);

    for (const product of products) {
        const slug = slugify(product.name);
        await prisma.product.update({
            where: { id: product.id },
            data: { slug }
        });
        console.log(`Updated: ${product.name} -> ${slug}`);
    }

    console.log("Migration complete!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
