// Tests for the /internal write API used by the AI service.
// Auth and validation tests always run. Database tests run only when
// TEST_MONGO_URI points at a throwaway MongoDB:
//   $env:TEST_MONGO_URI="mongodb://127.0.0.1:27017/kairo_test"; npm test
process.env.SERVICE_AUTH_SECRET = process.env.SERVICE_AUTH_SECRET || 'test-service-secret-that-is-at-least-32-chars';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const request = require('supertest');

const internalRoutes = require('../routes/internal');
const Game = require('../models/Game');
const Session = require('../models/Session');

const USER_A = '64b7f0c2a1b2c3d4e5f60718';
const USER_B = '64b7f0c2a1b2c3d4e5f60719';
const withDb = { skip : !process.env.TEST_MONGO_URI && 'TEST_MONGO_URI not set' };

const app = express();
app.use(express.json({ verify : (req,res,buf)=>{ req.rawBody = buf; } }));
app.use('/internal', internalRoutes);

// Signs the way ai-service/app/clients/core_api.py does
const sign = (userId, raw, overrides = {})=>jwt.sign(
    { bh : crypto.createHash('sha256').update(raw).digest('hex'), ...overrides.claims },
    overrides.secret || process.env.SERVICE_AUTH_SECRET,
    { algorithm : 'HS256', audience : overrides.audience || 'kairo-core', issuer : overrides.issuer || 'kairo-ai', subject : userId, expiresIn : 60, jwtid : crypto.randomUUID() }
);

const call = (method, path, userId, body, overrides)=>{
    const raw = body === undefined ? '' : JSON.stringify(body);
    let req = request(app)[method](path).set('Authorization', `Bearer ${sign(userId, raw, overrides)}`);
    if(raw){
        req = req.set('Content-Type', 'application/json').send(raw);
    }
    return req;
}

const today = new Date().toISOString().slice(0, 10);
const validSession = { session : { game : 'Elden Ring', duration : 90, date : today } };

test('rejects a missing token', async ()=>{
    const res = await request(app).post('/internal/sessions').send(validSession);
    assert.equal(res.status, 401);
});

test('rejects the browser-facing token audience', async ()=>{
    const res = await call('post', '/internal/sessions', USER_A, validSession, { audience : 'kairo-ai', issuer : 'kairo-core' });
    assert.equal(res.status, 401);
});

test('rejects a wrong secret', async ()=>{
    const res = await call('post', '/internal/sessions', USER_A, validSession, { secret : 'another-secret-that-is-also-long-enough-123' });
    assert.equal(res.status, 401);
});

test('rejects a body that does not match the token', async ()=>{
    const token = sign(USER_A, JSON.stringify(validSession));
    const res = await request(app).post('/internal/sessions').set('Authorization', `Bearer ${token}`)
        .send({ session : { ...validSession.session, duration : 600 } });
    assert.equal(res.status, 401);
    assert.equal(res.body.message, 'Request body does not match token');
});

test('rejects a replayed token', async ()=>{
    const raw = JSON.stringify({ session : { game : 'X', duration : 0, date : today } }); // invalid on purpose: no DB write
    const token = sign(USER_A, raw);
    const send = ()=>request(app).post('/internal/sessions').set('Authorization', `Bearer ${token}`).set('Content-Type', 'application/json').send(raw);
    assert.equal((await send()).status, 400);
    assert.equal((await send()).status, 401);
});

test('validates session input', async ()=>{
    const bad = [
        { session : { ...validSession.session, duration : 0 } },
        { session : { ...validSession.session, duration : 2000 } },
        { session : { ...validSession.session, date : '2999-01-01' } },
        { session : { ...validSession.session, date : 'yesterday' } },
        { session : { ...validSession.session, mood : 'Angry' } },
        { session : { ...validSession.session, user : USER_B } },
        { ...validSession, addPlaytimeToGameId : 'nope' },
    ];
    for(const body of bad){
        const res = await call('post', '/internal/sessions', USER_A, body);
        assert.equal(res.status, 400, JSON.stringify(body));
    }
});

