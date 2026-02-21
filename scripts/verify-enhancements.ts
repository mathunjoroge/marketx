// Test script for PII masking and Rate Limiting
import { rateLimit } from '@/lib/rate-limit';
import { generateStructuredAdvice } from '@/lib/ai/gemini';

async function testPIIMasking() {
    console.log('--- Testing PII Masking ---');
    const cases = [
        { desc: 'Payment to John Doe', expected: 'Payment to ****' },
        { desc: 'Salary from Alice Smith Corp', expected: 'Salary from **** Corp' },
        { desc: 'Monthly Rent - Bob Brown', expected: 'Monthly Rent - ****' },
        { desc: 'Refund for Jane Doe', expected: 'Refund for ****' },
        { desc: 'Coffee at Starbucks', expected: 'Coffee at Starbucks' }, // Should NOT mask as it is one word
        { desc: 'Amazon Marketplace Order', expected: 'Amazon Marketplace Order' }, // Should NOT mask as it's not a person name (usually)
    ];

    const testRegex = (desc: string) => desc.replace(/\b([A-Z][a-z]+ [A-Z][a-z]+)\b/g, '****');

    cases.forEach(c => {
        const masked = testRegex(c.desc);
        console.log(`Original: "${c.desc}" -> "${masked}" [${masked === c.expected ? 'PASS' : 'FAIL'}]`);
    });
}

async function testRateLimiting() {
    console.log('\n--- Testing Rate Limiting ---');
    const userId = 'test-user-' + Math.random().toString(36).substring(7);
    const limit = 2;
    const window = 60; // 1 minute

    for (let i = 1; i <= 3; i++) {
        const result = await rateLimit(`test:${userId}`, limit, window);
        console.log(`Call ${i}: Success=${result.success}, Remaining=${result.remaining}`);
    }
}

async function run() {
    await testPIIMasking();
    await testRateLimiting();
    process.exit(0);
}

run().catch(console.error);
