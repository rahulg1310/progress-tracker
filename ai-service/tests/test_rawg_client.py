import httpx
import pytest

from app.clients.rawg import RawgClient, RawgError
from app.config import Settings


def make(handler, key="test-key"):
    settings = Settings(service_auth_secret="x" * 32, mongo_uri="mongodb://x", mongo_db_name="t", rawg_api_key=key)
    return RawgClient(settings, transport=httpx.MockTransport(handler))


async def test_find_game_picks_the_closest_title_and_caches():
    seen = []

    def handler(request: httpx.Request):
        seen.append(dict(request.url.params))
        return httpx.Response(200, json={"results": [{"id": 1, "name": "Sekiro: Shadows Die Twice - GOTY"}, {"id": 2, "name": "Sekiro: Shadows Die Twice"}]})

    client = make(handler)
    game = await client.find_game("Sekiro: Shadows Die Twice")
    assert game["id"] == 2
    await client.find_game("Sekiro: Shadows Die Twice")
    assert len(seen) == 1 and seen[0]["key"] == "test-key" and seen[0]["search"] == "Sekiro: Shadows Die Twice"


async def test_discover_builds_filters():
    seen = []

    def handler(request):
        seen.append(dict(request.url.params))
        return httpx.Response(200, json={"results": [{"id": 5, "name": "X"}]})

    client = make(handler)
    results = await client.discover(tags=["souls-like", "difficult"], parent_platforms="2")
    assert results == [{"id": 5, "name": "X"}]
    assert seen[0]["tags"] == "souls-like,difficult" and seen[0]["parent_platforms"] == "2" and seen[0]["page_size"] == "40"


async def test_errors_become_friendly_messages():
    client = make(lambda request: httpx.Response(401, json={"error": "bad key"}))
    with pytest.raises(RawgError, match="RAWG_API_KEY"):
        await client.find_game("x")

    def boom(request):
        raise httpx.ConnectError("down")

    with pytest.raises(RawgError, match="unreachable"):
        await make(boom).discover(genres=["action"])

    with pytest.raises(RawgError, match="isn't set up"):
        await make(lambda r: httpx.Response(200, json={}), key="").find_game("x")
