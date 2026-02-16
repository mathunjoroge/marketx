import { NextResponse } from 'next/server';
import { auth } from '@/auth';

/**
 * Centralized API Response Helpers
 */

export interface ApiSuccessResponse<T = unknown> {
    success: true;
    data: T;
}

export interface ApiErrorResponse {
    success: false;
    error: string;
    details?: unknown;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/** Build a standardized success response */
export function apiSuccess<T>(data: T, status = 200): NextResponse<ApiSuccessResponse<T>> {
    return NextResponse.json({ success: true as const, data }, { status });
}

/** Build a standardized error response */
export function apiError(error: string, status = 500, details?: unknown): NextResponse<ApiErrorResponse> {
    return NextResponse.json(
        { success: false as const, error, ...(details ? { details } : {}) },
        { status }
    );
}

/** Validate that a value is a finite number (guards against NaN, Infinity) */
export function isValidNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value) && !Number.isNaN(value);
}

/** Parse and validate a numeric field. Returns the number or null if invalid. */
export function parseNumeric(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null;
    const num = Number(value);
    return isValidNumber(num) ? num : null;
}

/** Require auth and return session user id. Returns error response if not authenticated. */
export async function requireAuth(): Promise<{ userId: string } | NextResponse<ApiErrorResponse>> {
    const session = await auth();
    if (!session?.user?.id) {
        return apiError('Unauthorized', 401);
    }
    return { userId: session.user.id };
}

/** 
 * Parse Alpaca API errors into user-friendly messages.
 * Alpaca errors come in various formats from the REST API.
 */
export function parseAlpacaError(error: any): string {
    // Alpaca REST API errors often have a message property
    if (error?.response?.data?.message) {
        return error.response.data.message;
    }
    if (error?.message) {
        return error.message;
    }
    return 'An unexpected trading error occurred';
}
