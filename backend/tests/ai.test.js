// Run with: npm test   (uses Node's built-in test runner, no database needed)
process.env.JWT_SECRET = 'test-login-secret';
process.env.SERVICE_AUTH_SECRET = 'test-service-secret-that-is-at-least-32-chars';
process.env.AI_CHAT_PER_MINUTE = '3';

const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const crypto = require('node:crypto');
const express = require('express');
const jwt = require('jsonwebtoken');
const request = require('supertest');

const aiRoutes = require('../routes/ai');

const USER_A = '64b7f0c2a1b2c3d4e5f60718';
const USER_B = '64b7f0c2a1b2c3d4e5f60719';
const loginToken = (userId)=>jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn : '7d' });

// A stand-in for the FastAPI service that records and verifies what Express sends.
let stub;
let received = [];
let nextResponse = null;

before(async ()=>{
    stub = http.createServer((req,res)=>{
        let raw = '';
        req.on('data', (chunk)=>{ raw += chunk; });
        req.on('end', ()=>{
            const token = (req.headers.authorization || '').replace('Bearer ', '');
            const claims = jwt.verify(token, process.env.SERVICE_AUTH_SECRET, { audience : 'kairo-ai', issuer : 'kairo-core', algorithms : ['HS256'] });
            received.push({ method : req.method, url : req.url, raw, claims, headers : req.headers });
            const { status, body } = nextResponse || { status : 200, body : { success : true, echo : raw ? JSON.parse(raw) : null } };
            res.writeHead(status, { 'Content-Type' : 'application/json' });
            res.end(JSON.stringify(body));
        });
    });
    await new Promise((resolve)=>stub.listen(0, '127.0.0.1', resolve));
    process.env.AI_SERVICE_URL = `http://127.0.0.1:${stub.address().port}`;
});

after(()=>stub.close());

beforeEach(()=>{
    received = [];
    nextResponse = null;
});

const makeApp = ()=>{
    const app = express();
    app.use(express.json());
    app.use('/ai', aiRoutes);
    return app;
}
const app = makeApp();

test('rejects requests without a login token', async ()=>{
    const res = await request(app).post('/ai/chat').send({ message : 'hi' });
    assert.equal(res.status, 401);
    assert.equal(received.length, 0);
});

test('forwards chat with a signed service token for the logged-in user', async ()=>{
    const res = await request(app)
        .post('/ai/chat')
        .set('Authorization', `Bearer ${loginToken(USER_A)}`)
        .set('X-Timezone', 'Asia/Kolkata')
        .send({ message : '  Help with Malenia  ', userId : USER_B, role : 'admin' });
    assert.equal(res.status, 200);
    assert.equal(received.length, 1);
    const call = received[0];
    assert.equal(call.url, '/v1/chat');
    assert.equal(call.claims.sub, USER_A);                       // from the login JWT, not the body
    assert.deepEqual(JSON.parse(call.raw), { message : 'Help with Malenia' }); // extra fields dropped
    assert.equal(call.claims.bh, crypto.createHash('sha256').update(call.raw).digest('hex'));
    assert.ok(call.claims.exp - call.claims.iat <= 60);
    assert.ok(call.claims.jti);
    assert.equal(call.headers['x-timezone'], 'Asia/Kolkata');
});

test('drops an invalid timezone header', async ()=>{
    await request(app).get('/ai/conversations').set('Authorization', `Bearer ${loginToken(USER_A)}`).set('X-Timezone', '../../etc');
    assert.equal(received[0].headers['x-timezone'], undefined);
});

test('validates chat input before calling the AI service', async ()=>{
    const auth = `Bearer ${loginToken(USER_B)}`;
    assert.equal((await request(app).post('/ai/chat').set('Authorization', auth).send({ message : '   ' })).status, 400);
    assert.equal((await request(app).post('/ai/chat').set('Authorization', auth).send({ message : 'x'.repeat(2001) })).status, 400);
    assert.equal((await request(app).post('/ai/chat').set('Authorization', auth).send({ message : 'hi', conversationId : '../x' })).status, 400);
    assert.equal(received.length, 0);
});

test('rejects malformed ids in the URL', async ()=>{
    const res = await request(app).get('/ai/conversations/abc/messages').set('Authorization', `Bearer ${loginToken(USER_A)}`);
    assert.equal(res.status, 404);
    assert.equal(received.length, 0);
});

test('passes AI service errors through unchanged', async ()=>{
    nextResponse = { status : 503, body : { success : false, code : 'AI_QUOTA_EXCEEDED', message : 'Coach has reached its free usage limit for now.' } };
    const res = await request(app).get('/ai/memories').set('Authorization', `Bearer ${loginToken(USER_A)}`);
    assert.equal(res.status, 503);
    assert.equal(res.body.code, 'AI_QUOTA_EXCEEDED');
});

test('GET requests sign an empty body', async ()=>{
    await request(app).get('/ai/conversations').set('Authorization', `Bearer ${loginToken(USER_A)}`);
    assert.equal(received[0].raw, '');
    assert.equal(received[0].claims.bh, crypto.createHash('sha256').update('').digest('hex'));
});

