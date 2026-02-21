import { prisma } from '@/lib/db/prisma';
import { getUserServicesById } from '@/lib/auth/credentials';
import logger from '@/lib/logger';
import { ExitReason, Trade as PrismaTrade } from '@prisma/client';
import { Order } from '@/lib/brokers/types';

export class OrderMonitorService {
    private static instance: OrderMonitorService;
    private isRunning: boolean = false;
    private pollInterval: NodeJS.Timeout | null = null;
    private readonly POLL_FREQUENCY = 10000; // 10 seconds

    private constructor() { }

    public static getInstance(): OrderMonitorService {
        if (!OrderMonitorService.instance) {
            OrderMonitorService.instance = new OrderMonitorService();
        }
        return OrderMonitorService.instance;
    }

    public startMonitoring() {
        if (this.isRunning) return;

        logger.info('Starting Order Monitor Service...');
        this.isRunning = true;
        this.poll(); // Initial run
        this.pollInterval = setInterval(() => this.poll(), this.POLL_FREQUENCY);
    }

    public stopMonitoring() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
        this.isRunning = false;
        logger.info('Stopped Order Monitor Service');
    }

    private async poll() {
        try {
            // Find users who have connected Alpaca credentials
            const credentials = await prisma.userCredentials.findMany({
                where: {
                    alpacaKeyId: { not: '' },
                    alpacaSecret: { not: '' }
                },
                select: { userId: true }
            });

            for (const cred of credentials) {
                await this.syncUserOrders(cred.userId);
            }

        } catch (error) {
            logger.error('Order Monitor Poll Error', { error });
        }
    }

    private async syncUserOrders(userId: string) {
        try {
            // Instantiate per-user broker using their decrypted credentials.
            // This ensures each user's orders come from their OWN Alpaca account,
            // not the system-level account.
            const { alpaca } = await getUserServicesById(userId);

            const closedOrders = await alpaca.getOrders({ status: 'closed', limit: 10 });

            for (const order of closedOrders) {
                if (order.status === 'filled') {
                    await this.processFilledOrder(userId, order);
                }
            }

        } catch (error) {
            logger.error(`Failed to sync orders for user`, { userId, error });
        }
    }

    private async processFilledOrder(userId: string, order: Order) {
        // Check if this order is already recorded as a trade entry or exit
        const existingEntry = await prisma.trade.findFirst({
            where: { entryOrderId: order.id }
        });

        if (existingEntry) {
            return; // Already recorded as an entry
        }

        const existingExit = await prisma.trade.findFirst({
            where: { exitOrderId: order.id }
        });

        if (existingExit) {
            return; // Already recorded as an exit
        }

        // Check if there's an open trade for this symbol that this order might close
        const openTrade = await prisma.trade.findFirst({
            where: {
                userId,
                symbol: order.symbol,
                status: 'OPEN'
            }
        });

        if (openTrade) {
            // If trade is LONG (bought), a SELL order closes it.
            // If trade is SHORT (sold), a BUY order closes it.
            const isClosing = (openTrade.side === 'LONG' && order.side === 'sell') ||
                (openTrade.side === 'SHORT' && order.side === 'buy');

            if (isClosing) {
                await this.closeTrade(openTrade, order);
                return;
            }
        }

        // No open trade to close — record as a new entry
        await this.createTrade(userId, order);
    }

    private async createTrade(userId: string, order: Order) {
        const entryPrice = parseFloat(order.filled_avg_price || order.limit_price || '0');
        const qty = parseFloat(order.filled_qty);

        await prisma.trade.create({
            data: {
                userId,
                symbol: order.symbol,
                qty,
                entryPrice,
                side: order.side === 'buy' ? 'LONG' : 'SHORT',
                status: 'OPEN',
                entryOrderId: order.id,
                entryTime: new Date(order.filled_at || new Date().toISOString())
            }
        });
        logger.info(`[OrderMonitor] Recorded ENTRY: ${order.symbol} (${order.side}) @ ${entryPrice}`);
    }

    private async closeTrade(trade: PrismaTrade, order: Order) {
        // Determine Exit Reason from Order Type
        let exitReason: ExitReason = ExitReason.MANUAL;

        if (order.type === 'trailing_stop') {
            exitReason = ExitReason.TRAILING_STOP;
        } else if (order.type === 'stop' || order.type === 'stop_limit') {
            exitReason = ExitReason.STOP_LOSS;
        } else if (order.type === 'limit') {
            // Heuristic: if limit exit price is better than entry, it's a take-profit
            const exitPrice = parseFloat(order.filled_avg_price || '0');
            if (trade.side === 'LONG' && exitPrice > trade.entryPrice) {
                exitReason = ExitReason.TAKE_PROFIT;
            } else if (trade.side === 'SHORT' && exitPrice < trade.entryPrice) {
                exitReason = ExitReason.TAKE_PROFIT;
            } else {
                exitReason = ExitReason.TAKE_PROFIT; // Conservative: bracket limit orders are generally TPs
            }
        }

        const exitPrice = parseFloat(order.filled_avg_price || '0');
        const exitTime = new Date(order.filled_at || new Date().toISOString());

        // Calculate P&L
        let pnl = 0;
        if (trade.side === 'LONG') {
            pnl = (exitPrice - trade.entryPrice) * trade.qty;
        } else {
            pnl = (trade.entryPrice - exitPrice) * trade.qty;
        }

        const pnlPercent = (pnl / (trade.entryPrice * trade.qty)) * 100;

        await prisma.trade.update({
            where: { id: trade.id },
            data: {
                status: 'CLOSED',
                exitPrice,
                exitTime,
                exitOrderId: order.id,
                exitReason,
                pnl,
                pnlPercent
            }
        });

        logger.info(`[OrderMonitor] Recorded EXIT: ${trade.symbol} via ${exitReason}. P&L: $${pnl.toFixed(2)} (${pnlPercent.toFixed(2)}%)`);
    }
}
