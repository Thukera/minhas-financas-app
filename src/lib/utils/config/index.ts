/**
 * Get the configured auth redirect delay from environment variables
 * Default: 500ms
 */
export const getAuthRedirectDelay = (): number => {
    return parseInt(process.env.NEXT_PUBLIC_AUTH_REDIRECT_DELAY || "500", 10);
};

/**
 * Get the configured API timeout from environment variables
 * Default: 30000ms (30 seconds)
 */
export const getApiTimeout = (): number => {
    return parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || "30000", 10);
};
