"""
Pull historical ESPN Fantasy Football league data and store it in JSON.

Re-run this script each year to incrementally add the new season. Existing
seasons in fantasy_league_history.json are preserved unless --refresh is used.

Usage:
    python fetch_league_history.py
    python fetch_league_history.py --refresh                # refetch every year
    python fetch_league_history.py --years 2024 2025        # only these years
    python fetch_league_history.py --start 2020 --end 2025  # custom range
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

try:
    from espn_api.football import League
except ImportError:
    sys.stderr.write(
        "espn_api is not installed. Run: pip install -r requirements.txt\n"
    )
    raise


LEAGUE_ID = 23951372

# Credentials - prefer environment variables if set, otherwise fall back to
# the values baked into this script.
ESPN_S2 = os.environ.get(
    "ESPN_S2",
    "AEC2MbtaMZ4h3W%2BpslDKiqqe8R98rGeMtp24Y6qZP8HmAANamg2dD8AQZOA7iwMDGH"
    "%2FQdQCkbrFhzM5YPKiaockdywUS77gtdDXU7z7Hkyfs4grFc7190zo6yP1EaEi5yt0xZ"
    "WAkLjQH6%2FFKw8NhkRJUeqnfSQNz8eKe%2BHO105%2Bb8UnhEsuPxSEozp3S34Jbimuz"
    "f4aAYmmD9VTiQCK4mXpxvnhWrC7Wjt9v2BNvYBXLtLESJPRLoawCzNVMV3rOmPs772V7N"
    "3Xk%2F7GfejIFErpb8DkS1s%2FnLgrjJUEUkVQZbQ%3D%3D",
)
SWID = os.environ.get("SWID", "{4E9A7DA2-9A5C-452F-9A7D-A29A5C952F8D}")

DEFAULT_START_YEAR = 2019
DEFAULT_END_YEAR = 2025

OUTPUT_FILE = Path(__file__).resolve().parent / "fantasy_league_history.json"

# Where downloaded owner avatars live. Path is rooted in the dashboard's
# public/ folder so Next.js serves them as /owner-avatars/<file>.
AVATAR_DIR = (
    Path(__file__).resolve().parent / "dashboard" / "public" / "owner-avatars"
)
AVATAR_WEB_PREFIX = "/owner-avatars"


def get_owner_name(team: Any) -> str:
    """Build a friendly owner name. espn_api stores owners as a list of dicts
    on newer seasons and as a plain string on older ones."""
    owners = getattr(team, "owners", None)
    if owners:
        first = owners[0]
        if isinstance(first, dict):
            first_name = (first.get("firstName") or "").strip()
            last_name = (first.get("lastName") or "").strip()
            full = f"{first_name} {last_name}".strip()
            if full:
                return full
            return (first.get("displayName") or "Unknown").strip()
        return str(first).strip() or "Unknown"

    legacy = getattr(team, "owner", None)
    if legacy:
        return str(legacy).strip() or "Unknown"
    return "Unknown"


def get_owner_ids(team: Any) -> list[str]:
    """Return ESPN's stable SWID-style owner ids for a team. Handles
    co-managed teams (multiple ids) and older seasons that may only expose
    a string."""
    owners = getattr(team, "owners", None) or []
    ids: list[str] = []
    for entry in owners:
        if isinstance(entry, dict):
            value = entry.get("id") or entry.get("swid") or entry.get("ownerId")
            if value:
                ids.append(str(value).strip())
        elif entry:
            ids.append(str(entry).strip())
    # Deduplicate while preserving order.
    seen: set[str] = set()
    unique: list[str] = []
    for value in ids:
        if value and value not in seen:
            seen.add(value)
            unique.append(value)
    return unique


def get_owner_display_name(entry: dict[str, Any]) -> str:
    """Best display name from a single owners[i] dict."""
    first_name = (entry.get("firstName") or "").strip()
    last_name = (entry.get("lastName") or "").strip()
    full = f"{first_name} {last_name}".strip()
    if full:
        return full
    return (entry.get("displayName") or "Unknown").strip() or "Unknown"


def collect_standings(league: League, year: int) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for team in league.teams:
        schedule = getattr(team, "schedule", None) or []
        opponent_ids = [
            getattr(opp, "team_id", None) if opp else None for opp in schedule
        ]
        weekly_scores = [
            round(float(s), 2) for s in (getattr(team, "scores", []) or [])
        ]
        weekly_outcomes = [str(o) for o in (getattr(team, "outcomes", []) or [])]
        owner_ids = get_owner_ids(team)
        rows.append(
            {
                "year": year,
                "team_id": getattr(team, "team_id", None),
                "team_name": getattr(team, "team_name", None),
                "team_abbrev": getattr(team, "team_abbrev", None),
                "owner": get_owner_name(team),
                "owner_id": owner_ids[0] if owner_ids else None,
                "owner_ids": owner_ids,
                "wins": getattr(team, "wins", 0) or 0,
                "losses": getattr(team, "losses", 0) or 0,
                "ties": getattr(team, "ties", 0) or 0,
                "points_for": round(float(getattr(team, "points_for", 0.0) or 0.0), 2),
                "points_against": round(
                    float(getattr(team, "points_against", 0.0) or 0.0), 2
                ),
                "final_standing": (
                    getattr(team, "final_standing", None)
                    or getattr(team, "standing", None)
                ),
                "division": getattr(team, "division_name", None),
                "logo_url": getattr(team, "logo_url", None) or None,
                "weekly_scores": weekly_scores,
                "weekly_outcomes": weekly_outcomes,
                "weekly_opponent_ids": opponent_ids,
            }
        )
    rows.sort(key=lambda r: (r["final_standing"] or 999, r["team_name"] or ""))
    return rows


def build_team_owner_lookup(
    standings: list[dict[str, Any]],
) -> dict[int, dict[str, Any]]:
    """Map team_id -> {owner_id, owner_ids, owner} from a season's standings."""
    lookup: dict[int, dict[str, Any]] = {}
    for row in standings:
        tid = row.get("team_id")
        if tid is None:
            continue
        lookup[tid] = {
            "owner_id": row.get("owner_id"),
            "owner_ids": list(row.get("owner_ids") or []),
            "owner": row.get("owner"),
        }
    return lookup


