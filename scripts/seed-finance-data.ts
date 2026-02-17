import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ADMIN_EMAIL = 'admin@marketx.com';

async function main() {
    console.log('--- Financial Data Seeding Script ---');

    // 1. Find the admin user
    const user = await prisma.user.findUnique({
        where: { email: ADMIN_EMAIL }
    });

    if (!user) {
        console.error(`User ${ADMIN_EMAIL} not found. Please ensure the admin user exists.`);
        return;
    }

    const userId = user.id;
    console.log(`Found user: ${user.email} (ID: ${userId})`);

    // 2. Clean up existing data for this user
    console.log('Cleaning up existing finance data...');
    await prisma.transaction.deleteMany({ where: { userId } });
    await prisma.bankAccount.deleteMany({ where: { userId } });
    await prisma.goal.deleteMany({ where: { userId } });
    await prisma.budget.deleteMany({ where: { userId } });

    // 3. Create Bank Accounts
    console.log('Creating bank accounts...');
    const checking = await prisma.bankAccount.create({
        data: {
            userId,
            name: 'Primary Checking',
            type: 'CHECKING',
            balance: 4250.75,
            currency: 'USD',
            institution: 'Market Bank'
        }
    });

    const savings = await prisma.bankAccount.create({
        data: {
            userId,
            name: 'High-Yield Savings',
            type: 'SAVINGS',
            balance: 15400.00,
            currency: 'USD',
            institution: 'Global Trust'
        }
    });

    const credit = await prisma.bankAccount.create({
        data: {
            userId,
            name: 'Travel Credit Card',
            type: 'CREDIT',
            balance: -840.20,
            currency: 'USD',
            institution: 'Elite Cards'
        }
    });

    // 4. Create Budgets
    console.log('Creating budgets...');
    await prisma.budget.createMany({
        data: [
            { userId, category: 'Groceries', amount: 400, period: 'MONTHLY' },
            { userId, category: 'Dining', amount: 300, period: 'MONTHLY' },
            { userId, category: 'Utilities', amount: 150, period: 'MONTHLY' },
            { userId, category: 'Transport', amount: 200, period: 'MONTHLY' },
            { userId, category: 'Entertainment', amount: 100, period: 'MONTHLY' }
        ]
    });

    // 5. Create Transactions (Historical - Last 3 Months)
    console.log('Generating historical transactions...');
    const transactions = [];
    const now = new Date();

    // Loop for 3 months
    for (let m = 0; m < 3; m++) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - m, 15);

        // Income (Salary)
        transactions.push({
            userId,
            bankAccountId: checking.id,
            description: 'Monthly Salary',
            amount: 5500.00,
            type: 'INCOME',
            category: 'Salary',
            date: new Date(now.getFullYear(), now.getMonth() - m, 1)
        });

        // Fixed Expenses
        transactions.push({
            userId,
            bankAccountId: checking.id,
            description: 'Apartment Rent',
            amount: -1800.00,
            type: 'EXPENSE',
            category: 'Housing',
            date: new Date(now.getFullYear(), now.getMonth() - m, 2)
        });

        transactions.push({
            userId,
            bankAccountId: checking.id,
            description: 'City Utilities',
            amount: -125.40,
            type: 'EXPENSE',
            category: 'Utilities',
            date: new Date(now.getFullYear(), now.getMonth() - m, 5)
        });

        // Variable Expenses (Approx 4-5 per month)
        const categories = ['Groceries', 'Dining', 'Groceries', 'Transport', 'Entertainment'];
        const amounts = [85.20, 45.00, 92.15, 30.00, 60.00];

        for (let i = 0; i < categories.length; i++) {
            transactions.push({
                userId,
                bankAccountId: i % 2 === 0 ? checking.id : credit.id,
                description: `${categories[i]} Expense`,
                amount: -amounts[i],
                type: 'EXPENSE',
                category: categories[i],
                date: new Date(now.getFullYear(), now.getMonth() - m, 10 + (i * 3))
            });
        }
    }

    await prisma.transaction.createMany({ data: transactions });

    // 6. Create Goals
    console.log('Creating financial goals...');
    await prisma.goal.create({
        data: {
            userId,
            name: 'Emergency Fund',
            targetAmount: 10000.00,
            currentAmount: 6500.00,
            category: 'Savings',
            deadline: new Date(now.getFullYear() + 1, 0, 1)
        }
    });

    await prisma.goal.create({
        data: {
            userId,
            name: 'New Laptop',
            targetAmount: 2500.00,
            currentAmount: 2200.00,
            category: 'Electronics',
            deadline: new Date(now.getFullYear(), now.getMonth() + 2, 1)
        }
    });

    await prisma.goal.create({
        data: {
            userId,
            name: 'Summer Vacation',
            targetAmount: 5000.00,
            currentAmount: 400.00,
            category: 'Travel',
            deadline: new Date(now.getFullYear(), 7, 1)
        }
    });

    console.log('--- Seeding Completed Successfully ---');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
