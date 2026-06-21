// Network utilities for reliable API calls across all networks (Jio, Airtel, Vi, etc.)

/**
 * Enhanced fetch with timeout and automatic retry.
 * Handles flaky mobile networks (Jio, Vi, BSNL, etc.) by:
 * 1. Adding a per-request timeout (AbortController)
 * 2. Retrying on network failures with exponential backoff
 * 3. Checking online status before making requests
 */

interface FetchWithRetryOptions {
    /** Timeout per attempt in milliseconds (default: 15000ms = 15s) */
    timeout?: number;
    /** Number of retry attempts (default: 3) */
    retries?: number;
    /** Base delay between retries in ms; doubles each attempt (default: 1000ms) */
    retryDelay?: number;
}

/**
 * Check whether the browser reports itself as online.
 * Note: navigator.onLine can be unreliable on some networks,
 * but it catches the obvious "airplane mode / Wi-Fi off" cases.
 */
export const isOnline = (): boolean => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
};

/**
 * Wrapper around fetch() that adds:
 *  - Per-request timeout via AbortController
 *  - Automatic retries with exponential backoff for network errors
 *  - Pre-flight online check
 *
 * Usage is identical to the native fetch():
 *   const res = await fetchWithRetry('/api/endpoint', { method: 'POST', ... });
 */
export const fetchWithRetry = async (
    url: string,
    options: RequestInit = {},
    retryOptions: FetchWithRetryOptions = {}
): Promise<Response> => {
    const {
        timeout = 15000,   // 15 seconds per attempt
        retries = 3,       // 3 total attempts
        retryDelay = 1000, // 1s → 2s → 4s backoff
    } = retryOptions;

    // Pre-flight check
    if (!isOnline()) {
        throw new NetworkError(
            'You appear to be offline. Please check your internet connection and try again.',
            'OFFLINE'
        );
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < retries; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            // If we get a response (even an error response), return it —
            // the caller will handle HTTP status codes.
            return response;
        } catch (error: any) {
            clearTimeout(timeoutId);
            lastError = error;

            const isAbort = error.name === 'AbortError';
            const isNetworkError =
                error instanceof TypeError || // "Failed to fetch" / "NetworkError"
                error.name === 'TypeError' ||
                isAbort;

            if (!isNetworkError) {
                // Not a network issue — don't retry (e.g. JSON parse error)
                throw error;
            }

            const isLastAttempt = attempt === retries - 1;

            if (!isLastAttempt) {
                // Exponential backoff: 1s, 2s, 4s ...
                const delay = retryDelay * Math.pow(2, attempt);
                console.warn(
                    `⚠️ Network request failed (attempt ${attempt + 1}/${retries}). ` +
                    `Retrying in ${delay}ms...`,
                    { url, error: error.message }
                );
                await sleep(delay);
            }
        }
    }

    // All retries exhausted
    const isTimeout = lastError?.name === 'AbortError';
    if (isTimeout) {
        throw new NetworkError(
            'Request timed out. This can happen on slow mobile networks. Please try again.',
            'TIMEOUT'
        );
    }

    throw new NetworkError(
        'Unable to connect to the server. Please check your internet connection and try again.',
        'NETWORK_ERROR'
    );
};

/**
 * Custom error class for network-related failures.
 * Includes a `code` field so callers can show user-friendly messages.
 */
export class NetworkError extends Error {
    code: 'OFFLINE' | 'TIMEOUT' | 'NETWORK_ERROR';

    constructor(message: string, code: 'OFFLINE' | 'TIMEOUT' | 'NETWORK_ERROR') {
        super(message);
        this.name = 'NetworkError';
        this.code = code;
    }
}

/** Simple promise-based sleep */
const sleep = (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Load an external script with retry.
 * Used for loading the Razorpay checkout.js on flaky networks.
 */
export const loadScriptWithRetry = (
    src: string,
    retries = 3,
    retryDelay = 1500
): Promise<boolean> => {
    return new Promise((resolve) => {
        let attempt = 0;

        const tryLoad = () => {
            // Remove any previously failed script tag for this src
            const existingScript = document.querySelector(`script[src="${src}"]`);
            if (existingScript) {
                existingScript.remove();
            }

            const script = document.createElement('script');
            script.src = src;
            script.async = true;

            script.onload = () => {
                console.log(`✅ Script loaded successfully: ${src}`);
                resolve(true);
            };

            script.onerror = () => {
                attempt++;
                if (attempt < retries) {
                    console.warn(
                        `⚠️ Script load failed (attempt ${attempt}/${retries}). Retrying in ${retryDelay}ms...`
                    );
                    script.remove();
                    setTimeout(tryLoad, retryDelay * attempt);
                } else {
                    console.error(`❌ Script failed to load after ${retries} attempts: ${src}`);
                    resolve(false);
                }
            };

            document.body.appendChild(script);
        };

        tryLoad();
    });
};
