// Trading types for broker integration

export interface Order {
    id: string;
    client_order_id: string;
    created_at: string;
    updated_at: string;
    submitted_at: string;
    filled_at: string | null;
    expired_at: string | null;
    canceled_at: string | null;
    failed_at: string | null;
    replaced_at: string | null;
    replaced_by: string | null;
    replaces: string | null;
    asset_id: string;
    symbol: string;
    asset_class: string;
    notional: string | null;
    qty: string;
    filled_qty: string;
    filled_avg_price: string | null;
    order_class: string;
    order_type: 'market' | 'limit' | 'stop' | 'stop_limit' | 'trailing_stop';
    type: 'market' | 'limit' | 'stop' | 'stop_limit' | 'trailing_stop';
    side: 'buy' | 'sell';
    time_in_force: 'day' | 'gtc' | 'opg' | 'cls' | 'ioc' | 'fok';
    limit_price: string | null;
    stop_price: string | null;
    status: 'new' | 'partially_filled' | 'filled' | 'done_for_day' | 'canceled' | 'expired' | 'replaced' | 'pending_cancel' | 'pending_replace' | 'accepted' | 'pending_new' | 'accepted_for_bidding' | 'stopped' | 'rejected' | 'suspended' | 'calculated';
    extended_hours: boolean;
    legs: Order[] | null;
    trail_percent: string | null;
    trail_price: string | null;
    hwm: string | null;
}

export interface Position {
    asset_id: string;
    symbol: string;
    exchange: string;
    asset_class: string;
    avg_entry_price: string;
    qty: string;
    side: 'long' | 'short';
    market_value: string;
    cost_basis: string;
    unrealized_pl: string;
    unrealized_plpc: string;
    unrealized_intraday_pl: string;
    unrealized_intraday_plpc: string;
    current_price: string;
    lastday_price: string;
    change_today: string;
}

export interface Account {
    id: string;
    account_number: string;
    status: string;
    crypto_status: string;
    currency: string;
    buying_power: string;
    regt_buying_power: string;
    daytrading_buying_power: string;
    effective_buying_power: string;
    non_marginable_buying_power: string;
    bod_dtbp: string;
    cash: string;
    accrued_fees: string;
    pending_transfer_out: string;
    pending_transfer_in: string;
    portfolio_value: string;
    pattern_day_trader: boolean;
    trading_blocked: boolean;
    transfers_blocked: boolean;
    account_blocked: boolean;
    created_at: string;
    trade_suspended_by_user: boolean;
    multiplier: string;
    shorting_enabled: boolean;
    equity: string;
    last_equity: string;
    long_market_value: string;
    short_market_value: string;
    initial_margin: string;
    maintenance_margin: string;
    last_maintenance_margin: string;
    sma: string;
    daytrade_count: number;
}

export interface OrderRequest {
    symbol: string;
    qty: number;
    side: 'buy' | 'sell';
    type: 'market' | 'limit';
    time_in_force: 'day' | 'gtc' | 'opg' | 'cls' | 'ioc' | 'fok';
    limit_price?: number;
    stop_price?: number;
    extended_hours?: boolean;
    client_order_id?: string;
    // Advanced order fields
    order_class?: 'simple' | 'bracket' | 'oco' | 'oto';
    take_profit?: {
        limit_price: number;
    };
    stop_loss?: {
        stop_price: number;
        limit_price?: number;
    };
}

// Advanced order types
export interface BracketOrderRequest {
    symbol: string;
    qty: number;
    side: 'buy' | 'sell';
    type: 'market' | 'limit';
    limit_price?: number;
    time_in_force?: 'day' | 'gtc';
    take_profit: {
        limit_price: number;
    };
    stop_loss: {
        stop_price: number;
        limit_price?: number;
    };
}

export interface TrailingStopRequest {
    symbol: string;
    qty: number;
    side: 'sell';
    trail_percent?: number;
    trail_price?: number;
}


export interface ClosePositionRequest {
    symbol: string;
    qty?: number;
    percentage?: number;
}

export interface OrderResponse {
    success: boolean;
    order?: Order;
    error?: string;
    message?: string;
}

export interface PositionsResponse {
    success: boolean;
    positions?: Position[];
    error?: string;
}

export interface AccountResponse {
    success: boolean;
    account?: Account;
    error?: string;
}
