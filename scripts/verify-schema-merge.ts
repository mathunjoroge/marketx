import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting verification of schema merge...');

    // 1. Create a User
    const email = `verify_${Date.now()}@example.com`;
    console.log(`Creating user: ${email}`);
    const user = await prisma.user.create({
        data: {
            email,
            password: 'hashed_password',
            name: 'Verification User',
            settings: {
                create: {
                    currency: 'USD',
                    budgetAlertEnabled: true // New field
                }
            }
        },
        include: { settings: true }
    });

    console.log(`User created: ${user.id}`);
    console.log('User Settings:', user.settings);

    // 2. Create a BankAccount (renamed from Account in fintech)
    console.log('Creating BankAccount...');
    const account = await prisma.bankAccount.create({
        data: {
            userId: user.id,
            name: 'Test Checking',
            type: 'CHECKING',
            balance: 1000.50,
            currency: 'USD'
        }
    });
    console.log(`BankAccount created: ${account.id}`);

    // 3. Create a Budget
    console.log('Creating Budget...');
    const budget = await prisma.budget.create({
        data: {
            userId: user.id,
            category: 'Food',
            amount: 500,
            period: 'MONTHLY'
        }
    });
    console.log(`Budget created: ${budget.id}`);

    // 4. Create a Transaction linked to BankAccount
    console.log('Creating Transaction...');
    const transaction = await prisma.transaction.create({
        data: {
            userId: user.id,
            bankAccountId: account.id,
            amount: -50.00,
            category: 'Food',
            description: 'Grocery Store',
            type: 'EXPENSE'
        }
    });
    console.log(`Transaction created: ${transaction.id}`);

    // 5. Verify Relations
    const userWithData = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
            bankAccounts: true,
            budgets: true,
            transactions: true
        }
    });

    if (userWithData?.bankAccounts.length === 1 &&
        userWithData?.budgets.length === 1 &&
        userWithData?.transactions.length === 1) {
        console.log('SUCCESS: All relations verified correctly.');
    } else {
        console.error('FAILURE: Relations missing.', userWithData);
        process.exit(1);
    }

    // Cleanup
    console.log('Cleaning up...');
    await prisma.transaction.delete({ where: { id: transaction.id } });
    await prisma.budget.delete({ where: { id: budget.id } });
    await prisma.bankAccount.delete({ where: { id: account.id } });
    await prisma.user.delete({ where: { id: user.id } });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
