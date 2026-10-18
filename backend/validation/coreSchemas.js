const { z } = require('zod');

// Second line of validation for writes requested by the AI service.
// FastAPI validates tool arguments first; Express re-checks before touching MongoDB.
const objectId = z.string().regex(/^[a-f0-9]{24}$/, 'Invalid id');
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').refine((value)=>{
    const day = new Date(`${value}T00:00:00Z`);
    if(Number.isNaN(day.getTime())) return false;
    const tomorrow = Date.now() + 36 * 60 * 60 * 1000; // allow for time zones ahead of UTC
    return day.getUTCFullYear() >= 2000 && day.getTime() <= tomorrow;
}, 'Date must be a real date and not in the future');

const STATUSES = ['Playing', 'Completed', 'Backlog', 'Dropped'];
const RESULTS = ['', 'Win', 'Loss', 'Draw'];
const MOODS = ['', 'Focused', 'Tilted', 'Relaxed', 'Tryhard', 'Casual'];

const createSessionSchema = z.object({
    session : z.object({
        game : z.string().trim().min(1).max(100),
        duration : z.number().int().min(1).max(1440),
        date : dateString,
        kills : z.number().int().min(0).max(10000).default(0),
        deaths : z.number().int().min(0).max(10000).default(0),
        assists : z.number().int().min(0).max(10000).default(0),
        result : z.enum(RESULTS).default(''),
        mood : z.enum(MOODS).default(''),
        rankBefore : z.string().max(40).default(''),
        rankAfter : z.string().max(40).default('')
    }).strict(),
    addPlaytimeToGameId : objectId.optional()
}).strict();

const deleteSessionSchema = z.object({
    revertPlaytime : z.object({
        gameId : objectId,
        hours : z.number().min(0).max(24)
    }).strict().optional()
}).strict();

const updateGameSchema = z.object({
    changes : z.object({
        status : z.enum(STATUSES).optional(),
        progress : z.number().int().min(0).max(100).optional(),
        rating : z.number().min(0).max(10).optional(),
        playtime : z.number().min(0).max(100000).optional(),
        achievementsEarned : z.number().int().min(0).max(100000).optional(),
        notes : z.string().max(2000).optional()
    }).strict().refine((changes)=>Object.keys(changes).length > 0, 'No changes given')
}).strict();

const firstIssue = (error)=>{
    const issue = error.issues[0];
    const path = issue.path.join('.');
    return path ? `${path}: ${issue.message}` : issue.message;
}

module.exports = { createSessionSchema, deleteSessionSchema, updateGameSchema, firstIssue, objectId };
