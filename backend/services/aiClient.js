const crypto = require('crypto');
const axios = require('axios');
const jwt = require('jsonwebtoken');

// Render's free tier can take ~50s to wake the AI service, so allow a long timeout.
const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS) || 60000;

// A fresh 60-second token per request. `sub` is the user id from the verified
// login JWT, so the AI service never trusts a user id sent by the browser.
// `bh` binds the token to this exact request body.
const signServiceToken = (userId, rawBody) => {
    const bodyHash = crypto.createHash('sha256').update(rawBody).digest('hex');
    return jwt.sign(
        { bh : bodyHash },
        process.env.SERVICE_AUTH_SECRET,
        {
            algorithm : 'HS256',
            audience : 'kairo-ai',
            issuer : 'kairo-core',
            subject : String(userId),
            expiresIn : 60,
            jwtid : crypto.randomUUID()
        }
    );
}

class AiServiceError extends Error {
    constructor(status, code, message){
        super(message);
        this.status = status;
        this.code = code;
    }
}

const callAiService = async ({ method, path, userId, body, timezone, requestId }) => {
    if(!process.env.AI_SERVICE_URL || !process.env.SERVICE_AUTH_SECRET){
        throw new AiServiceError(503, 'AI_NOT_CONFIGURED', 'Coach is not set up on the server yet.');
    }
    const rawBody = body === undefined ? '' : JSON.stringify(body);
    const headers = {
        Authorization : `Bearer ${signServiceToken(userId, rawBody)}`,
        'X-Request-ID' : requestId
    };
    if(timezone){
        headers['X-Timezone'] = timezone;
    }
    if(rawBody){
        headers['Content-Type'] = 'application/json';
    }
    try{
        const response = await axios({
            method,
            url : `${process.env.AI_SERVICE_URL}${path}`,
            data : rawBody || undefined,
            headers,
            timeout : AI_TIMEOUT_MS,
            transformRequest : [(data)=>data], // send the exact bytes that were hashed
            validateStatus : ()=>true,
            maxContentLength : 2 * 1024 * 1024
        });
        return { status : response.status, data : response.data };
    }
    catch(error){
        if(error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT'){
            throw new AiServiceError(504, 'AI_TIMEOUT', 'Coach is waking up. Please try again in a few seconds.');
        }
        throw new AiServiceError(503, 'AI_UNREACHABLE', 'Coach is offline right now. Please try again shortly.');
    }
}

module.exports = { callAiService, signServiceToken, AiServiceError };
