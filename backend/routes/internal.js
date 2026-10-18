const express = require('express');
const serviceAuth = require('../middleware/serviceAuth');
const Game = require('../models/Game');
const Session = require('../models/Session');
const { createSessionSchema, deleteSessionSchema, updateGameSchema, firstIssue } = require('../validation/coreSchemas');

// Write API for the AI service only (not called by the browser).
// Every query is scoped to req.user.userId taken from the verified service token.
const router = express.Router();
const objectIdPattern = /^[a-f0-9]{24}$/;

router.use(serviceAuth);

const notFound = (res, message)=>res.status(404).json({ success : false, message });
const invalid = (res, message)=>res.status(400).json({ success : false, message });

router.post('/sessions', async (req,res)=>{
    try{
        const parsed = createSessionSchema.safeParse(req.body);
        if(!parsed.success){
            return invalid(res, firstIssue(parsed.error));
        }
        const { session, addPlaytimeToGameId } = parsed.data;

        let game = null;
        if(addPlaytimeToGameId){
            game = await Game.findOne({ _id : addPlaytimeToGameId, user : req.user.userId });
            if(!game){
                return notFound(res, "Game not found");
            }
        }

        const ratio = session.deaths === 0 ? session.kills : Number((session.kills / session.deaths).toFixed(2));
        const newSession = await Session.create({ ...session, ratio, user : req.user.userId });

        if(game){
            const hours = Math.round((session.duration / 60) * 100) / 100;
            game = await Game.findOneAndUpdate(
                { _id : game._id, user : req.user.userId },
                { $inc : { playtime : hours } },
                { returnDocument : 'after' }
            );
        }
        return res.status(201).json({
            success : true,
            session : newSession,
            game
        })
    }
    catch(error){
        console.log(error);
        return res.status(500).json({ success : false, message : "Server Error" });
    }
})

router.delete('/sessions/:sessionId', async (req,res)=>{
    try{
        if(!objectIdPattern.test(req.params.sessionId)){
            return notFound(res, "Session not found");
        }
        const parsed = deleteSessionSchema.safeParse(req.body || {});
        if(!parsed.success){
            return invalid(res, firstIssue(parsed.error));
        }
        const deletedSession = await Session.findOneAndDelete({ _id : req.params.sessionId, user : req.user.userId });
        if(!deletedSession){
            return notFound(res, "Session not found");
        }

        let game = null;
        const revert = parsed.data.revertPlaytime;
        if(revert){
            const existing = await Game.findOne({ _id : revert.gameId, user : req.user.userId });
            if(existing){
                const playtime = Math.max(0, Math.round((existing.playtime - revert.hours) * 100) / 100);
                game = await Game.findOneAndUpdate(
                    { _id : existing._id, user : req.user.userId },
                    { $set : { playtime } },
                    { returnDocument : 'after' }
                );
            }
        }
        return res.status(200).json({
            success : true,
            deletedSession,
            game
        })
    }
    catch(error){
        console.log(error);
        return res.status(500).json({ success : false, message : "Server Error" });
    }
})

router.patch('/games/:gameId', async (req,res)=>{
    try{
        if(!objectIdPattern.test(req.params.gameId)){
            return notFound(res, "Game not found");
        }
        const parsed = updateGameSchema.safeParse(req.body);
        if(!parsed.success){
            return invalid(res, firstIssue(parsed.error));
        }
        const updatedGame = await Game.findOneAndUpdate(
            { _id : req.params.gameId, user : req.user.userId },
            { $set : parsed.data.changes },
            { returnDocument : 'after', runValidators : true }
        );
        if(!updatedGame){
            return notFound(res, "Game not found");
        }
        return res.status(200).json({
            success : true,
            game : updatedGame
        })
    }
    catch(error){
        console.log(error);
        return res.status(500).json({ success : false, message : "Server Error" });
    }
})

module.exports = router;
