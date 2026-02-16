import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const hashedPassword = await bcrypt.hash('Admin123!', 12);
    const userPassword = await bcrypt.hash('User123!', 12);

    // ── Super Admin ──────────────────────────────────────────
    const superAdmin = await prisma.user.upsert({
        where: { email: 'admin@marketx.com' },
        update: { role: 'SUPER_ADMIN', password: hashedPassword, name: 'Super Admin' },
        create: {
            email: 'admin@marketx.com',
            password: hashedPassword,
            name: 'Super Admin',
            role: 'SUPER_ADMIN',
            settings: { create: { defaultRiskPercent: 1.0, theme: 'dark' } },
            watchlists: { create: { name: 'Admin Watchlist', symbols: ['AAPL', 'TSLA', 'SPY', 'BTC/USD'] } },
        },
    });

    // ── Market Admin ─────────────────────────────────────────
    const marketAdmin = await prisma.user.upsert({
        where: { email: 'market@marketx.com' },
        update: { role: 'MARKET_ADMIN', password: hashedPassword, name: 'Market Admin' },
        create: {
            email: 'market@marketx.com',
            password: hashedPassword,
            name: 'Market Admin',
            role: 'MARKET_ADMIN',
            settings: { create: { defaultRiskPercent: 2.0, theme: 'dark' } },
            watchlists: { create: { name: 'Market Watch', symbols: ['MSFT', 'GOOGL', 'AMZN'] } },
        },
    });

    // ── Compliance Officer ───────────────────────────────────
    const complianceOfficer = await prisma.user.upsert({
        where: { email: 'compliance@marketx.com' },
        update: { role: 'COMPLIANCE_OFFICER', password: hashedPassword, name: 'Compliance Officer' },
        create: {
            email: 'compliance@marketx.com',
            password: hashedPassword,
            name: 'Compliance Officer',
            role: 'COMPLIANCE_OFFICER',
            settings: { create: { defaultRiskPercent: 0.5, theme: 'dark' } },
        },
    });

    // ── Support Agent ────────────────────────────────────────
    const supportAgent = await prisma.user.upsert({
        where: { email: 'support@marketx.com' },
        update: { role: 'SUPPORT_AGENT', password: hashedPassword, name: 'Support Agent' },
        create: {
            email: 'support@marketx.com',
            password: hashedPassword,
            name: 'Support Agent',
            role: 'SUPPORT_AGENT',
            settings: { create: { defaultRiskPercent: 1.0, theme: 'dark' } },
        },
    });

    // ── Regular Users ────────────────────────────────────────
    const alice = await prisma.user.upsert({
        where: { email: 'alice@example.com' },
        update: { password: userPassword, name: 'Alice Trader' },
        create: {
            email: 'alice@example.com',
            password: userPassword,
            name: 'Alice Trader',
            role: 'USER',
            settings: { create: { defaultRiskPercent: 1.5, theme: 'dark' } },
            watchlists: {
                create: [
                    { name: 'Tech Stocks', symbols: ['AAPL', 'MSFT', 'GOOGL', 'META', 'NVDA'] },
                    { name: 'Crypto', symbols: ['BTC/USD', 'ETH/USD', 'SOL/USD'] },
                ],
            },
        },
    });

    const bob = await prisma.user.upsert({
        where: { email: 'bob@example.com' },
        update: { password: userPassword, name: 'Bob Investor' },
        create: {
            email: 'bob@example.com',
            password: userPassword,
            name: 'Bob Investor',
            role: 'USER',
            settings: { create: { defaultRiskPercent: 2.0, theme: 'dark', maxPositionSize: 15.0 } },
            watchlists: {
                create: { name: 'Value Picks', symbols: ['BRK.B', 'JPM', 'V', 'JNJ'] },
            },
        },
    });

    const charlie = await prisma.user.upsert({
        where: { email: 'charlie@example.com' },
        update: { password: userPassword, name: 'Charlie DayTrader' },
        create: {
            email: 'charlie@example.com',
            password: userPassword,
            name: 'Charlie DayTrader',
            role: 'USER',
            settings: { create: { defaultRiskPercent: 3.0, theme: 'dark', maxPortfolioHeat: 30.0 } },
        },
    });

    // ── Sample Trades (for Alice & Bob) ──────────────────────
    const sampleTrades = [
        // Alice's trades
        { userId: alice.id, symbol: 'AAPL', qty: 10, entryPrice: 178.50, exitPrice: 185.20, pnl: 67.0, pnlPercent: 3.75, side: 'LONG' as const, status: 'CLOSED' as const, exitReason: 'TAKE_PROFIT' as const, entryTime: new Date('2026-02-01'), exitTime: new Date('2026-02-05'), notes: 'Earnings play, solid beat' },
        { userId: alice.id, symbol: 'TSLA', qty: 5, entryPrice: 245.00, exitPrice: 238.00, pnl: -35.0, pnlPercent: -2.86, side: 'LONG' as const, status: 'CLOSED' as const, exitReason: 'STOP_LOSS' as const, entryTime: new Date('2026-02-03'), exitTime: new Date('2026-02-04'), notes: 'Stopped out on weakness' },
        { userId: alice.id, symbol: 'NVDA', qty: 8, entryPrice: 720.00, side: 'LONG' as const, status: 'OPEN' as const, entryTime: new Date('2026-02-10') },
        { userId: alice.id, symbol: 'META', qty: 12, entryPrice: 485.00, exitPrice: 510.00, pnl: 300.0, pnlPercent: 5.15, side: 'LONG' as const, status: 'CLOSED' as const, exitReason: 'MANUAL' as const, entryTime: new Date('2026-02-06'), exitTime: new Date('2026-02-12') },
        // Bob's trades
        { userId: bob.id, symbol: 'JPM', qty: 20, entryPrice: 195.00, exitPrice: 202.50, pnl: 150.0, pnlPercent: 3.85, side: 'LONG' as const, status: 'CLOSED' as const, exitReason: 'TAKE_PROFIT' as const, entryTime: new Date('2026-01-20'), exitTime: new Date('2026-02-01'), notes: 'Banking sector recovery' },
        { userId: bob.id, symbol: 'V', qty: 15, entryPrice: 280.00, side: 'LONG' as const, status: 'OPEN' as const, entryTime: new Date('2026-02-08') },
        { userId: bob.id, symbol: 'BRK.B', qty: 5, entryPrice: 410.00, exitPrice: 425.00, pnl: 75.0, pnlPercent: 3.66, side: 'LONG' as const, status: 'CLOSED' as const, exitReason: 'MANUAL' as const, entryTime: new Date('2026-01-15'), exitTime: new Date('2026-02-10') },
        // Charlie's trades
        { userId: charlie.id, symbol: 'SPY', qty: 50, entryPrice: 498.50, exitPrice: 501.20, pnl: 135.0, pnlPercent: 0.54, side: 'LONG' as const, status: 'CLOSED' as const, exitReason: 'TAKE_PROFIT' as const, entryTime: new Date('2026-02-13'), exitTime: new Date('2026-02-13'), notes: 'Quick scalp' },
        { userId: charlie.id, symbol: 'QQQ', qty: 30, entryPrice: 432.00, exitPrice: 428.00, pnl: -120.0, pnlPercent: -0.93, side: 'LONG' as const, status: 'CLOSED' as const, exitReason: 'STOP_LOSS' as const, entryTime: new Date('2026-02-14'), exitTime: new Date('2026-02-14') },
        { userId: charlie.id, symbol: 'AMD', qty: 25, entryPrice: 165.00, side: 'SHORT' as const, status: 'OPEN' as const, entryTime: new Date('2026-02-15') },
    ];

    for (const trade of sampleTrades) {
        await prisma.trade.create({ data: trade });
    }

    console.log('✅ Seed complete!\n');
    console.log('── Admin Accounts (password: Admin123!) ──');
    console.log(`  Super Admin:        ${superAdmin.email}  (${superAdmin.role})`);
    console.log(`  Market Admin:       ${marketAdmin.email}  (${marketAdmin.role})`);
    console.log(`  Compliance Officer: ${complianceOfficer.email}  (${complianceOfficer.role})`);
    console.log(`  Support Agent:      ${supportAgent.email}  (${supportAgent.role})`);
    console.log('\n── User Accounts (password: User123!) ──');
    console.log(`  Alice:   ${alice.email}  (${alice.role}) — 4 trades, 2 watchlists`);
    console.log(`  Bob:     ${bob.email}  (${bob.role}) — 3 trades, 1 watchlist`);
    console.log(`  Charlie: ${charlie.email}  (${charlie.role}) — 3 trades`);
}

main()
    .catch((e) => {
        console.error('Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