def serialize_player(player: Any) -> dict[str, Any]:
    """Compact representation of a single BoxPlayer line in a weekly lineup."""
    return {
        "player_id": getattr(player, "playerId", None),
        "name": getattr(player, "name", None),
        "pro_team": getattr(player, "proTeam", None),
        "position": getattr(player, "position", None),
        "lineup_slot": (
            getattr(player, "slot_position", None)
            or getattr(player, "lineupSlot", None)
        ),
        "points": round(float(getattr(player, "points", 0) or 0), 2),
        "projected_points": round(
            float(getattr(player, "projected_points", 0) or 0), 2
        ),
    }


def collect_matchups(
    league: League,
    year: int,
    team_owner_lookup: dict[int, dict[str, Any]],
) -> list[dict[str, Any]]:
    """Use box_scores so we get player-level lineups + matchup_type/is_playoff.

    Stamps owner_id / owner_ids on each side using the per-season team lookup,
    so the dashboard never has to join back to standings."""
    settings = getattr(league, "settings", None)
    reg_weeks = int(getattr(settings, "reg_season_count", 13) or 13)
    # Generous buffer for playoffs (typically 3 weeks, sometimes 4).
    max_week = reg_weeks + 4

    matchups: list[dict[str, Any]] = []
    for week in range(1, max_week + 1):
        try:
            box_scores = league.box_scores(week=week)
        except Exception as exc:
            print(f"  - week {week} box_scores failed: {type(exc).__name__}: {exc}")
            continue
        if not box_scores:
            continue

        any_played = False
        for box in box_scores:
            home = getattr(box, "home_team", None)
            away = getattr(box, "away_team", None)
            home_score = float(getattr(box, "home_score", 0) or 0)
            away_score = float(getattr(box, "away_score", 0) or 0)
            home_name = getattr(home, "team_name", None) if home else None
            away_name = getattr(away, "team_name", None) if away else None
            home_id = getattr(home, "team_id", None) if home else None
            away_id = getattr(away, "team_id", None) if away else None

            home_lineup_raw = getattr(box, "home_lineup", []) or []
            away_lineup_raw = getattr(box, "away_lineup", []) or []

            # Skip placeholder / bye / unscheduled matchups. A real matchup
            # requires *both* sides; top playoff seeds sometimes get a bye
            # week represented as a one-sided "matchup" with no opponent.
            if not home_name or not away_name:
                continue
            if (
                home_score == 0
                and away_score == 0
                and not home_lineup_raw
                and not away_lineup_raw
            ):
                continue

            any_played = True
            if home_score > away_score:
                winner = home_name
            elif away_score > home_score:
                winner = away_name
            else:
                winner = "Tie"

            raw_type = getattr(box, "matchup_type", None) or "REGULAR"
            # ESPN uses 'NONE' for regular-season matchups; normalize for clarity.
            if raw_type == "NONE":
                raw_type = "REGULAR"
            is_playoff = bool(getattr(box, "is_playoff", False))

            home_meta = team_owner_lookup.get(home_id, {}) if home_id is not None else {}
            away_meta = team_owner_lookup.get(away_id, {}) if away_id is not None else {}

            matchups.append(
                {
                    "week": week,
                    "matchup_type": raw_type,
                    "is_playoff": is_playoff,
                    "home_team": home_name,
                    "home_team_id": home_id,
                    "home_owner_id": home_meta.get("owner_id"),
                    "home_owner_ids": list(home_meta.get("owner_ids") or []),
                    "home_score": round(home_score, 2),
                    "home_lineup": [serialize_player(p) for p in home_lineup_raw],
                    "away_team": away_name,
                    "away_team_id": away_id,
                    "away_owner_id": away_meta.get("owner_id"),
                    "away_owner_ids": list(away_meta.get("owner_ids") or []),
                    "away_score": round(away_score, 2),
                    "away_lineup": [serialize_player(p) for p in away_lineup_raw],
                    "winner": winner,
                }
            )

        # If we're past the regular season and a whole week had nothing played,
        # the season is over - stop probing.
        if not any_played and week > reg_weeks:
            break

    return matchups


