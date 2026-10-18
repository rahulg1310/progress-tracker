const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// Verifies tokens the AI service signs when it needs Express to change data.
// The user id comes from the token's `sub`, which FastAPI took from the token
// Express itself issued for the logged-in user. Request bodies cannot pick a user.
const objectIdPattern = /^[a-f0-9]{24}$/;
const usedTokenIds = new Map();

const rememberTokenId = (jti, expiresAtMs)=>{
    const now = Date.now();
    if(usedTokenIds.size > 10000){
        for(const [key, expiry] of usedTokenIds){
            if(expiry < now) usedTokenIds.delete(key);
        }
    }
    if(usedTokenIds.has(jti)) return false;
    usedTokenIds.set(jti, expiresAtMs);
    return true;
}

const serviceAuth = (req,res,next)=>{
    const deny = (message)=>res.status(401).json({ success : false, message });
    try{
        if(!process.env.SERVICE_AUTH_SECRET){
            return res.status(503).json({ success : false, message : "Service auth not configured" });
        }
        const authHeader = req.headers.authorization || '';
        if(!authHeader.startsWith('Bearer ')){
            return deny("No service token provided");
        }
        const claims = jwt.verify(authHeader.slice(7), process.env.SERVICE_AUTH_SECRET, {
            algorithms : ['HS256'],
            audience : 'kairo-core',
            issuer : 'kairo-ai',
            maxAge : '120s'
        });
        if(!objectIdPattern.test(String(claims.sub)) || !claims.jti || !claims.bh){
            return deny("Invalid service token");
        }
        const bodyHash = crypto.createHash('sha256').update(req.rawBody || '').digest('hex');
        if(claims.bh.length !== bodyHash.length || !crypto.timingSafeEqual(Buffer.from(claims.bh), Buffer.from(bodyHash))){
            return deny("Request body does not match token");
        }
        if(!rememberTokenId(claims.jti, claims.exp * 1000)){
            return deny("Service token already used");
        }
        req.user = { userId : claims.sub };
        next();
    }
    catch(error){
        return deny("Invalid service token");
    }
}

module.exports = serviceAuth;
