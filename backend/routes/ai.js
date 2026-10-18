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

const actionTypes = ['confirm', 'cancel', 'undo'];

router.post('/actions/:actionId/:operation', requireObjectId('actionId', 'Action not found'), async (req,res)=>{
    if(!actionTypes.includes(req.params.operation)){
        return res.status(404).json({
            success : false,
            message : "Unknown action"
        })
    }
    return forward(req, res, { method : 'POST', path : `/v1/actions/${req.params.actionId}/${req.params.operation}` });
})

router.get('/plans', async (req,res)=>{
    return forward(req, res, { method : 'GET', path : '/v1/plans' });
})

router.post('/plans', async (req,res)=>{
    const { gameId, endDate, dailyMinutes, estimatedHours } = req.body || {};
    if(!objectIdPattern.test(String(gameId))){
        return res.status(400).json({ success : false, message : "Choose a game from your library" });
    }
    if(typeof endDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)){
        return res.status(400).json({ success : false, message : "Deadline must be a date" });
    }
    if(!Number.isInteger(dailyMinutes) || dailyMinutes < 15 || dailyMinutes > 480){
        return res.status(400).json({ success : false, message : "Daily time must be between 15 minutes and 8 hours" });
    }
    const hasEstimate = estimatedHours !== undefined && estimatedHours !== null && estimatedHours !== '';
    if(hasEstimate && (typeof estimatedHours !== 'number' || estimatedHours <= 0 || estimatedHours > 500)){
        return res.status(400).json({ success : false, message : "Game length must be between 1 and 500 hours" });
    }
    const body = { gameId, endDate, dailyMinutes };
    if(hasEstimate){
        body.estimatedHours = estimatedHours;
    }
    return forward(req, res, { method : 'POST', path : '/v1/plans', body });
})

router.post('/plans/:planId/replan', requireObjectId('planId', 'Plan not found'), async (req,res)=>{
    return forward(req, res, { method : 'POST', path : `/v1/plans/${req.params.planId}/replan` });
})

router.delete('/plans/:planId', requireObjectId('planId', 'Plan not found'), async (req,res)=>{
    return forward(req, res, { method : 'DELETE', path : `/v1/plans/${req.params.planId}` });
})

router.get('/overview', async (req,res)=>{
    return forward(req, res, { method : 'GET', path : '/v1/overview' });
})

router.get('/insights', async (req,res)=>{
    return forward(req, res, { method : 'GET', path : '/v1/insights' });
})

router.get('/goals', async (req,res)=>{
    return forward(req, res, { method : 'GET', path : '/v1/goals' });
})

const goalTypes = ['weekly_playtime', 'active_days', 'weekly_sessions'];

router.post('/goals', async (req,res)=>{
    const { type, target, endDate } = req.body || {};
    if(!goalTypes.includes(type)){
        return res.status(400).json({ success : false, message : "Choose a goal type" });
    }
    if(typeof target !== 'number' || !(target > 0) || target > 100){
        return res.status(400).json({ success : false, message : "Enter a target above 0" });
    }
    if(typeof endDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)){
        return res.status(400).json({ success : false, message : "End date must be a date" });
    }
    return forward(req, res, { method : 'POST', path : '/v1/goals', body : { type, target, endDate } });
})

router.delete('/goals/:goalId', requireObjectId('goalId', 'Goal not found'), async (req,res)=>{
    return forward(req, res, { method : 'DELETE', path : `/v1/goals/${req.params.goalId}` });
})

router.get('/briefing', async (req,res)=>{
    return forward(req, res, { method : 'GET', path : '/v1/briefing' });
})

const platforms = ['PC', 'PS5', 'PS4', 'Xbox', 'Switch', 'Mobile'];

router.post('/recommendations', ...chatLimiters, async (req,res)=>{
    const { likedGames = [], mood = '', platform } = req.body || {};
    if(!Array.isArray(likedGames) || likedGames.length > 6 || likedGames.some((title)=>typeof title !== 'string' || title.length > 100)){
        return res.status(400).json({ success : false, message : "Add up to 6 game titles" });
    }
    if(typeof mood !== 'string' || mood.length > 200){
        return res.status(400).json({ success : false, message : "Keep the description under 200 characters" });
    }
    if(platform !== undefined && platform !== null && platform !== 'Any' && !platforms.includes(platform)){
        return res.status(400).json({ success : false, message : "Unknown platform" });
    }
    const body = { likedGames : likedGames.map((title)=>title.trim()).filter(Boolean), mood : mood.trim() };
    if(platforms.includes(platform)){
        body.platform = platform;
    }
    return forward(req, res, { method : 'POST', path : '/v1/recommendations', body });
})

module.exports = router;