def collect_draft(
    league: League,
    year: int,
    team_owner_lookup: dict[int, dict[str, Any]],
) -> list[dict[str, Any]]:
    """Return one dict per draft pick (snake or auction). Each pick is
    stamped with the drafting owner's stable owner_id."""
    draft = getattr(league, "draft", None) or []
    picks: list[dict[str, Any]] = []
    for pick in draft:
        team = getattr(pick, "team", None)
        nominating = getattr(pick, "nominatingTeam", None)
        nominating_name = (
            getattr(nominating, "team_name", None)
            if nominating and not isinstance(nominating, str)
            else (nominating or None)
        )
        team_id = getattr(team, "team_id", None) if team else None
        meta = team_owner_lookup.get(team_id, {}) if team_id is not None else {}
        picks.append(
            {
                "round": getattr(pick, "round_num", None),
                "round_pick": getattr(pick, "round_pick", None),
                "team_id": team_id,
                "team_name": getattr(team, "team_name", None) if team else None,
                "owner_id": meta.get("owner_id"),
                "owner_ids": list(meta.get("owner_ids") or []),
                "player_id": getattr(pick, "playerId", None),
                "player_name": getattr(pick, "playerName", None),
                "bid_amount": int(getattr(pick, "bid_amount", 0) or 0),
                "keeper_status": bool(getattr(pick, "keeper_status", False)),
                "nominating_team": nominating_name,
            }
        )
    picks.sort(
        key=lambda p: (
            p["round"] if p["round"] is not None else 999,
            p["round_pick"] if p["round_pick"] is not None else 999,
        )
    )
    return picks


def rebuild_owner_registry(data: dict[str, Any]) -> dict[str, dict[str, Any]]:
    """Walk every season's standings and produce a top-level owner registry
    keyed by owner_id. Re-runs from scratch on each call so it stays consistent
    even when seasons are added incrementally."""
    registry: dict[str, dict[str, Any]] = {}
    seasons = data.get("seasons", {}) or {}
    # Track the latest year we've seen a logo URL for each owner, so the most
    # recent season's team logo wins (acts as that owner's "profile image").
    latest_logo_year: dict[str, int] = {}
    for year_key in sorted(seasons.keys(), key=lambda s: int(s) if s.isdigit() else 0):
        year_int = int(year_key) if year_key.isdigit() else None
        season = seasons[year_key] or {}
        for row in season.get("standings", []) or []:
            for owner_id in row.get("owner_ids") or ([row.get("owner_id")] if row.get("owner_id") else []):
                if not owner_id:
                    continue
                entry = registry.setdefault(
                    owner_id,
                    {
                        "owner_id": owner_id,
                        "display_name": row.get("owner") or "Unknown",
                        "first_seen_year": year_int,
                        "last_seen_year": year_int,
                        "seasons": [],
                        "team_names_used": [],
                        "logo_url": None,
                        "avatar_path": None,
                    },
                )
                # Always prefer the most recent display name.
                if row.get("owner"):
                    entry["display_name"] = row["owner"]
                if year_int is not None:
                    if entry["first_seen_year"] is None or year_int < entry["first_seen_year"]:
                        entry["first_seen_year"] = year_int
                    if entry["last_seen_year"] is None or year_int > entry["last_seen_year"]:
                        entry["last_seen_year"] = year_int
                    if year_key not in entry["seasons"]:
                        entry["seasons"].append(year_key)
                tn = row.get("team_name")
                if tn and tn not in entry["team_names_used"]:
                    entry["team_names_used"].append(tn)
                logo = row.get("logo_url")
                if logo and year_int is not None and year_int >= latest_logo_year.get(owner_id, -1):
                    latest_logo_year[owner_id] = year_int
                    entry["logo_url"] = logo
    # Sort seasons numerically.
    for entry in registry.values():
        entry["seasons"] = sorted(entry["seasons"], key=int)
    return registry


