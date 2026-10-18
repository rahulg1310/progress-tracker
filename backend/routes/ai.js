const express = require('express');
const crypto = require('crypto');
const authMiddleware = require('../middleware/authMiddleware');
const { aiLimiter, chatLimiters } = require('../middleware/aiRateLimit');
const { callAiService } = require('../services/aiClient');

const router = express.Router();

const objectIdPattern = /^[a-f0-9]{24}$/;
const timezonePattern = /^[A-Za-z0-9_+-]+(\/[A-Za-z0-9_+-]+){0,2}$/;
const MAX_MESSAGE_LENGTH = 2000;

router.use(authMiddleware);
router.use((req,res,next)=>{
    // The user id always comes from the verified login token, never from the request.
    if(!objectIdPattern.test(String(req.user?.userId))){
        return res.status(401).json({
            success : false,
            message : "Invalid token"
        })
    }
    next();
});
router.use(aiLimiter);

const forward = async (req, res, { method, path, body })=>{
    const requestId = crypto.randomUUID();
    const timezone = req.get('X-Timezone');
    try{
        const result = await callAiService({
            method,
            path,
            userId : req.user.userId,
            body,
            timezone : timezone && timezone.length <= 64 && timezonePattern.test(timezone) ? timezone : undefined,
            requestId
        });
        if(!result.data || typeof result.data !== 'object'){
            console.log(`AI service returned a non-JSON response (status ${result.status}) request_id=${requestId}`);
            return res.status(502).json({
                success : false,
                code : 'AI_BAD_RESPONSE',
                message : "Coach couldn't respond. Please try again."
            })
        }
        return res.status(result.status).json(result.data);
    }
    catch(error){
        console.log(`AI request failed: ${error.code || error.message} request_id=${requestId}`);
        return res.status(error.status || 502).json({
            success : false,
            code : error.code || 'AI_ERROR',
            message : error.status ? error.message : "Coach couldn't respond. Please try again."
        })
    }
}

const requireObjectId = (param, notFoundMessage)=>(req,res,next)=>{
    if(!objectIdPattern.test(req.params[param])){
        return res.status(404).json({
            success : false,
            message : notFoundMessage
        })
    }
    next();
}

router.get('/health', async (req,res)=>{
    return forward(req, res, { method : 'GET', path : '/v1/health' });
})

router.post('/chat', ...chatLimiters, async (req,res)=>{
    const { message, conversationId } = req.body || {};
    if(typeof message !== 'string' || message.trim()===''){
        return res.status(400).json({
            success : false,
            message : "Message is required"
        })
    }
    if(message.length > MAX_MESSAGE_LENGTH){
        return res.status(400).json({
            success : false,
            message : `Message must be ${MAX_MESSAGE_LENGTH} characters or less`
        })
    }
    if(conversationId !== undefined && conversationId !== null && !objectIdPattern.test(String(conversationId))){
        return res.status(400).json({
            success : false,
            message : "Invalid conversation"
        })
    }
    // Only whitelisted fields are forwarded (a "userId" in the body is dropped here).
    const body = { message : message.trim() };
    if(conversationId){
        body.conversationId = conversationId;
    }
    return forward(req, res, { method : 'POST', path : '/v1/chat', body });
})

router.get('/conversations', async (req,res)=>{
    return forward(req, res, { method : 'GET', path : '/v1/conversations' });
})

router.get('/conversations/:conversationId/messages', requireObjectId('conversationId', 'Conversation not found'), async (req,res)=>{
    return forward(req, res, { method : 'GET', path : `/v1/conversations/${req.params.conversationId}/messages` });
})

router.delete('/conversations/:conversationId', requireObjectId('conversationId', 'Conversation not found'), async (req,res)=>{
    return forward(req, res, { method : 'DELETE', path : `/v1/conversations/${req.params.conversationId}` });
})

router.get('/memories', async (req,res)=>{
    return forward(req, res, { method : 'GET', path : '/v1/memories' });
})

router.delete('/memories/:memoryId', requireObjectId('memoryId', 'Memory not found'), async (req,res)=>{
    return forward(req, res, { method : 'DELETE', path : `/v1/memories/${req.params.memoryId}` });
})

module.exports = router;
