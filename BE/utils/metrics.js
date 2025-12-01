import client from 'prom-client';

// Create a Registry to register the metrics
const register = new client.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
    app: 'booking-backend'
});

// Enable the collection of default metrics
client.collectDefaultMetrics({ register });

// Define custom metrics for Circuit Breaker
const circuitState = new client.Gauge({
    name: 'circuit_breaker_state',
    help: 'State of the circuit breaker (0=Closed, 1=Open, 2=Half-Open)',
    labelNames: ['name'],
    registers: [register]
});

const circuitFailures = new client.Counter({
    name: 'circuit_breaker_failures_total',
    help: 'Total number of failures detected by the circuit breaker',
    labelNames: ['name'],
    registers: [register]
});

const circuitSuccesses = new client.Counter({
    name: 'circuit_breaker_successes_total',
    help: 'Total number of successful calls',
    labelNames: ['name'],
    registers: [register]
});

const circuitFallbacks = new client.Counter({
    name: 'circuit_breaker_fallbacks_total',
    help: 'Total number of fallback executions',
    labelNames: ['name'],
    registers: [register]
});

/**
 * Register a circuit breaker to be monitored
 * @param {Object} circuitBreaker - The Opossum circuit breaker instance
 */
export const registerCircuitBreaker = (circuitBreaker) => {
    const name = circuitBreaker.name;

    // Initialize state to Closed (0)
    circuitState.set({ name }, 0);

    circuitBreaker.on('open', () => circuitState.set({ name }, 1));
    circuitBreaker.on('close', () => circuitState.set({ name }, 0));
    circuitBreaker.on('halfOpen', () => circuitState.set({ name }, 2));

    circuitBreaker.on('failure', () => circuitFailures.inc({ name }));
    circuitBreaker.on('success', () => circuitSuccesses.inc({ name }));
    circuitBreaker.on('fallback', () => circuitFallbacks.inc({ name }));
};

/**
 * Get the metrics content type
 */
export const getContentType = () => register.contentType;

/**
 * Get all metrics
 */
export const getMetrics = async () => {
    return await register.metrics();
};