test('reports a friendly error when the AI service is down', async ()=>{
    const saved = process.env.AI_SERVICE_URL;
    process.env.AI_SERVICE_URL = 'http://127.0.0.1:1';
    const res = await request(app).get('/ai/health').set('Authorization', `Bearer ${loginToken(USER_A)}`);
    process.env.AI_SERVICE_URL = saved;
    assert.equal(res.status, 503);
    assert.equal(res.body.code, 'AI_UNREACHABLE');
});

test('limits chat messages per user', async ()=>{
    const limitedApp = makeApp();
    const userC = '64b7f0c2a1b2c3d4e5f6071a';
    const send = ()=>request(limitedApp).post('/ai/chat').set('Authorization', `Bearer ${loginToken(userC)}`).send({ message : 'hi' });
    // USER_C has not been used by other tests; limit is 3/minute in this file
    const statuses = [];
    for(let i=0; i<4; i++){
        statuses.push((await send()).status);
    }
    assert.deepEqual(statuses, [200, 200, 200, 429]);
});

test('forwards action confirmations with the user from the login token', async ()=>{
    const actionId = '64b7f0c2a1b2c3d4e5f6aaaa';
    const res = await request(app).post(`/ai/actions/${actionId}/confirm`).set('Authorization', `Bearer ${loginToken(USER_A)}`);
    assert.equal(res.status, 200);
    assert.equal(received[0].url, `/v1/actions/${actionId}/confirm`);
    assert.equal(received[0].claims.sub, USER_A);
    assert.equal((await request(app).post(`/ai/actions/${actionId}/delete-everything`).set('Authorization', `Bearer ${loginToken(USER_A)}`)).status, 404);
    assert.equal((await request(app).post('/ai/actions/xyz/confirm').set('Authorization', `Bearer ${loginToken(USER_A)}`)).status, 404);
    assert.equal(received.length, 1);
});

test('validates and whitelists plan creation', async ()=>{
    const auth = `Bearer ${loginToken(USER_A)}`;
    const gameId = '64b7f0c2a1b2c3d4e5f6bbbb';
    const bad = [
        { gameId : 'x', endDate : '2026-11-01', dailyMinutes : 60 },
        { gameId, endDate : 'soon', dailyMinutes : 60 },
        { gameId, endDate : '2026-11-01', dailyMinutes : 5 },
        { gameId, endDate : '2026-11-01', dailyMinutes : 60, estimatedHours : -3 },
    ];
    for(const body of bad){
        assert.equal((await request(app).post('/ai/plans').set('Authorization', auth).send(body)).status, 400, JSON.stringify(body));
    }
    assert.equal(received.length, 0);
    const ok = await request(app).post('/ai/plans').set('Authorization', auth).send({ gameId, endDate : '2026-11-01', dailyMinutes : 60, userId : USER_B });
    assert.equal(ok.status, 200);
    assert.deepEqual(JSON.parse(received[0].raw), { gameId, endDate : '2026-11-01', dailyMinutes : 60 });
});

test('validates goals and recommendations before forwarding', async ()=>{
    const USER_D = '64b7f0c2a1b2c3d4e5f6071b'; // fresh user: chat-style limits are 3/minute in this file
    const auth = `Bearer ${loginToken(USER_D)}`;
    assert.equal((await request(app).post('/ai/goals').set('Authorization', auth).send({ type : 'laps', target : 3, endDate : '2026-10-25' })).status, 400);
    assert.equal((await request(app).post('/ai/goals').set('Authorization', auth).send({ type : 'active_days', target : -1, endDate : '2026-10-25' })).status, 400);
    assert.equal((await request(app).post('/ai/recommendations').set('Authorization', auth).send({ likedGames : 'Sekiro' })).status, 400);
    assert.equal((await request(app).post('/ai/recommendations').set('Authorization', auth).send({ platform : 'Dreamcast' })).status, 400);
    assert.equal(received.length, 0);

    await request(app).post('/ai/goals').set('Authorization', auth).send({ type : 'active_days', target : 4, endDate : '2026-10-25', userId : USER_A });
    assert.deepEqual(JSON.parse(received[0].raw), { type : 'active_days', target : 4, endDate : '2026-10-25' });
    assert.equal(received[0].claims.sub, USER_D);

    await request(app).post('/ai/recommendations').set('Authorization', auth).send({ likedGames : [' Sekiro '], platform : 'Any' });
    assert.deepEqual(JSON.parse(received[1].raw), { likedGames : ['Sekiro'], mood : '' });
});

test('forwards read endpoints', async ()=>{
    const auth = `Bearer ${loginToken(USER_A)}`;
    for(const path of ['overview', 'insights', 'goals', 'briefing']){
        assert.equal((await request(app).get(`/ai/${path}`).set('Authorization', auth)).status, 200);
    }
    assert.deepEqual(received.map((r)=>r.url), ['/v1/overview', '/v1/insights', '/v1/goals', '/v1/briefing']);
});
