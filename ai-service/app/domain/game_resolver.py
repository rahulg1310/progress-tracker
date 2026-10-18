"""Matches what the player typed ("sekiro", "cp2077", "elden") to a game in their library."""

import re
from difflib import SequenceMatcher

ACCEPT_SCORE = 0.85
CANDIDATE_SCORE = 0.5


def normalize(text: str) -> str:
    text = text.lower().replace("&", "and")
    text = re.sub(r"[^a-z0-9 ]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def _initials(text: str) -> str:
    return "".join(word[0] for word in normalize(text).split() if word)


def score(query: str, title: str) -> float:
    q, t = normalize(query), normalize(title)
    if not q or not t:
        return 0.0
    if q == t:
        return 1.0
    if t.startswith(q + " ") or q.startswith(t + " "):
        return 0.95
    if f" {q} " in f" {t} ":
        return 0.9 if len(q) >= 4 else 0.7
    q_compact, t_compact = q.replace(" ", ""), t.replace(" ", "")
    if q_compact == t_compact:
        return 0.98
    if len(q_compact) >= 3 and q_compact == _initials(title):
        return 0.86
    return SequenceMatcher(None, q_compact, t_compact).ratio()


def resolve(query: str, games: list[dict]) -> dict:
    """Returns {"match": game | None, "candidates": [...]} sorted by score.

    A match is only returned when it is clearly better than the alternatives,
    so the agent asks the player instead of guessing.
    """
    scored = sorted(
        ((score(query, g.get("title", "")), g) for g in games),
        key=lambda pair: pair[0],
        reverse=True,
    )
    candidates = [{"score": round(s, 2), "game": g} for s, g in scored if s >= CANDIDATE_SCORE][:5]
    match = None
    if scored and scored[0][0] >= ACCEPT_SCORE:
        best = scored[0][0]
        runner_up = scored[1][0] if len(scored) > 1 else 0
        if best == 1.0 or best - runner_up >= 0.05:
            match = scored[0][1]
    return {"match": match, "candidates": candidates}
