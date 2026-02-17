import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Affiliate Products...');

    const products = [
        {
            name: "High-Yield Savings Plus",
            category: "HIGH_YIELD_SAVINGS",
            provider: "Bank of Future",
            description: "Earn 4.5% APY with no monthly fees and no minimum balance.",
            affiliateUrl: "https://bankoffuture.com/signup?ref=marketx",
            minScore: 0,
            maxScore: 100,
            isActive: true,
        },
        {
            name: "Travel Elite Card",
            category: "CREDIT_CARD",
            provider: "Global Credit",
            description: "3x points on travel and dining. No foreign transaction fees.",
            affiliateUrl: "https://globalcredit.com/apply?ref=marketx",
            minScore: 700,
            maxScore: 850,
            isActive: true,
        },
        {
            name: "Debt Consolidated Loan",
            category: "DEBT_CONSOLIDATION",
            provider: "LendRight",
            description: "Consolidate high-interest debt into one low monthly payment.",
            affiliateUrl: "https://lendright.com/check-rate?ref=marketx",
            minScore: 600,
            maxScore: 750,
            isActive: true,
        },
        {
            name: "Robo-Advisor Pro",
            category: "INVESTMENT",
            provider: "WealthAutomate",
            description: "Automated investing with tax-loss harvesting and low fees.",
            affiliateUrl: "https://wealthautomate.com/start?ref=marketx",
            minScore: 0,
            maxScore: 100,
            isActive: true,
        }
    ];

    for (const p of products) {
        await prisma.affiliateProduct.upsert({
            where: { name: p.name },
            update: p,
            create: p,
        });
        console.log(`Upserted: ${p.name}`);
    }

    console.log('Seeding complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
