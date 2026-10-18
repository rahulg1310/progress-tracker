const { rateLimit } = require('express-rate-limit');

// Limits are per logged-in user (authMiddleware runs first), not per IP.
// They protect the Gemini free-tier quota from one user using it all up.
const perUser = (req)=>req.user.userId;

const limitHandler = (message)=>(req,res)=>{
    return res.status(429).json({
        success : false,
        code : 'RATE_LIMITED',
        message
    });
}

const aiLimiter = rateLimit({
    windowMs : 60 * 1000,
    limit : Number(process.env.AI_REQUESTS_PER_MINUTE) || 60,
    standardHeaders : 'draft-8',
    legacyHeaders : false,
    keyGenerator : perUser,
    handler : limitHandler('Too many requests. Please slow down.')
});

const chatMinuteLimiter = rateLimit({
    windowMs : 60 * 1000,
    limit : Number(process.env.AI_CHAT_PER_MINUTE) || 8,
    standardHeaders : 'draft-8',
    legacyHeaders : false,
    keyGenerator : perUser,
    handler : limitHandler("You're sending messages too quickly. Wait a few seconds and try again.")
});

const chatDayLimiter = rateLimit({
    windowMs : 24 * 60 * 60 * 1000,
    limit : Number(process.env.AI_CHAT_PER_DAY) || 150,
    standardHeaders : false,
    legacyHeaders : false,
    keyGenerator : perUser,
    handler : limitHandler("You've reached today's Coach message limit. It resets in 24 hours.")
});

module.exports = { aiLimiter, chatLimiters : [chatMinuteLimiter, chatDayLimiter] };