test('validates game updates', async ()=>{
    const id = '64b7f0c2a1b2c3d4e5f6aaaa';
    assert.equal((await call('patch', `/internal/games/${id}`, USER_A, { changes : {} })).status, 400);
    assert.equal((await call('patch', `/internal/games/${id}`, USER_A, { changes : { progress : 150 } })).status, 400);
    assert.equal((await call('patch', `/internal/games/${id}`, USER_A, { changes : { status : 'Finished' } })).status, 400);
    assert.equal((await call('patch', `/internal/games/${id}`, USER_A, { changes : { user : USER_B } })).status, 400);
    assert.equal((await call('patch', '/internal/games/abc', USER_A, { changes : { progress : 5 } })).status, 404);
});

describeDb();

function describeDb(){
    before(async ()=>{
        if(process.env.TEST_MONGO_URI){
            await mongoose.connect(process.env.TEST_MONGO_URI);
            await Promise.all([Game.deleteMany({ user : { $in : [USER_A, USER_B] } }), Session.deleteMany({ user : { $in : [USER_A, USER_B] } })]);
        }
    });
    after(async ()=>{
        if(process.env.TEST_MONGO_URI){
            await Promise.all([Game.deleteMany({ user : { $in : [USER_A, USER_B] } }), Session.deleteMany({ user : { $in : [USER_A, USER_B] } })]);
            await mongoose.disconnect();
        }
    });

    test('creates a session and adds playtime to the owner\'s game', withDb, async ()=>{
        const game = await Game.create({ user : USER_A, title : 'Elden Ring', genre : 'RPG', playtime : 10 });
        const res = await call('post', '/internal/sessions', USER_A, { session : { game : 'Elden Ring', duration : 90, date : today, kills : 4, deaths : 2 }, addPlaytimeToGameId : String(game._id) });
        assert.equal(res.status, 201);
        assert.equal(res.body.session.user, USER_A);
        assert.equal(res.body.session.ratio, 2);
        assert.equal(res.body.game.playtime, 11.5);
    });

    test('cannot add playtime to someone else\'s game', withDb, async ()=>{
        const game = await Game.create({ user : USER_B, title : 'Sekiro', genre : 'Action', playtime : 5 });
        const res = await call('post', '/internal/sessions', USER_A, { ...validSession, addPlaytimeToGameId : String(game._id) });
        assert.equal(res.status, 404);
        assert.equal((await Game.findById(game._id)).playtime, 5);
        assert.equal(await Session.countDocuments({ user : USER_A, game : 'Elden Ring', duration : 90, kills : 0 }), 0);
    });

    test('updates only the owner\'s game', withDb, async ()=>{
        const game = await Game.create({ user : USER_A, title : 'Cyberpunk 2077', genre : 'RPG' });
        assert.equal((await call('patch', `/internal/games/${game._id}`, USER_B, { changes : { status : 'Completed' } })).status, 404);
        const res = await call('patch', `/internal/games/${game._id}`, USER_A, { changes : { status : 'Completed', progress : 100 } });
        assert.equal(res.status, 200);
        assert.equal(res.body.game.status, 'Completed');
        assert.equal(res.body.game.progress, 100);
    });

    test('deletes only the owner\'s session and can restore playtime', withDb, async ()=>{
        const game = await Game.create({ user : USER_A, title : 'Hades', genre : 'Roguelike', playtime : 3 });
        const session = await Session.create({ user : USER_A, game : 'Hades', duration : 60, date : today });
        assert.equal((await call('delete', `/internal/sessions/${session._id}`, USER_B, {})).status, 404);
        const res = await call('delete', `/internal/sessions/${session._id}`, USER_A, { revertPlaytime : { gameId : String(game._id), hours : 1 } });
        assert.equal(res.status, 200);
        assert.equal(res.body.game.playtime, 2);
        assert.equal(await Session.countDocuments({ _id : session._id }), 0);
    });
}
