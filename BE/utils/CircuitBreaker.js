/**
 * Circuit Breaker Pattern Implementation
 * 
 * Prevents cascading failures by failing fast when a dependency is unhealthy.
 * Uses percentage-based failure detection with sliding window for accurate health tracking.
 * 
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Failing fast, requests rejected immediately
 * - HALF_OPEN: Testing recovery, limited requests allowed
 * 
 * @example
 * const breaker = new CircuitBreaker('redis', {
 *   failureThreshold: 0.5,  // 50% error rate
 *   windowSize: 20,          // Over last 20 requests
 *   timeout: 30000,          // 30s before retry
 *   successThreshold: 2      // 2 successes to close
 * });
 * 
 * const result = await breaker.execute(async () => {
 *   return await redisClient.get('key');
 * });
 */

import { EventEmitter } from 'events';

const CircuitState = {
  CLOSED: 'CLOSED',       // Normal operation
  OPEN: 'OPEN',           // Failing fast
  HALF_OPEN: 'HALF_OPEN'  // Testing recovery
};

export class CircuitBreaker extends EventEmitter {
  constructor(name, options = {}) {
    super();
    
    this.name = name;
    this.state = CircuitState.CLOSED;
    
    // Configuration with sensible defaults
    this.config = {
      failureThreshold: options.failureThreshold || 0.5,  // 50% error rate
      windowSize: options.windowSize || 20,               // Sliding window size
      timeout: options.timeout || 30000,                  // 30s recovery timeout
      successThreshold: options.successThreshold || 2,    // Successes to close circuit
      minRequestCount: options.minRequestCount || 5       // Min requests before opening
    };
    
    // Sliding window for tracking requests
    this.requests = [];
    this.consecutiveSuccesses = 0;
    this.consecutiveFailures = 0;
    this.lastFailureTime = null;
    this.lastStateChange = new Date();
    this.nextAttemptTime = null;
    
    // Statistics
    this.stats = {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      rejectedCalls: 0
    };
  }

