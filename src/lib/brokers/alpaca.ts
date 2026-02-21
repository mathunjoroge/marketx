import Alpaca from '@alpacahq/alpaca-trade-api';
import type {
    Order,
    Position,
    Account,
    OrderRequest,
    ClosePositionRequest,
    BracketOrderRequest,
    TrailingStopRequest
} from './types';

// Initialize default Alpaca client
const defaultAlpaca = new Alpaca({
    keyId: process.env.ALPACA_API_KEY_ID || '',
    secretKey: process.env.ALPACA_API_SECRET || '',
    paper: process.env.ALPACA_PAPER === 'true',
    usePolygon: false,
});

export interface AlpacaConfig {
    keyId: string;
    secretKey: string;
    paper?: boolean;
}

/**
 * Alpaca Broker Service
 * Handles all interactions with Alpaca Trading API
 */
export class AlpacaBrokerService {
    private client: Alpaca;

    constructor(config?: AlpacaConfig) {
        if (config) {
            this.client = new Alpaca({
                keyId: config.keyId,
                secretKey: config.secretKey,
                paper: config.paper !== false, // Default to true if not specified
                usePolygon: false,
            });
        } else {
            this.client = defaultAlpaca;
        }
    }
    /**
     * Get account information including cash, buying power, and portfolio value
     */
    async getAccount(): Promise<Account> {
        try {
            const account = await this.client.getAccount();
            return account as unknown as Account;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('Error fetching account:', error);
            throw new Error(`Failed to fetch account: ${errorMessage}`);
        }
    }

    /**
     * Get all open positions
     */
    async getPositions(): Promise<Position[]> {
        try {
            const positions = await this.client.getPositions();
            return positions as unknown as Position[];
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('Error fetching positions:', error);
            throw new Error(`Failed to fetch positions: ${errorMessage}`);
        }
    }

    /**
     * Get a specific position by symbol
     */
    async getPosition(symbol: string): Promise<Position | null> {
        try {
            const position = await this.client.getPosition(symbol);
            return position as unknown as Position;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            if (errorMessage.includes('position does not exist')) {
                return null;
            }
            console.error(`Error fetching position for ${symbol}:`, error);
            throw new Error(`Failed to fetch position: ${errorMessage}`);
        }
    }

    /**
     * Submit a new order
     */
    async submitOrder(orderRequest: OrderRequest): Promise<Order> {
        try {
            // Validate order
            this.validateOrder(orderRequest);

            const order = await this.client.createOrder({
                symbol: orderRequest.symbol,
                qty: orderRequest.qty,
                side: orderRequest.side,
                type: orderRequest.type,
                time_in_force: orderRequest.time_in_force || 'gtc',
                limit_price: orderRequest.limit_price,
                stop_price: orderRequest.stop_price,
                extended_hours: orderRequest.extended_hours || false,
                client_order_id: orderRequest.client_order_id,
            });

            return order as unknown as Order;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('Error submitting order:', error);
            throw new Error(`Failed to submit order: ${errorMessage}`);
        }
    }

    /**
     * Get all orders (with optional filters)
     */
    async getOrders(params?: {
        status?: 'open' | 'closed' | 'all';
        limit?: number;
        after?: string;
        until?: string;
        direction?: 'asc' | 'desc';
    }): Promise<Order[]> {
        try {
            // Explicitly cast to unknown and then to internal library type to avoid 'any'
            const orders = await this.client.getOrders({
                status: params?.status || 'all',
                limit: params?.limit || 100,
                after: params?.after,
                until: params?.until,
                direction: params?.direction || 'desc',
            } as unknown as Parameters<typeof this.client.getOrders>[0]);

            return orders as unknown as Order[];
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('Error fetching orders:', error);
            throw new Error(`Failed to fetch orders: ${errorMessage}`);
        }
    }