def _slug_for_owner(owner_id: str) -> str:
    """SWID like '{ABCD-...}' -> 'abcd-...' (filesystem and URL friendly)."""
    return owner_id.strip().lstrip("{").rstrip("}").lower()


_CONTENT_TYPE_EXT = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",  # ESPN's mystique-api returns this non-standard type
    "image/gif": ".gif",
    "image/webp": ".webp",
    "image/svg+xml": ".svg",
}


def _download_avatar(url: str, dest_no_ext: Path) -> Path | None:
    """Fetch `url` and write it to `dest_no_ext.<ext>` based on Content-Type
    (or URL extension as a fallback). Returns the written Path on success.

    Some ESPN image hosts (e.g. mystique-api.fantasy.espn.com) require the
    league cookies; sending them on every request is harmless for hosts that
    don't care about them."""
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 league-history-scraper/1.0",
            "Accept": "*/*",
            "Cookie": f"espn_s2={ESPN_S2}; SWID={SWID}",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            content_type = (resp.headers.get("Content-Type") or "").split(";")[0].strip().lower()
            body = resp.read()
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError) as exc:
        print(f"  - avatar download failed for {url}: {type(exc).__name__}: {exc}")
        return None

    ext = _CONTENT_TYPE_EXT.get(content_type)
    if ext is None:
        # Try the URL suffix as a fallback (mystique-api URLs have no suffix).
        url_suffix = Path(url.split("?")[0]).suffix.lower()
        if url_suffix in {".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"}:
            ext = ".jpg" if url_suffix == ".jpeg" else url_suffix
        else:
            ext = ".png"  # Most ESPN team logos are PNGs.

    dest = dest_no_ext.with_suffix(ext)
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(body)
    return dest


def download_owner_avatars(registry: dict[str, dict[str, Any]]) -> int:
    """Download each owner's most-recent team logo into AVATAR_DIR and stamp
    `avatar_path` (web-relative) on the registry entry. Returns the number
    successfully downloaded this run."""
    downloaded = 0
    for owner_id, entry in registry.items():
        url = entry.get("logo_url")
        if not url:
            entry["avatar_path"] = None
            continue
        slug = _slug_for_owner(owner_id)
        dest_no_ext = AVATAR_DIR / slug
        # If the file already exists in any image extension, reuse it instead
        # of re-downloading on every run.
        existing = next(
            (
                p
                for p in (dest_no_ext.with_suffix(ext) for ext in _CONTENT_TYPE_EXT.values())
                if p.exists()
            ),
            None,
        )
        if existing is None:
            written = _download_avatar(url, dest_no_ext)
            if written is None:
                entry["avatar_path"] = None
                continue
            existing = written
            downloaded += 1
        entry["avatar_path"] = f"{AVATAR_WEB_PREFIX}/{existing.name}"
    return downloaded


