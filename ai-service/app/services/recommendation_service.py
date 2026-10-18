import logging

from app.clients.rawg import RawgClient, RawgError
from app.domain import recommender
from app.errors import AppError
from app.repositories.library import GameRepository

logger = logging.getLogger("kairo.recommend")

MAX_LIKED = 4


class RecommendationService:
    def __init__(self, games: GameRepository, rawg: RawgClient):
        self._games = games
        self._rawg = rawg

    async def recommend(self, user_id: str, liked_titles: list[str], mood: str = "", platform: str | None = None) -> dict:
        library = await self._games.list_for_user(user_id)
        if not liked_titles:
            favourites = sorted(
                (g for g in library if g.get("status") == "Completed" or (g.get("rating") or 0) >= 8),
                key=lambda g: g.get("rating") or 0, reverse=True,
            )
            liked_titles = [g["title"] for g in favourites[:MAX_LIKED]]
        if not liked_titles:
            raise AppError(400, "NEED_FAVOURITES", "Tell me a few games you loved, or rate some games in your Library first.")

        try:
            liked = []
            for title in liked_titles[:MAX_LIKED]:
                found = await self._rawg.find_game(title)
                if found:
                    liked.append(found)
            if not liked:
                raise AppError(404, "NOT_FOUND", "I couldn't find those games in the game database. Check the titles.")
            profile = recommender.build_profile(liked)
            platform_filter = recommender.PARENT_PLATFORM.get(platform or "")
            platform_param = str(platform_filter) if platform_filter else None
            top_tags = [slug for slug, _ in profile["tags"].most_common(3)]
            top_genres = [slug for slug, _ in profile["genres"].most_common(2)]
            candidates = []
            if top_tags:
                candidates += await self._rawg.discover(tags=top_tags, parent_platforms=platform_param)
            if top_genres:
                candidates += await self._rawg.discover(genres=top_genres, parent_platforms=platform_param)
        except RawgError as exc:
            raise AppError(503, "DISCOVERY_UNAVAILABLE", exc.message)

        picks = recommender.rank(candidates, profile, library, liked_titles, recommender.parse_max_hours(mood))
        if platform:
            picks = [p for p in picks if platform in p["platforms"] or not p["platforms"]]
        return {
            "recommendations": picks,
            "likedGames": [g.get("name") for g in liked],
            "basedOn": "Matched on RAWG genres and tags of the games you loved, excluding games already in your library.",
        }
