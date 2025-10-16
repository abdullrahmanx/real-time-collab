import rateLimit from "express-rate-limit";

export const limiter= rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP',
    standardHeaders: true,
    legacyHeaders: true
})

export const authLimiter= rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: 'Too many login attemps, please try again later'
})

