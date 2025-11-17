// Token bucket config

const RATE = 500 // req per second
const BURST = 5000 // max tokens
let tokens = BURST

let last = Date.now()

function rateLimitMiddleware(req, res, next) {
    const now = Date.now()
    const delta = (now - last) / 1000
    tokens += delta * RATE
    if (tokens > BURST) {
        tokens = BURST
    }
    last = now

    if (tokens >= 1) {
        tokens -= 1
        next()
    } else {
        res.status(429).json({ message: 'Too many requests, please try again later.' })
    }
}

export default rateLimitMiddleware