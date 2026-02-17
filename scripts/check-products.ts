import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const count = await prisma.affiliateProduct.count();
    console.log(`Affiliate Products: ${count}`);

    if (count > 0) {
        const products = await prisma.affiliateProduct.findMany({ take: 3 });
        console.log('Sample Products:', products);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
