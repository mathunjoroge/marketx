import { generateStructuredAdvice } from '../src/lib/ai/gemini';
import { PrismaClient } from '@prisma/client';

// Mock dependencies
const prisma = new PrismaClient();

async function main() {
    console.log('Testing AI Advisor Integration...');

    // 1. Fetch products
    const products = await prisma.affiliateProduct.findMany({
        where: { isActive: true },
        take: 5
    });
    console.log(`Fetched ${products.length} products from DB.`);

    if (products.length === 0) {
        console.error('No products found. Seeding failed?');
        process.exit(1);
    }

    // 2. Mock Context
    const context = {
        financials: {
            totalCash: 5000,
            monthlyIncome: 3000,
            debt: 10000
        },
        userProfile: {
            riskTolerance: 'MEDIUM'
        }
    };

    // 3. Call AI Service (or Mock if no key)
    console.log('Calling generateStructuredAdvice...');
    try {
        const advice = await generateStructuredAdvice(context, products);

        console.log('Advice Generated:');
        console.log('Summary:', advice.summary);
        console.log('Product Suggestions:', advice.productSuggestions?.length);

        if (advice.productSuggestions && advice.productSuggestions.length > 0) {
            console.log('First Suggestion:', advice.productSuggestions[0].name);
            console.log('Reason:', advice.productSuggestions[0].reason);
            console.log('SUCCESS: Product suggestions returned.');
        } else {
            console.warn('WARNING: No product suggestions returned. This might be expected if AI decided none are relevant, or if using mock data without products.');
        }

    } catch (e) {
        console.error('Error generating advice:', e);
        process.exit(1);
    }
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
