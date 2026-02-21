import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import net from 'net';
import { marketData } from './providers/aggregator';
import { sub } from './redis';
import logger from './logger';

/**
 * Reference counter for Redis channel subscriptions.
 * Tracks how many WebSocket clients are subscribed to each channel,
 * so we only unsubscribe from Redis when the last client disconnects.
 */
const channelRefCount = new Map<string, number>();

function incrementRef(channel: string) {
    const count = channelRefCount.get(channel) || 0;
    channelRefCount.set(channel, count + 1);
    if (count === 0) {
        // First subscriber — subscribe to Redis
        sub.subscribe(channel);
    }
}

function decrementRef(channel: string) {
    const count = channelRefCount.get(channel) || 0;
    if (count <= 1) {
        channelRefCount.delete(channel);
        sub.unsubscribe(channel);
    } else {
        channelRefCount.set(channel, count - 1);
    }
}

export function setupMarketWS(server: http.Server) {
    const wss = new WebSocketServer({ noServer: true });

    server.on('upgrade', (request: http.IncomingMessage, socket: net.Socket, head: Buffer) => {
        const url = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);
        const { pathname } = url;

        if (pathname === '/ws/market') {
            wss.handleUpgrade(request, socket, head, (ws) => {
                wss.emit('connection', ws, request);
            });
        } else {
            socket.destroy();
        }
    });

    wss.on('connection', (ws: WebSocket) => {
        logger.info('New market WS connection');

        // Per-connection state: track all subscriptions and their handlers
        const subscriptions = new Map<string, (chan: string, update: string) => void>();

        ws.on('message', async (message) => {
            try {
                const { action, symbol, assetClass } = JSON.parse(message.toString());

                if (action === 'subscribe') {
                    const channel = `market:${symbol}`;

                    // Prevent duplicate subscription to the same channel
                    if (subscriptions.has(channel)) {
                        return;
                    }

                    // Send initial quote
                    const quote = await marketData.getQuote(symbol, assetClass);
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({ type: 'quote', data: quote }));
                    }

                    // Create handler scoped to this channel
                    const handleUpdate = (chan: string, update: string) => {
                        if (chan === channel && ws.readyState === WebSocket.OPEN) {
                            ws.send(JSON.stringify({ type: 'quote', data: JSON.parse(update) }));
                        }
                    };

                    // Track subscription and increment ref count
                    subscriptions.set(channel, handleUpdate);
                    sub.on('message', handleUpdate);
                    incrementRef(channel);
                } else if (action === 'unsubscribe') {
                    const channel = `market:${symbol}`;
                    const handler = subscriptions.get(channel);
                    if (handler) {
                        sub.off('message', handler);
                        subscriptions.delete(channel);
                        decrementRef(channel);
                    }
                }
            } catch (err: unknown) {
                const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                logger.error('WS Message Error:', errorMessage);
            }
        });

        ws.on('close', () => {
            // Clean up ALL subscriptions for this connection
            subscriptions.forEach((handler, channel) => {
                sub.off('message', handler);
                decrementRef(channel);
            });
            subscriptions.clear();
            logger.info('Market WS connection closed');
        });

        ws.on('error', (err: Error) => {
            logger.error('WS connection error:', err.message);
        });
    });

    return wss;
}
