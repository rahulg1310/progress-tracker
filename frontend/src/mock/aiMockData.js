// MOCK DATA - Phase 1 only.
// Phase 2/3 replace these with responses from the Express /ai/* routes.
// The object shapes here are the API contract, so components will not change.

import { toDateKey, fromDateKey, formatMinutes, formatShortDate, daysBetween } from '../utils/formatTime';

export const mockDelay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const today = new Date();
today.setHours(0, 0, 0, 0);
const todayKey = toDateKey(today);

const addDays = (base, days) => {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

// Monday of the current week
const weekStart = addDays(today, -((today.getDay() + 6) % 7));
const weekEnd = addDays(weekStart, 6);

/* ---------------------------------------------------------------- INSIGHTS */

const weekPattern = [45, 0, 60, 0, 35, 90, 40];
const weekSessionsPattern = [1, 0, 2, 0, 1, 1, 1];

const weekDaily = weekPattern.map(function (minutes, idx) {
  const date = addDays(weekStart, idx);
  const isFuture = date > today;
  return {
    label: date.toLocaleDateString('en-US', { weekday: 'short' }),
    date: toDateKey(date),
    minutes: isFuture ? 0 : minutes,
    sessions: isFuture ? 0 : weekSessionsPattern[idx],
    isFuture,
  }
});

const sum = (arr, key) => arr.reduce((total, elem) => total + elem[key], 0);

const weekTotal = sum(weekDaily, 'minutes');
const weekSessions = sum(weekDaily, 'sessions');
const weekActiveDays = weekDaily.filter((elem) => elem.minutes > 0).length;
const prevWeekTotal = 180;
const prevWeekSessions = 3;

const avg = (total, count) => (count === 0 ? 0 : Math.round(total / count));

const describeDelta = (current, previous) => {
  const diff = current - previous;
  if (diff === 0) return 'the same as';
  return `${formatMinutes(Math.abs(diff))} ${diff > 0 ? 'more than' : 'less than'}`;
}

const weeklyPlaytimeGoalMinutes = 360;

const buildSummary = (period) => {
  const lines = [
    `You played ${describeDelta(period.totalMinutes, period.prevTotalMinutes)} last ${period.unit} (${formatMinutes(period.totalMinutes)} vs ${formatMinutes(period.prevTotalMinutes)}).`,
  ];
  if (period.avgSessionMinutes < period.prevAvgSessionMinutes) {
    lines.push(`Your sessions got shorter: ${formatMinutes(period.avgSessionMinutes)} on average, down from ${formatMinutes(period.prevAvgSessionMinutes)}.`);
  } else {
    lines.push(`Your sessions averaged ${formatMinutes(period.avgSessionMinutes)}, up from ${formatMinutes(period.prevAvgSessionMinutes)}.`);
  }
  lines.push(`You played on ${period.activeDays} different days.`);
  if (period.topGames.length > 0) {
    const top = period.topGames[0];
    lines.push(`${top.title} took ${Math.round((top.minutes / period.totalMinutes) * 100)}% of your playtime.`);
  }
  return lines;
}

const weekTopGames = [
  { title: 'Elden Ring', minutes: Math.round(weekTotal * 0.55), color: '#e7b427' },
  { title: 'Sekiro', minutes: Math.round(weekTotal * 0.3), color: '#e70d0d' },
  { title: 'Valorant', minutes: weekTotal - Math.round(weekTotal * 0.55) - Math.round(weekTotal * 0.3), color: '#5fc9ec' },
].filter((elem) => elem.minutes > 0);

const weekInsights = {
  unit: 'week',
  title: 'This Week',
  range: `${formatShortDate(toDateKey(weekStart))} - ${formatShortDate(toDateKey(weekEnd))}`,
  totalMinutes: weekTotal,
  prevTotalMinutes: prevWeekTotal,
  sessions: weekSessions,
  prevSessions: prevWeekSessions,
  avgSessionMinutes: avg(weekTotal, weekSessions),
  prevAvgSessionMinutes: avg(prevWeekTotal, prevWeekSessions),
  activeDays: weekActiveDays,
  prevActiveDays: 3,
  chart: weekDaily,
  topGames: weekTopGames,
  goal: { title: 'Weekly Playtime', current: weekTotal, target: weeklyPlaytimeGoalMinutes, unit: 'minutes' },
};
weekInsights.summary = buildSummary(weekInsights);
weekInsights.basedOn = `Based on ${weekSessions} sessions logged between ${weekInsights.range}.`;

const monthChart = [
  { label: 'Week 1', minutes: 210, sessions: 5, isFuture: false },
  { label: 'Week 2', minutes: 160, sessions: 4, isFuture: false },
  { label: 'Week 3', minutes: 180, sessions: 3, isFuture: false },
  { label: 'Week 4', minutes: weekTotal, sessions: weekSessions, isFuture: false },
];
const monthTotal = sum(monthChart, 'minutes');
const monthSessions = sum(monthChart, 'sessions');

const monthInsights = {
  unit: 'month',
  title: 'This Month',
  range: today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
  totalMinutes: monthTotal,
  prevTotalMinutes: 690,
  sessions: monthSessions,
  prevSessions: 15,
  avgSessionMinutes: avg(monthTotal, monthSessions),
  prevAvgSessionMinutes: avg(690, 15),
  activeDays: 15,
  prevActiveDays: 12,
  chart: monthChart,
  topGames: [
    { title: 'Elden Ring', minutes: Math.round(monthTotal * 0.48), color: '#e7b427' },
    { title: 'Sekiro', minutes: Math.round(monthTotal * 0.27), color: '#e70d0d' },
    { title: 'Valorant', minutes: Math.round(monthTotal * 0.15), color: '#5fc9ec' },
    { title: 'Cyberpunk 2077', minutes: monthTotal - Math.round(monthTotal * 0.48) - Math.round(monthTotal * 0.27) - Math.round(monthTotal * 0.15), color: '#f9e020' },
  ],
  goal: { title: 'Monthly Playtime', current: monthTotal, target: 1200, unit: 'minutes' },
};
monthInsights.summary = buildSummary(monthInsights);
monthInsights.basedOn = `Based on ${monthSessions} sessions logged in ${monthInsights.range}.`;

export const mockInsights = { week: weekInsights, month: monthInsights };

/* ------------------------------------------------------------------- GOALS */

export const goalTypes = {
  weekly_playtime: { label: 'Weekly Playtime', unit: 'minutes' },
  active_days: { label: 'Active Days', unit: 'days' },
  weekly_sessions: { label: 'Weekly Sessions', unit: 'sessions' },
  finish_game: { label: 'Finish a Game', unit: 'percent' },
};

export const mockGoals = [
  {
    _id: 'goal-1',
    type: 'weekly_playtime',
    title: 'Play 6h this week',
    targetValue: weeklyPlaytimeGoalMinutes,
    currentValue: weekTotal,
    gameTitle: '',
    endDate: toDateKey(weekEnd),
    status: weekTotal >= weeklyPlaytimeGoalMinutes ? 'met' : 'active',
  },
  {
    _id: 'goal-2',
    type: 'active_days',
    title: 'Play on 5 days this week',
    targetValue: 5,
    currentValue: weekActiveDays,
    gameTitle: '',
    endDate: toDateKey(weekEnd),
    status: weekActiveDays >= 5 ? 'met' : 'active',
  },
  {
    _id: 'goal-3',
    type: 'finish_game',
    title: 'Finish Cyberpunk 2077',
    targetValue: 100,
    currentValue: 34,
    gameTitle: 'Cyberpunk 2077',
    endDate: toDateKey(addDays(today, 9)),
    status: 'active',
    planId: 'plan-1',
  },
];

/* ------------------------------------------------------- QUEST PLANS */

// Deterministic plan builder. Phase 3 moves this logic to the FastAPI planner.
export const buildMockPlan = ({ goalId, gameTitle, colorAccent, startDate, endDate, dailyMinutes, estimatedHours }) => {
  const hasUserEstimate = Number(estimatedHours) > 0;
  const estimate = hasUserEstimate
    ? { hours: Number(estimatedHours), source: 'user', confidence: 'high', note: 'Based on the length you provided.' }
    : { hours: 20, source: 'model_estimate', confidence: 'low', note: 'Rough main-story estimate. Side content can add a lot of time.' };

  const totalDays = Math.max(1, daysBetween(startDate, endDate) + 1);
  const neededMinutes = estimate.hours * 60;
  const availableMinutes = totalDays * dailyMinutes;
  const start = fromDateKey(startDate);

  let cumulative = 0;
  const milestones = Array.from({ length: totalDays }, function (_, idx) {
    const date = toDateKey(addDays(start, idx));
    cumulative += dailyMinutes;
    const pct = Math.min(100, Math.round((cumulative / neededMinutes) * 100));
    return {
      _id: `${goalId}-m${idx + 1}`,
      date,
      targetMinutes: dailyMinutes,
      title: `Session ${idx + 1}: reach ~${pct}% of the estimate`,
      status: date < todayKey ? 'missed' : date === todayKey ? 'today' : 'upcoming',
    }
  });

  const feasible = availableMinutes >= neededMinutes;
  const suggestedDaily = Math.ceil(neededMinutes / totalDays);

  return {
    _id: `plan-${Date.now()}`,
    goalId,
    gameTitle,
    colorAccent: colorAccent || '#00f5a0',
    dailyMinutes,
    startDate,
    endDate,
    estimate,
    milestones,
    feasibility: feasible
      ? `At ${formatMinutes(dailyMinutes)} a day you should finish by ${formatShortDate(endDate)}.`
      : `At ${formatMinutes(dailyMinutes)} a day you'd reach about ${Math.round((availableMinutes / neededMinutes) * 100)}% by ${formatShortDate(endDate)}. Around ${formatMinutes(suggestedDaily)} a day would be enough.`,
    adjustmentNote: '',
    version: 1,
  }
}

// Spread missed minutes over the remaining days.
export const replanMock = (plan) => {
  const missed = plan.milestones.filter((elem) => elem.status === 'missed');
  const remaining = plan.milestones.filter((elem) => elem.status === 'today' || elem.status === 'upcoming');
  if (missed.length === 0 || remaining.length === 0) return plan;

  const missedMinutes = missed.reduce((total, elem) => total + elem.targetMinutes, 0);
  const extraPerDay = Math.ceil(missedMinutes / remaining.length);

  return {
    ...plan,
    milestones: plan.milestones.map(function (elem) {
      if (elem.status === 'today' || elem.status === 'upcoming') {
        return { ...elem, targetMinutes: elem.targetMinutes + extraPerDay };
      }
      if (elem.status === 'missed') {
        return { ...elem, status: 'skipped' };
      }
      return elem;
    }),
    adjustmentNote: `You missed ${missed.length} session${missed.length > 1 ? 's' : ''} (${formatMinutes(missedMinutes)}). Added ${formatMinutes(extraPerDay)} to each remaining day.`,
    version: plan.version + 1,
  }
}

const seededPlan = buildMockPlan({
  goalId: 'goal-3',
  gameTitle: 'Cyberpunk 2077',
  colorAccent: '#f9e020',
  startDate: toDateKey(addDays(today, -4)),
  endDate: toDateKey(addDays(today, 9)),
  dailyMinutes: 60,
  estimatedHours: 0,
});
seededPlan._id = 'plan-1';
seededPlan.milestones = seededPlan.milestones.map(function (elem, idx) {
  if (elem.status !== 'missed') return elem;
  return { ...elem, status: idx === 2 ? 'missed' : 'done' };
});

export const mockPlans = [seededPlan];

/* --------------------------------------------------------- PROGRESSION */

const lastSeven = Array.from({ length: 7 }, function (_, idx) {
  const date = addDays(today, idx - 6);
  const match = weekDaily.find((elem) => elem.date === toDateKey(date));
  return {
    label: date.toLocaleDateString('en-US', { weekday: 'narrow' }),
    date: toDateKey(date),
    logged: match ? match.minutes > 0 : idx % 2 === 0,
  }
});

let currentStreak = 0;
for (let i = lastSeven.length - 1; i >= 0; i--) {
  if (!lastSeven[i].logged) break;
  currentStreak++;
}

export const mockProgression = {
  level: 7,
  title: 'Veteran',
  xp: 2340,
  levelStartXp: 2100,
  nextLevelXp: 2600,
  streak: { current: currentStreak, longest: 9, days: lastSeven },
  consistency: { daysPlayed: weekActiveDays, target: 5 },
  badges: [
    { code: 'first_session', name: 'First Blood', description: 'Log your first session', earned: true, earnedAt: '2026-08-02', progress: 1, target: 1 },
    { code: 'streak_7', name: 'Week Warrior', description: 'Reach a 7-day streak', earned: true, earnedAt: '2026-09-14', progress: 7, target: 7 },
    { code: 'marathon', name: 'Marathon', description: 'Log a single session of 3h or more', earned: true, earnedAt: '2026-10-04', progress: 1, target: 1 },
    { code: 'goal_getter', name: 'Goal Getter', description: 'Meet 3 weekly goals', earned: false, progress: 2, target: 3 },
    { code: 'completionist', name: 'Completionist', description: 'Mark 5 games as Completed', earned: false, progress: 3, target: 5 },
    { code: 'genre_explorer', name: 'Genre Explorer', description: 'Play games from 5 different genres', earned: false, progress: 4, target: 5 },
    { code: 'clockwork', name: 'Clockwork', description: 'Meet your consistency goal 4 weeks in a row', earned: false, progress: 1, target: 4 },
    { code: 'streak_30', name: 'Unbreakable', description: 'Reach a 30-day streak', earned: false, progress: currentStreak, target: 30 },
  ],
  challenges: [
    { _id: 'ch-1', title: 'Weekend Push', description: 'Log 2 sessions of 45+ minutes before the week ends', progress: 1, target: 2, xp: 150, expiresAt: toDateKey(weekEnd), status: 'active' },
    { _id: 'ch-2', title: 'Backlog Breaker', description: 'Play any Backlog game for at least 30 minutes', progress: 0, target: 1, xp: 100, expiresAt: toDateKey(weekEnd), status: 'active' },
    { _id: 'ch-3', title: 'Early Start', description: 'Log a session on Monday', progress: 1, target: 1, xp: 50, expiresAt: toDateKey(weekEnd), status: 'completed' },
  ],
  recentXp: [
    { _id: 'xp-1', label: 'Logged a 40m session', xp: 20, date: todayKey },
    { _id: 'xp-2', label: 'Met "Play on 5 days" goal', xp: 100, date: todayKey },
    { _id: 'xp-3', label: 'Logged a 90m session', xp: 45, date: toDateKey(addDays(today, -1)) },
    { _id: 'xp-4', label: 'Completed "Early Start"', xp: 50, date: toDateKey(addDays(today, -6)) },
  ],
};

const challengePool = [
  { title: 'Deep Focus', description: 'Log one uninterrupted session of 2h or more', target: 1, xp: 120 },
  { title: 'Variety Pack', description: 'Play 3 different games this week', target: 3, xp: 150 },
  { title: 'Finisher', description: 'Raise any Playing game\'s progress by 10%', target: 10, xp: 180 },
];

export const generateMockChallenge = (existingCount) => {
  const pick = challengePool[existingCount % challengePool.length];
  return {
    _id: `ch-${Date.now()}`,
    ...pick,
    progress: 0,
    expiresAt: toDateKey(addDays(today, 7)),
    status: 'active',
  }
}

/* --------------------------------------------------------------- BRIEFING */

const goalGap = Math.max(0, weeklyPlaytimeGoalMinutes - weekTotal);

export const mockBriefing = {
  date: todayKey,
  headline: goalGap > 0
    ? `You're ${formatMinutes(goalGap)} away from your weekly goal`
    : 'Weekly playtime goal reached',
  text: goalGap > 0
    ? `You've logged ${formatMinutes(weekTotal)} of your ${formatMinutes(weeklyPlaytimeGoalMinutes)} weekly goal across ${weekSessions} sessions. One ${formatMinutes(goalGap)} session gets you there.`
    : `You've logged ${formatMinutes(weekTotal)} this week, beating your ${formatMinutes(weeklyPlaytimeGoalMinutes)} goal. Nice consistency.`,
  items: [
    { label: 'Weekly Goal', value: `${formatMinutes(weekTotal)} / ${formatMinutes(weeklyPlaytimeGoalMinutes)}`, tone: 'cyan' },
    { label: 'Streak', value: `${currentStreak} day${currentStreak === 1 ? '' : 's'}`, tone: 'orange' },
    { label: 'vs Last Week', value: `${weekTotal >= prevWeekTotal ? '+' : '-'}${formatMinutes(Math.abs(weekTotal - prevWeekTotal))}`, tone: weekTotal >= prevWeekTotal ? 'green' : 'red' },
  ],
  prompt: 'Help me plan sessions to hit my weekly goal',
};

/* -------------------------------------------------------------- DISCOVER */

const recommendationPool = [
  {
    _id: 'rec-1', title: 'Lies of P', genres: ['Action RPG', 'Soulslike'], platforms: ['PC', 'PS5', 'PS4', 'Xbox'],
    released: '2023', estHours: 30, colorAccent: '#e7b427', match: 94,
    reasons: ['Parry-focused boss fights like Sekiro', 'Demanding combat you clearly enjoy', 'Single-player and story driven'],
  },
  {
    _id: 'rec-2', title: 'Wo Long: Fallen Dynasty', genres: ['Action RPG', 'Soulslike'], platforms: ['PC', 'PS5', 'PS4', 'Xbox'],
    released: '2023', estHours: 35, colorAccent: '#e70d0d', match: 90,
    reasons: ['Deflect-centric combat close to Sekiro', 'Mythology-inspired setting like Black Myth: Wukong', 'Fast, aggressive pacing'],
  },
  {
    _id: 'rec-3', title: 'Nioh 2', genres: ['Action RPG'], platforms: ['PC', 'PS5', 'PS4'],
    released: '2020', estHours: 50, colorAccent: '#a78bfa', match: 87,
    reasons: ['Japanese folklore setting', 'Deep build and stance system', 'Long campaign for the hours you put in'],
  },
  {
    _id: 'rec-4', title: 'Sifu', genres: ['Action', 'Beat \'em up'], platforms: ['PC', 'PS5', 'PS4', 'Xbox', 'Switch'],
    released: '2022', estHours: 12, colorAccent: '#00d9f5', match: 81,
    reasons: ['Precise, timing-based martial arts combat', 'Short enough to finish in two weeks', 'Rewards mastery through repetition'],
  },
  {
    _id: 'rec-5', title: 'Hollow Knight', genres: ['Metroidvania'], platforms: ['PC', 'PS4', 'Xbox', 'Switch'],
    released: '2017', estHours: 30, colorAccent: '#5fc9ec', match: 76,
    reasons: ['Tough, pattern-based bosses', 'Different genre to keep things fresh', 'Great value for the playtime'],
  },
];

// Excludes games the user already owns (case-insensitive title match).
export const getMockRecommendations = (libraryTitles) => {
  const owned = libraryTitles.map((title) => title.toLowerCase());
  return recommendationPool.filter((elem) => !owned.includes(elem.title.toLowerCase()));
}
