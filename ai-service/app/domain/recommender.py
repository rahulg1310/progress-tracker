"""Content-based game recommendations from RAWG data.

1. Build a taste profile from the games the player loved (weighted RAWG tags and genres).
2. Score candidate games by overlap with that profile plus community rating.
3. Drop anything already in the player's library.
4. Explain each pick with the specific overlaps that produced its score.
"""

import math
import re
from collections import Counter

from app.domain import game_resolver

# Tags that say nothing about taste
GENERIC_TAGS = {
    "singleplayer", "multiplayer", "steam-achievements", "full-controller-support", "steam-cloud",
    "steam-trading-cards", "controller-support", "steam-leaderboards", "partial-controller-support",
    "online-multiplayer", "co-op", "online-co-op", "cloud-saves", "achievements", "steam-workshop",
    "in-app-purchases", "remote-play", "remote-play-on-tv", "includes-level-editor", "captions-available",
    "commentary-available", "stats", "family-sharing", "great-soundtrack", "atmospheric", "2d", "3d",
}

PLATFORM_NAMES = [
    ("PC", ("pc",)),
    ("PS5", ("playstation 5", "playstation5")),
    ("PS4", ("playstation 4", "playstation4")),
    ("Xbox", ("xbox one", "xbox series", "xbox 360")),
    ("Switch", ("nintendo switch",)),
    ("Mobile", ("ios", "android")),
]
# RAWG parent platform ids used for filtering
PARENT_PLATFORM = {"PC": 1, "PS5": 2, "PS4": 2, "Xbox": 3, "Switch": 7, "Mobile": "4,8"}
PALETTE = ["#e7b427", "#e70d0d", "#a78bfa", "#00d9f5", "#5fc9ec", "#00f5a0"]


def tags_of(game: dict) -> list[dict]:
    return [t for t in game.get("tags") or [] if t.get("language", "eng") == "eng" and t.get("slug") not in GENERIC_TAGS]


def genres_of(game: dict) -> list[dict]:
    return list(game.get("genres") or [])


def kairo_platforms(game: dict) -> list[str]:
    names = [str((p.get("platform") or {}).get("name", "")).lower() for p in game.get("platforms") or []]
    out = []
    for label, keys in PLATFORM_NAMES:
        if any(any(key in name for key in keys) for name in names):
            out.append(label)
    return out


def build_profile(liked: list[dict]) -> dict:
    """liked: RAWG game objects for the games the player loved."""
    tags, genres, names = Counter(), Counter(), {}
    for game in liked:
        for tag in tags_of(game)[:12]:
            tags[tag["slug"]] += 1
            names[tag["slug"]] = tag.get("name", tag["slug"])
        for genre in genres_of(game):
            genres[genre["slug"]] += 1
            names[genre["slug"]] = genre.get("name", genre["slug"])
    return {"tags": tags, "genres": genres, "names": names, "liked": liked}


def parse_max_hours(mood: str) -> int | None:
    match = re.search(r"(?:under|less than|below|max(?:imum)?|<)\s*(\d{1,3})\s*(?:h|hr|hrs|hours?)\b", mood or "", re.I)
    if match:
        return int(match.group(1))
    if re.search(r"\b(short|quick)\b", mood or "", re.I):
        return 15
    return None


def score(candidate: dict, profile: dict) -> float:
    tag_total = sum(profile["tags"].values()) or 1
    genre_total = sum(profile["genres"].values()) or 1
    cand_tags = {t["slug"] for t in tags_of(candidate)}
    cand_genres = {g["slug"] for g in genres_of(candidate)}
    tag_score = sum(profile["tags"][slug] for slug in cand_tags) / tag_total
    genre_score = sum(profile["genres"][slug] for slug in cand_genres) / genre_total
    rating = float(candidate.get("rating") or 0) / 5
    popularity = min(1.0, math.log10(max(1, int(candidate.get("ratings_count") or 0))) / 4)
    return 0.55 * min(1.0, tag_score * 2) + 0.25 * min(1.0, genre_score) + 0.12 * rating + 0.08 * popularity


def reasons(candidate: dict, profile: dict) -> list[str]:
    cand_tags = {t["slug"]: t.get("name", t["slug"]) for t in tags_of(candidate)}
    cand_genres = {g["slug"]: g.get("name", g["slug"]) for g in genres_of(candidate)}
    out = []

    best_liked, best_shared = None, []
    for liked in profile["liked"]:
        shared = [cand_tags[t["slug"]] for t in tags_of(liked) if t["slug"] in cand_tags]
        if len(shared) > len(best_shared):
            best_liked, best_shared = liked, shared
    if best_liked and best_shared:
        out.append(f"Shares {', '.join(best_shared[:2])} with {best_liked.get('name')}")

    shared_genres = [name for slug, name in cand_genres.items() if slug in profile["genres"]]
    if shared_genres:
        out.append(f"{' / '.join(shared_genres[:2])}, a genre you already enjoy")
    if candidate.get("rating") and candidate.get("ratings_count"):
        out.append(f"Rated {candidate['rating']}/5 by {int(candidate['ratings_count']):,} players on RAWG")
    if candidate.get("playtime"):
        out.append(f"About {candidate['playtime']}h on average (RAWG estimate)")
    return out[:3]


def rank(candidates: list[dict], profile: dict, library: list[dict], liked_titles: list[str], max_hours: int | None, limit: int = 6) -> list[dict]:
    excluded_ids = {g.get("id") for g in profile["liked"]}
    owned = [{"title": g.get("title", "")} for g in library] + [{"title": t} for t in liked_titles]
    seen, scored = set(), []
    for cand in candidates:
        cid = cand.get("id")
        if cid in seen or cid in excluded_ids or not cand.get("name"):
            continue
        seen.add(cid)
        if game_resolver.resolve(cand["name"], owned)["match"]:
            continue
        if max_hours and cand.get("playtime") and cand["playtime"] > max_hours:
            continue
        if int(cand.get("ratings_count") or 0) < 20:
            continue
        scored.append((score(cand, profile), cand))

    scored.sort(key=lambda pair: pair[0], reverse=True)
    best = scored[0][0] if scored else 1
    out = []
    for i, (value, cand) in enumerate(scored[:limit]):
        out.append({
            "_id": str(cand["id"]),
            "rawgId": cand["id"],
            "title": cand["name"],
            "genres": [g.get("name") for g in genres_of(cand)][:3],
            "platforms": kairo_platforms(cand),
            "released": (cand.get("released") or "")[:4] or "TBA",
            "estHours": cand.get("playtime") or None,
            "coverImage": cand.get("background_image") or "",
            "colorAccent": PALETTE[i % len(PALETTE)],
            "match": max(50, min(99, round(60 + 39 * (value / best if best else 0)))),
            "reasons": reasons(cand, profile),
        })
    return out
