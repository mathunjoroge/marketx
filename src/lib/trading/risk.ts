/**
 * Risk Management Utilities
 * 
 * Provides position sizing, risk/reward calculations, and portfolio risk metrics
 */

export interface RiskConfig {
    maxPositionSizePercent: number; // Max % of portfolio per position
    maxPortfolioHeat: number; // Max % of portfolio at risk
    maxLeverageRatio: number; // Max leverage multiplier
    defaultRiskPercent: number; // Default risk % per trade
}

export const DEFAULT_RISK_CONFIG: RiskConfig = {
    maxPositionSizePercent: 10,
    maxPortfolioHeat: 20,
    maxLeverageRatio: 2,
    defaultRiskPercent: 1,
};

export interface PositionSizeResult {
    shares: number;
    positionValue: number;
    riskAmount: number;
    positionSizePercent: number;
}

export interface RiskRewardResult {
    ratio: number;
    riskAmount: number;
    rewardAmount: number;
    riskPercent: number;
    rewardPercent: number;
}

export interface PortfolioRiskMetrics {
    totalHeat: number; // % of portfolio currently at risk
    largestPositionPercent: number;
    numberOfPositions: number;
    totalExposure: number; // Total market value of all positions
    availableRisk: number; // Remaining risk capacity
}

/**
 * Calculate position size based on risk parameters
 * Uses Kelly Criterion principles for position sizing
 */
export function calculatePositionSize(
    accountValue: number,
    riskPercent: number,
    entryPrice: number,
    stopPrice: number
): PositionSizeResult {
    // Risk amount in dollars
    const riskAmount = accountValue * (riskPercent / 100);

    // Risk per share
    const riskPerShare = Math.abs(entryPrice - stopPrice);

    if (riskPerShare === 0) {
        throw new Error('Stop price cannot equal entry price');
    }

    // Number of shares
    const shares = Math.floor(riskAmount / riskPerShare);

    // Position value
    const positionValue = shares * entryPrice;

    // Position size as % of account
    const positionSizePercent = (positionValue / accountValue) * 100;

    return {
        shares,
        positionValue,
        riskAmount,
        positionSizePercent,
    };
}

/**
 * Calculate risk/reward ratio
 */
export function calculateRiskReward(
    entryPrice: number,
    stopPrice: number,
    targetPrice: number
): RiskRewardResult {
    const riskPerShare = Math.abs(entryPrice - stopPrice);
    const rewardPerShare = Math.abs(targetPrice - entryPrice);

    if (riskPerShare === 0) {
        throw new Error('Stop price cannot equal entry price');
    }

    const ratio = rewardPerShare / riskPerShare;

    // Calculate percentages
    const riskPercent = (riskPerShare / entryPrice) * 100;
    const rewardPercent = (rewardPerShare / entryPrice) * 100;

    return {
        ratio,
        riskAmount: riskPerShare,
        rewardAmount: rewardPerShare,
        riskPercent,
        rewardPercent,
    };
}

/**
 * Calculate portfolio heat (total exposure)
 */
export function calculatePortfolioHeat(
    positions: Array<{ symbol: string; qty: number; avg_entry_price: number; current_price: number; market_value: number }>,
    accountValue: number,
    stopPrices: Record<string, number> = {}
): PortfolioRiskMetrics {
    let totalRiskAmount = 0;
    let totalExposure = 0;
    let largestPositionValue = 0;

    positions.forEach(position => {
        const positionValue = position.market_value;
        totalExposure += positionValue;

        if (positionValue > largestPositionValue) {
            largestPositionValue = positionValue;
        }

        // If we have a stop price, calculate actual risk
        const stopPrice = stopPrices[position.symbol];
        if (stopPrice) {
            const riskPerShare = Math.abs(position.avg_entry_price - stopPrice);
            totalRiskAmount += riskPerShare * position.qty;
        } else {
            // Assume 100% risk if no stop is set (conservative)
            totalRiskAmount += positionValue;
        }
    });

    const totalHeat = (totalRiskAmount / accountValue) * 100;
    const largestPositionPercent = (largestPositionValue / accountValue) * 100;
    const availableRisk = DEFAULT_RISK_CONFIG.maxPortfolioHeat - totalHeat;

    return {
        totalHeat,
        largestPositionPercent,
        numberOfPositions: positions.length,
        totalExposure,
        availableRisk: Math.max(0, availableRisk),
    };
}

/**
 * Validate if an order meets risk limits
 */
export function validateRiskLimits(
    orderValue: number,
    accountValue: number,
    currentHeat: number,
    config: RiskConfig = DEFAULT_RISK_CONFIG
): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check position size limit
    const positionSizePercent = (orderValue / accountValue) * 100;
    if (positionSizePercent > config.maxPositionSizePercent) {
        errors.push(`Position size ${positionSizePercent.toFixed(1)}% exceeds limit of ${config.maxPositionSizePercent}%`);
    }

    // Check portfolio heat limit
    if (currentHeat > config.maxPortfolioHeat) {
        errors.push(`Portfolio heat ${currentHeat.toFixed(1)}% exceeds limit of ${config.maxPortfolioHeat}%`);
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Calculate recommended position size with validation
 */
export function getRecommendedPositionSize(
    accountValue: number,
    buyingPower: number,
    entryPrice: number,
    stopPrice: number,
    riskPercent: number = DEFAULT_RISK_CONFIG.defaultRiskPercent,
    config: RiskConfig = DEFAULT_RISK_CONFIG
): PositionSizeResult & { valid: boolean; errors: string[] } {
    const result = calculatePositionSize(accountValue, riskPercent, entryPrice, stopPrice);

    // Validate against buying power
    if (result.positionValue > buyingPower) {
        return {
            ...result,
            shares: Math.floor(buyingPower / entryPrice),
            positionValue: Math.floor(buyingPower / entryPrice) * entryPrice,
            valid: false,
            errors: ['Insufficient buying power for calculated position size'],
        };
    }

    // Validate against risk limits
    const validation = validateRiskLimits(result.positionValue, accountValue, 0, config);

    return {
        ...result,
        ...validation,
    };
}
