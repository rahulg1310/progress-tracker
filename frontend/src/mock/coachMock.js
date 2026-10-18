// MOCK COACH - Phase 1 only.
// A tiny keyword-based responder that returns the same message shape the
// FastAPI agent will return in Phase 2/3. Delete this file once /ai/chat is live.

import { formatMinutes, toDateKey, formatShortDate } from '../utils/formatTime';

const now = () => new Date().toISOString();
const newId = (prefix) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

const minutesAgo = (mins) => new Date(Date.now() - mins * 60 * 1000).toISOString();
const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

/* ------------------------------------------------------------ SEED DATA */

export const mockConversations = [
  { _id: 'conv-1', title: 'Stuck on Malenia', lastMessageAt: minutesAgo(40) },
  { _id: 'conv-2', title: 'Weekly recap', lastMessageAt: daysAgo(2) },
];

export const mockMessages = {
  'conv-1': [
    { _id: 'm-1', role: 'user', text: "I've been stuck on Malenia in Elden Ring for two hours. What should I do?", createdAt: minutesAgo(46) },
    {
      _id: 'm-2', role: 'assistant', createdAt: minutesAgo(45),
      text: "That's a tough wall. You've logged 3 Elden Ring sessions this week (2h 30m total), so you've had real practice on her patterns.\n\nBefore I suggest a strategy, two quick questions:",
      quickReplies: ['I use a strength build', 'I use a dexterity build', 'Waterfowl Dance keeps killing me'],
    },
    { _id: 'm-3', role: 'user', text: 'Waterfowl Dance keeps killing me', createdAt: minutesAgo(42) },
    {
      _id: 'm-4', role: 'assistant', createdAt: minutesAgo(41),
      text: "Waterfowl is the move to solve first. Common approaches:\n\n1. When she leaps, sprint away immediately to dodge the first flurry, then dodge through the second.\n2. Use a quick interrupt (a jumping attack or a stance-breaking skill) when she starts the leap.\n3. Practise only phase one for a few runs before going for full attempts.\n\nGame tips like these come from general knowledge, not your data, so treat them as suggestions to try. Want me to log today's attempts as a session?",
      quickReplies: ['Log a 60 minute Elden Ring session today'],
    },
  ],
  'conv-2': [
    { _id: 'm-5', role: 'user', text: 'How did my week go?', createdAt: daysAgo(2) },
    {
      _id: 'm-6', role: 'assistant', createdAt: daysAgo(2),
      text: 'Solid week. Here is what your sessions show:',
      stats: [
        { label: 'Playtime', value: '3h' },
        { label: 'Sessions', value: '3' },
        { label: 'Avg Session', value: '1h' },
        { label: 'Active Days', value: '3' },
      ],
      links: [{ label: 'Open Insights', to: '/insights' }],
    },
  ],
};

export const mockMemories = [
  { _id: 'mem-1', kind: 'preference', text: 'Prefers parry-focused action games like Sekiro', createdAt: daysAgo(12) },
  { _id: 'mem-2', kind: 'context', text: 'Usually plays about 1 hour on weekdays', createdAt: daysAgo(9) },
  { _id: 'mem-3', kind: 'struggle', text: "Stuck on Malenia's Waterfowl Dance in Elden Ring", createdAt: minutesAgo(41) },
  { _id: 'mem-4', kind: 'goal', text: 'Wants to finish Cyberpunk 2077 within two weeks', createdAt: daysAgo(4) },
];

export const suggestedPrompts = [
  "I'm stuck on a boss. What should I do?",
  'Log a 90 minute session today',
  'How did my week go compared to last week?',
  'What should I play next?',
];

/* ------------------------------------------------------------ RESPONDER */

const findGame = (text, games) => {
  const lower = text.toLowerCase();
  return games.find((elem) => lower.includes(elem.title.toLowerCase()))
    || games.find((elem) => {
      const firstWord = elem.title.toLowerCase().split(' ')[0];
      return firstWord.length > 3 && lower.includes(firstWord);
    });
}

const parseMinutes = (text) => {
  const match = text.toLowerCase().match(/(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours|m|min|mins|minute|minutes)\b/);
  if (!match) return null;
  const value = Number(match[1]);
  return match[2].startsWith('h') ? Math.round(value * 60) : Math.round(value);
}

const assistant = (fields) => ({ _id: newId('m'), role: 'assistant', createdAt: now(), ...fields });

const askWhichGame = (games, verb) => assistant({
  text: games.length === 0
    ? `Your library is empty, so I can't ${verb} yet. Add a game in the Library first.`
    : `Which game should I ${verb}?`,
  quickReplies: games.slice(0, 4).map((elem) => elem.title),
  links: games.length === 0 ? [{ label: 'Open Library', to: '/library' }] : [],
});