  /**
   * Execute a function with circuit breaker protection
   * @param {Function} fn - Async function to execute
   * @param {Function} fallback - Optional fallback function if circuit is open
   * @returns {Promise<any>} Result or fallback result
   */
  async execute(fn, fallback = null) {
    this.stats.totalCalls++;
    
    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      // Check if timeout has elapsed to transition to half-open
      if (Date.now() >= this.nextAttemptTime) {
        this.transitionToHalfOpen();
      } else {
        this.stats.rejectedCalls++;
        this.emit('callRejected', { name: this.name, state: this.state });
        
        if (fallback) {
          return await fallback();
        }
        
        const error = new Error(`Circuit breaker is OPEN for ${this.name}`);
        error.circuitBreakerOpen = true;
        throw error;
      }
    }
    
    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure(error);
      throw error;
    }
  }

  /**
   * Record a successful call
   */
  recordSuccess() {
    this.stats.successfulCalls++;
    this.consecutiveSuccesses++;
    this.consecutiveFailures = 0;
    
    // Add to sliding window
    this.requests.push({ success: true, timestamp: Date.now() });
    this.trimWindow();
    
    this.emit('callSuccess', { 
      name: this.name, 
      state: this.state,
      consecutiveSuccesses: this.consecutiveSuccesses
    });
    
    // If in half-open state, check if we should close the circuit
    if (this.state === CircuitState.HALF_OPEN) {
      if (this.consecutiveSuccesses >= this.config.successThreshold) {
        this.transitionToClosed();
      }
    }
  }

  /**
   * Record a failed call
   */
  recordFailure(error) {
    this.stats.failedCalls++;
    this.consecutiveFailures++;
    this.consecutiveSuccesses = 0;
    this.lastFailureTime = Date.now();
    
    // Add to sliding window
    this.requests.push({ success: false, timestamp: Date.now(), error: error.message });
    this.trimWindow();
    
    this.emit('callFailure', { 
      name: this.name, 
      state: this.state,
      error: error.message,
      consecutiveFailures: this.consecutiveFailures
    });
    
    // Check if we should open the circuit
    if (this.state === CircuitState.CLOSED || this.state === CircuitState.HALF_OPEN) {
      if (this.shouldOpenCircuit()) {
        this.transitionToOpen();
      }
    }
  }

  /**
   * Determine if circuit should open based on failure rate
   */
  shouldOpenCircuit() {
    // Need minimum number of requests to make a decision
    if (this.requests.length < this.config.minRequestCount) {
      return false;
    }
    
    const failedCount = this.requests.filter(r => !r.success).length;
    const failureRate = failedCount / this.requests.length;
    
    return failureRate >= this.config.failureThreshold;
  }

  /**
   * Calculate current failure rate
   */
  getFailureRate() {
    if (this.requests.length === 0) return 0;
    const failedCount = this.requests.filter(r => !r.success).length;
    return failedCount / this.requests.length;
  }

  /**
   * Trim sliding window to configured size
   */
  trimWindow() {
    if (this.requests.length > this.config.windowSize) {
      this.requests = this.requests.slice(-this.config.windowSize);
    }
  }

  /**
   * Transition to OPEN state
   */
  transitionToOpen() {
    const previousState = this.state;
    this.state = CircuitState.OPEN;
    this.lastStateChange = new Date();
    this.nextAttemptTime = Date.now() + this.config.timeout;
    
    this.emit('stateChanged', {
      name: this.name,
      from: previousState,
      to: CircuitState.OPEN,
      timestamp: this.lastStateChange,
      failureRate: this.getFailureRate(),
      consecutiveFailures: this.consecutiveFailures
    });
    
    console.warn(
      `[CIRCUIT_BREAKER] ${this.name} circuit OPENED | ` +
      `Failure Rate: ${(this.getFailureRate() * 100).toFixed(1)}% | ` +
      `Consecutive Failures: ${this.consecutiveFailures} | ` +
      `Next Attempt: ${new Date(this.nextAttemptTime).toISOString()}`
    );
  }

  /**
   * Transition to HALF_OPEN state
   */
  transitionToHalfOpen() {
    const previousState = this.state;
    this.state = CircuitState.HALF_OPEN;
    this.lastStateChange = new Date();
    this.consecutiveSuccesses = 0;
    this.consecutiveFailures = 0;
    
    this.emit('stateChanged', {
      name: this.name,
      from: previousState,
      to: CircuitState.HALF_OPEN,
      timestamp: this.lastStateChange
    });
    
    console.log(
      `[CIRCUIT_BREAKER] ${this.name} circuit transitioned to HALF_OPEN | ` +
      `Testing recovery...`
    );
  }

  /**
   * Transition to CLOSED state
   */
  transitionToClosed() {
    const previousState = this.state;
    this.state = CircuitState.CLOSED;
    this.lastStateChange = new Date();
    this.requests = []; // Clear sliding window on recovery
    this.nextAttemptTime = null;
    
    this.emit('stateChanged', {
      name: this.name,
      from: previousState,
      to: CircuitState.CLOSED,
      timestamp: this.lastStateChange,
      consecutiveSuccesses: this.consecutiveSuccesses
    });
    
    console.log(
      `[CIRCUIT_BREAKER] ${this.name} circuit CLOSED | ` +
      `Recovery successful after ${this.consecutiveSuccesses} successful calls`
    );
  }

  /**
   * Force open the circuit (for testing or manual intervention)
   */
  forceOpen() {
    if (this.state !== CircuitState.OPEN) {
      this.transitionToOpen();
    }
  }

  /**
   * Force close the circuit (for manual recovery)
   */
  forceClose() {
    if (this.state !== CircuitState.CLOSED) {
      this.transitionToClosed();
    }
  }

  /**
   * Get current circuit breaker status
   */
  getStatus() {
    return {
      name: this.name,
      state: this.state,
      failureRate: this.getFailureRate(),
      consecutiveSuccesses: this.consecutiveSuccesses,
      consecutiveFailures: this.consecutiveFailures,
      lastStateChange: this.lastStateChange,
      nextAttemptTime: this.nextAttemptTime ? new Date(this.nextAttemptTime) : null,
      windowSize: this.requests.length,
      config: this.config,
      stats: {
        ...this.stats,
        successRate: this.stats.totalCalls > 0 
          ? (this.stats.successfulCalls / this.stats.totalCalls * 100).toFixed(2) + '%'
          : '0%'
      }
    };
  }

  /**
   * Reset circuit breaker statistics
   */
  reset() {
    this.requests = [];
    this.consecutiveSuccesses = 0;
    this.consecutiveFailures = 0;
    this.lastFailureTime = null;
    this.nextAttemptTime = null;
    this.stats = {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      rejectedCalls: 0
    };
    
    if (this.state !== CircuitState.CLOSED) {
      this.transitionToClosed();
    }
  }
}

export { CircuitState };