def load_existing(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {"league_id": LEAGUE_ID, "owners": {}, "seasons": {}}
    try:
        with path.open("r", encoding="utf-8") as fh:
            data = json.load(fh)
    except (json.JSONDecodeError, OSError) as exc:
        print(f"WARNING: could not read existing JSON ({exc}); starting fresh.")
        return {"league_id": LEAGUE_ID, "owners": {}, "seasons": {}}
    data.setdefault("league_id", LEAGUE_ID)
    data.setdefault("owners", {})
    data.setdefault("seasons", {})
    return data


def save_atomic(path: Path, data: dict[str, Any]) -> None:
    # Always rebuild the owner registry from current standings before writing
    # so it stays in sync no matter how many seasons were just refreshed.
    data["owners"] = rebuild_owner_registry(data)
    # Resolve owner avatars (latest team logo) once per save; cached on disk.
    fresh = download_owner_avatars(data["owners"])
    if fresh:
        print(f"  - downloaded {fresh} new owner avatar(s) -> {AVATAR_DIR}")
    # Order the top-level keys so the file diffs nicely.
    ordered = {
        "league_id": data.get("league_id", LEAGUE_ID),
        "owners": data["owners"],
        "seasons": data.get("seasons", {}),
    }
    tmp = path.with_suffix(path.suffix + ".tmp")
    with tmp.open("w", encoding="utf-8") as fh:
        json.dump(ordered, fh, indent=2, default=str)
        fh.write("\n")
    tmp.replace(path)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--start",
        type=int,
        default=DEFAULT_START_YEAR,
        help=f"first season year (default: {DEFAULT_START_YEAR})",
    )
    parser.add_argument(
        "--end",
        type=int,
        default=DEFAULT_END_YEAR,
        help=f"last season year inclusive (default: {DEFAULT_END_YEAR})",
    )
    parser.add_argument(
        "--years",
        type=int,
        nargs="+",
        help="explicit list of years to fetch (overrides --start/--end)",
    )
    parser.add_argument(
        "--refresh",
        action="store_true",
        help="refetch every requested year, even if already in the JSON file",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    years = args.years if args.years else list(range(args.start, args.end + 1))
    years = sorted(set(years))

    data = load_existing(OUTPUT_FILE)
    data["league_id"] = LEAGUE_ID

    succeeded: list[int] = []
    skipped: list[int] = []
    failed: list[tuple[int, str]] = []

    for year in years:
        year_key = str(year)
        if not args.refresh and year_key in data["seasons"]:
            print(f"[{year}] already present in JSON - skipping")
            skipped.append(year)
            continue

        print(f"[{year}] fetching league...")
        try:
            league = League(
                league_id=LEAGUE_ID,
                year=year,
                espn_s2=ESPN_S2,
                swid=SWID,
            )
            standings = collect_standings(league, year)
            team_owner_lookup = build_team_owner_lookup(standings)
            matchups = collect_matchups(league, year, team_owner_lookup)
            try:
                draft_picks = collect_draft(league, year, team_owner_lookup)
            except Exception as exc:
                print(
                    f"  - draft unavailable: {type(exc).__name__}: {exc}"
                )
                draft_picks = []
        except Exception as exc:
            print(f"[{year}] FAILED - {type(exc).__name__}: {exc}")
            failed.append((year, f"{type(exc).__name__}: {exc}"))
            continue

        data["seasons"][year_key] = {
            "standings": standings,
            "matchups": matchups,
            "draft": draft_picks,
        }
        succeeded.append(year)
        lineup_entries = sum(
            len(m.get("home_lineup", [])) + len(m.get("away_lineup", []))
            for m in matchups
        )
        print(
            f"[{year}] OK - {len(standings)} teams, {len(matchups)} matchups, "
            f"{len(draft_picks)} draft picks, {lineup_entries} lineup entries"
        )

        # Save after each successful season so a later failure doesn't lose work.
        save_atomic(OUTPUT_FILE, data)

        # Be polite to ESPN's API.
        time.sleep(0.5)

    # Final write (in case nothing new was fetched, ensures file exists).
    save_atomic(OUTPUT_FILE, data)

    seasons_in_file = sorted(data["seasons"].keys(), key=int)
    total_team_rows = sum(len(s.get("standings", [])) for s in data["seasons"].values())
    total_matchups = sum(len(s.get("matchups", [])) for s in data["seasons"].values())
    total_draft_picks = sum(
        len(s.get("draft", [])) for s in data["seasons"].values()
    )
    total_lineup_entries = sum(
        len(m.get("home_lineup", [])) + len(m.get("away_lineup", []))
        for s in data["seasons"].values()
        for m in s.get("matchups", [])
    )
    total_playoff_matchups = sum(
        1
        for s in data["seasons"].values()
        for m in s.get("matchups", [])
        if m.get("is_playoff") or m.get("matchup_type", "REGULAR") != "REGULAR"
    )

    print()
    print("=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Output file:           {OUTPUT_FILE}")
    print(f"Seasons in file:       {len(seasons_in_file)} -> {seasons_in_file}")
    print(f"Owners in registry:    {len(data.get('owners', {}))}")
    print(f"Team-season records:   {total_team_rows}")
    print(f"Matchup records:       {total_matchups} ({total_playoff_matchups} playoff/non-regular)")
    print(f"Draft picks:           {total_draft_picks}")
    print(f"Player-lineup entries: {total_lineup_entries}")
    print(f"Newly fetched seasons: {succeeded or 'none'}")
    print(f"Already-had seasons:   {skipped or 'none'}")
    if failed:
        print("Failed seasons:")
        for year, msg in failed:
            print(f"  {year}: {msg}")
    else:
        print("Failed seasons:        none")

    return 0 if not failed else 1


if __name__ == "__main__":
    raise SystemExit(main())