export const mockCoachReply = (text, games) => {
  const lower = text.toLowerCase();

  if (lower.includes('#fail')) {
    throw new Error('Simulated AI failure');
  }

  const game = findGame(text, games);
  const minutes = parseMinutes(text);

  // 1. Log a session -> runs immediately, can be undone
  if (/\b(log|logged|played)\b/.test(lower)) {
    if (!minutes) {
      return assistant({ text: 'How long was the session?', quickReplies: ['30 minutes', '1 hour', '90 minutes', '2 hours'] });
    }
    if (!game) return askWhichGame(games, 'log this session for');
    const todayKey = toDateKey(new Date());
    return assistant({
      text: `Logged ${formatMinutes(minutes)} of ${game.title} for today. That brings this week to ${formatMinutes(270 + minutes)}.`,
      actions: [{
        _id: newId('act'),
        type: 'session_logged',
        status: 'done',
        title: 'Session logged',
        details: [
          { label: 'Game', value: game.title },
          { label: 'Duration', value: formatMinutes(minutes) },
          { label: 'Date', value: formatShortDate(todayKey) },
          { label: 'Game playtime', value: `+${(minutes / 60).toFixed(1)}h` },
        ],
        undoUntil: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      }],
      stats: [
        { label: 'This Week', value: formatMinutes(270 + minutes) },
        { label: 'Weekly Goal', value: '6h' },
      ],
    });
  }

  // 2. Update a game -> needs confirmation
  if (/\b(complete|completed|finished|mark|progress|status)\b/.test(lower)) {
    if (!game) return askWhichGame(games, 'update');
    const pctMatch = lower.match(/(\d{1,3})\s*%/);
    const change = pctMatch
      ? { label: 'Progress', from: `${game.progress}%`, to: `${Math.min(100, Number(pctMatch[1]))}%` }
      : { label: 'Status', from: game.status, to: 'Completed' };
    return assistant({
      text: `I'll update ${game.title}. Please confirm the change below.`,
      actions: [{
        _id: newId('act'),
        type: 'update_game',
        status: 'pending',
        title: `Update ${game.title}`,
        details: [{ label: change.label, value: `${change.from} → ${change.to}` }],
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      }],
    });
  }

  // 3. Delete -> needs confirmation
  if (/\b(delete|remove)\b/.test(lower)) {
    return assistant({
      text: "I found your most recent session. Deleting can't be undone, so please confirm.",
      actions: [{
        _id: newId('act'),
        type: 'delete_session',
        status: 'pending',
        title: 'Delete session',
        details: [
          { label: 'Game', value: game ? game.title : 'Valorant' },
          { label: 'Duration', value: '40m' },
          { label: 'Date', value: formatShortDate(toDateKey(new Date())) },
        ],
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      }],
    });
  }

  // 4. Coaching
  if (/\b(stuck|boss|beat|help|tips?|strategy)\b/.test(lower)) {
    return assistant({
      text: game
        ? `Let's work on ${game.title}. You're at ${game.progress}% progress with ${game.playtime}h played. Which part are you stuck on, and what's your current build or loadout?`
        : 'Happy to help. Which game and which boss or section are you stuck on?',
      quickReplies: games.slice(0, 3).map((elem) => `I'm stuck in ${elem.title}`),
    });
  }

  // 5. Stats
  if (/\b(week|month|stats|playtime|recap|compare)\b/.test(lower)) {
    return assistant({
      text: 'You played 1h 30m more than last week, but your sessions got shorter (45m on average, down from 1h).',
      stats: [
        { label: 'This Week', value: '4h 30m' },
        { label: 'Last Week', value: '3h' },
        { label: 'Sessions', value: '6' },
        { label: 'Avg Session', value: '45m' },
      ],
      links: [{ label: 'Open Insights', to: '/insights' }],
    });
  }

  // 6. Discovery
  if (/\b(recommend|play next|suggest|similar)\b/.test(lower)) {
    return assistant({
      text: 'Based on your library, parry-heavy action RPGs fit you best. Lies of P and Wo Long: Fallen Dynasty are the strongest matches. Open Discover to compare them side by side.',
      links: [{ label: 'Open Discover', to: '/discover' }],
    });
  }

  // 7. Goals and plans
  if (/\b(goal|plan|schedule|finish)\b/.test(lower)) {
    return assistant({
      text: 'I can build a day-by-day plan. Tell me the game, your deadline and how long you can play each day, or set it up on the Goals page.',
      links: [{ label: 'Open Goals', to: '/goals' }],
    });
  }

  return assistant({
    text: "I can coach you through tough sections, log sessions, analyse your progress, plan goals and recommend games. What would you like to do?",
    quickReplies: suggestedPrompts.slice(0, 3),
  });
}

export const mockActionFollowUp = (action, status) => {
  const messages = {
    confirmed: {
      update_game: 'Done. Your game has been updated.',
      delete_session: 'Done. The session was deleted.',
    },
    cancelled: 'Cancelled. Nothing was changed.',
    undone: 'Undone. The session was removed and your playtime restored.',
  };
  const text = status === 'confirmed' ? messages.confirmed[action.type] : messages[status];
  return assistant({ text });
}

export const newConversationTitle = (text) => {
  const clean = text.trim().replace(/\s+/g, ' ');
  return clean.length > 32 ? `${clean.slice(0, 32)}...` : clean;
}