    /**
     * Get a specific order by ID
     */
    async getOrder(orderId: string): Promise<Order> {
        try {
            const order = await this.client.getOrder(orderId);
            return order as unknown as Order;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`Error fetching order ${orderId}:`, error);
            throw new Error(`Failed to fetch order: ${errorMessage}`);
        }
    }

    /**
     * Cancel an order
     */
    async cancelOrder(orderId: string): Promise<void> {
        try {
            await this.client.cancelOrder(orderId);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`Error canceling order ${orderId}:`, error);
            throw new Error(`Failed to cancel order: ${errorMessage}`);
        }
    }

    /**
     * Cancel all open orders
     */
    async cancelAllOrders(): Promise<void> {
        try {
            await this.client.cancelAllOrders();
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('Error canceling all orders:', error);
            throw new Error(`Failed to cancel all orders: ${errorMessage}`);
        }
    }

    /**
     * Close a position (or partial position)
     */
    async closePosition(request: ClosePositionRequest): Promise<Order> {
        try {
            interface ClosePositionOptions {
                qty?: number;
                percentage?: number;
            }
            const options: ClosePositionOptions = {};

            if (request.qty) {
                options.qty = request.qty;
            } else if (request.percentage) {
                options.percentage = request.percentage;
            }

            // The closePosition method on the Alpaca client might not be correctly typed in some versions
            // Using a safe cast to unknown then to a function to avoid 'any'
            const closePositionFn = (this.client as unknown as { closePosition: (symbol: string, options: ClosePositionOptions) => Promise<unknown> }).closePosition;
            const order = await closePositionFn.call(this.client, request.symbol, options);

            return order as unknown as Order;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`Error closing position for ${request.symbol}:`, error);
            throw new Error(`Failed to close position: ${errorMessage}`);
        }
    }

    /**
     * Close all positions
     */
    async closeAllPositions(): Promise<Order[]> {
        try {
            const orders = await this.client.closeAllPositions();
            return orders as unknown as Order[];
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('Error closing all positions:', error);
            throw new Error(`Failed to close all positions: ${errorMessage}`);
        }
    }

    /**
     * Validate order request
     */
    private validateOrder(orderRequest: OrderRequest): void {
        // Validate symbol
        if (!orderRequest.symbol || orderRequest.symbol.trim() === '') {
            throw new Error('Symbol is required');
        }

        // Validate quantity
        if (!orderRequest.qty || orderRequest.qty <= 0) {
            throw new Error('Quantity must be greater than 0');
        }

        // Validate side
        if (!['buy', 'sell'].includes(orderRequest.side)) {
            throw new Error('Side must be either "buy" or "sell"');
        }

        // Validate order type
        if (!['market', 'limit'].includes(orderRequest.type)) {
            throw new Error('Order type must be either "market" or "limit"');
        }

        // Validate limit price for limit orders
        if (orderRequest.type === 'limit' && (!orderRequest.limit_price || orderRequest.limit_price <= 0)) {
            throw new Error('Limit price is required for limit orders and must be greater than 0');
        }
    }

    /**
     * Check if market is open
     */
    async isMarketOpen(): Promise<boolean> {
        try {
            const clock = await this.client.getClock();
            return clock.is_open;
        } catch (error: unknown) {
            console.error('Error checking market status:', error);
            return false;
        }
    }

    /**
     * Get market calendar
     */
    async getCalendar(start?: string, end?: string): Promise<unknown[]> {
        try {
            const calendar = await this.client.getCalendar({ start, end });
            return calendar as unknown as unknown[];
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('Error fetching calendar:', error);
            throw new Error(`Failed to fetch calendar: ${errorMessage}`);
        }
    }
    /**
     * Submit a bracket order (entry + stop-loss + take-profit)
     */
    async submitBracketOrder(request: BracketOrderRequest): Promise<Order> {
        try {
            interface BracketOrderPayload {
                symbol: string;
                qty: number;
                side: 'buy' | 'sell';
                type: 'market' | 'limit' | 'stop' | 'stop_limit' | 'trailing_stop';
                time_in_force: string;
                order_class: 'bracket';
                take_profit: {
                    limit_price: number;
                };
                stop_loss: {
                    stop_price: number;
                    limit_price?: number;
                };
                limit_price?: number;
            }

            const orderPayload: BracketOrderPayload = {
                symbol: request.symbol,
                qty: request.qty,
                side: request.side,
                type: request.type,
                time_in_force: request.time_in_force || 'gtc',
                order_class: 'bracket',
                take_profit: {
                    limit_price: request.take_profit.limit_price,
                },
                stop_loss: {
                    stop_price: request.stop_loss.stop_price,
                },
            };

            if (request.type === 'limit' && request.limit_price) {
                orderPayload.limit_price = request.limit_price;
            }

            if (request.stop_loss.limit_price) {
                orderPayload.stop_loss.limit_price = request.stop_loss.limit_price;
            }

            const order = await this.client.createOrder(orderPayload as unknown as Parameters<typeof this.client.createOrder>[0]);
            return order as unknown as Order;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('Error submitting bracket order:', error);
            throw new Error(`Failed to submit bracket order: ${errorMessage}`);
        }
    }

    /**
     * Submit a trailing stop order
     */
    async submitTrailingStop(request: TrailingStopRequest): Promise<Order> {
        try {
            interface TrailingStopPayload {
                symbol: string;
                qty: number;
                side: 'buy' | 'sell';
                type: 'trailing_stop';
                time_in_force: 'gtc';
                trail_percent?: number;
                trail_price?: number;
            }

            const orderPayload: TrailingStopPayload = {
                symbol: request.symbol,
                qty: request.qty,
                side: request.side,
                type: 'trailing_stop',
                time_in_force: 'gtc',
            };

            if (request.trail_percent) {
                orderPayload.trail_percent = request.trail_percent;
            } else if (request.trail_price) {
                orderPayload.trail_price = request.trail_price;
            } else {
                throw new Error('Either trail_percent or trail_price must be specified');
            }

            const order = await this.client.createOrder(orderPayload as unknown as Parameters<typeof this.client.createOrder>[0]);
            return order as unknown as Order;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('Error submitting trailing stop:', error);
            throw new Error(`Failed to submit trailing stop: ${errorMessage}`);
        }
    }
}

// Export singleton instance
export const alpacaBroker = new AlpacaBrokerService();
