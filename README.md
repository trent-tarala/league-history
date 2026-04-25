# Fantasy Football League History

Two parts:

1. **`fetch_league_history.py`** — a small Python script that pulls historical
   ESPN Fantasy Football data for a single league using the
   [`espn_api`](https://github.com/cwendt94/espn-api) library and stores it in
   a single JSON file (`fantasy_league_history.json`). Incremental: re-run it
   each year and it will only fetch seasons that aren't already in the file.
2. **`dashboard/`** — a Next.js static site that renders that JSON as a deep
   league history dashboard (records, head-to-head matrix, owner profiles,
   weekly heatmaps, draft boards, awards, luck-adjusted records, and more).
   The site is fully pre-rendered at build time and deploys as a folder of
   HTML/JS/CSS — no server required.

## Setup

```bash
pip install -r requirements.txt
```

The script ships with the league credentials (League ID, `espn_s2`, `SWID`)
embedded. If you'd rather not have them in source, set them as environment
variables and the script will use those instead:

```powershell
$env:ESPN_S2 = "<your espn_s2 cookie value>"
$env:SWID    = "{your-swid-with-braces}"
```

## Usage

Pull every season from 2019 through 2025 (default - the league did not exist on ESPN before 2019):

```bash
python fetch_league_history.py
```

Force re-fetching every requested year (overwrites existing entries):

```bash
python fetch_league_history.py --refresh
```

Only fetch specific years:

```bash
python fetch_league_history.py --years 2024 2025
```

Custom range:

```bash
python fetch_league_history.py --start 2020 --end 2025
```

## Output

The script writes `fantasy_league_history.json` next to the script. The top
level has `league_id`, an `owners` registry, and a `seasons` map. Each
season has three arrays: `standings`, `matchups`, and `draft`.

```json
{
  "league_id": 23951372,
  "owners": {
    "{4E9A7DA2-9A5C-452F-9A7D-A29A5C952F8D}": {
      "owner_id": "{4E9A7DA2-9A5C-452F-9A7D-A29A5C952F8D}",
      "display_name": "Trent Tarala",
      "first_seen_year": 2019,
      "last_seen_year": 2025,
      "seasons": ["2019", "2020", "2021", "2022", "2023", "2024", "2025"],
      "team_names_used": ["Mike Hunt", "..."]
    }
  },
  "seasons": {
    "2024": {
      "standings": [
        {
          "year": 2024,
          "team_id": 12,
          "team_name": "Team Name",
          "team_abbrev": "TN",
          "owner": "First Last",
          "owner_id": "{...SWID...}",
          "owner_ids": ["{...SWID...}"],
          "wins": 10,
          "losses": 4,
          "ties": 0,
          "points_for": 1623.42,
          "points_against": 1488.10,
          "final_standing": 1,
          "division": "East",
          "weekly_scores":      [114.08, 136.96, ...],
          "weekly_outcomes":    ["W", "L", ...],
          "weekly_opponent_ids":[2, 6, ...]
        }
      ],
      "matchups": [
        {
          "week": 1,
          "matchup_type": "REGULAR",
          "is_playoff": false,
          "home_team": "Team A",
          "home_team_id": 6,
          "home_owner_id": "{...SWID...}",
          "home_owner_ids": ["{...SWID...}"],
          "home_score": 131.5,
          "home_lineup": [
            {
              "player_id": 4430807,
              "name": "Bijan Robinson",
              "pro_team": "ATL",
              "position": "RB",
              "lineup_slot": "RB",
              "points": 16.1,
              "projected_points": 18.56
            }
          ],
          "away_team": "Team B",
          "away_team_id": 5,
          "away_owner_id": "{...SWID...}",
          "away_owner_ids": ["{...SWID...}"],
          "away_score": 104.58,
          "away_lineup": [ ... ],
          "winner": "Team A"
        }
      ],
      "draft": [
        {
          "round": 1,
          "round_pick": 1,
          "team_id": 2,
          "team_name": "First Pick FC",
          "owner_id": "{...SWID...}",
          "owner_ids": ["{...SWID...}"],
          "player_id": 3117251,
          "player_name": "Christian McCaffrey",
          "bid_amount": 0,
          "keeper_status": false,
          "nominating_team": null
        }
      ]
    }
  }
}
```

### Field notes

- `owner_id` / `owner_ids` is ESPN's stable account GUID
  (the `SWID`-style `{XXXX-...}`). Use this to track an owner across seasons —
  display names, team names, and even `team_id` can change year to year, but
  the owner id never does. `owner_ids` is the full list (for co-managed teams);
  `owner_id` is the primary.
- The top-level `owners` registry is rebuilt from scratch on every save by
  scanning every season. It's the canonical source of truth for an owner's
  display name, tenure, and the team names they've used.
- `matchup_type` is one of `REGULAR`, `WINNERS_BRACKET`,
  `WINNERS_CONSOLATION_LADDER`, `LOSERS_CONSOLATION_LADDER`, `LOSERS_BRACKET`.
  `is_playoff` is `true` only for the championship bracket
  (`WINNERS_BRACKET` / `LOSERS_BRACKET`); use `matchup_type != "REGULAR"` if
  you also want to include consolation games.
- Playoff bye weeks for top seeds are filtered out — only matchups with both
  a home and away team are included.
- `home_lineup` / `away_lineup` include every roster spot for that week:
  starters and bench (`BE`) and IR. Filter on `lineup_slot` to limit to
  starters.
- `team_id` is stable within a season but may not be stable across seasons.
  Always join on `owner_id` when comparing teams across years.
- `weekly_opponent_ids[i]` is the `team_id` faced in week `i + 1`. Pair with
  `weekly_scores` and `weekly_outcomes` for a quick per-team season view.
- `bid_amount` is `0` for snake drafts and the auction price for auction
  leagues.

### Re-running

Each year is fetched inside a `try`/`except`. Years that fail (e.g. ESPN
no longer exposes that season, cookies expired, league wasn't on ESPN that
year) are skipped and listed at the end of the run. The file is saved after
each successful season so partial progress is never lost.

If you change the schema (e.g. you upgrade this script to capture new
fields), re-run with `--refresh` once to repopulate existing seasons.

## Dashboard

The `dashboard/` folder is a Next.js 15 (App Router) site that reads
`fantasy_league_history.json` at build time and produces a fully static
website. Pages include:

- Home with trophy case, marquee records, all-time win-pct leaderboard
- `/owners` grid + `/owners/[ownerId]` profile page (career totals, year
  table, weekly score chart, head-to-head row vs every other owner)
- `/leaderboards` — sortable all-time tables (wins, win %, PF, PF/G,
  championships, playoffs, avg finish)
- `/records` — single-game record book (top 10 of every category, broken
  out into all / regular season / playoffs)
- `/head-to-head` — N×N matrix; click a cell for a per-pair deep dive
- `/seasons/[year]` — final standings, weekly heatmap, matchup log,
  draft board grid, season awards
- `/streaks` — longest winning, losing, playoff appearance, playoff drought
- `/awards` — per-season Hall of Fame & Hall of Shame
- `/luck` — all-play records, luck index (PF rank vs finish), strength of
  schedule, cursed seasons (high PF, missed playoffs)
- `/fun-facts` — league-wide aggregates and scoring trend over time

### Local development

```powershell
cd dashboard
npm install
npm run dev
```

Visit http://localhost:3000.

### Build the static site

```powershell
cd dashboard
npm run build
```

The static output lands in `dashboard/out/`. Preview it locally with:

```powershell
npx serve dashboard/out
```

### Deploy

`dashboard/out/` is a self-contained folder of HTML, JS, and CSS. To deploy:

- **Netlify** — drag and drop the `out/` folder into the Netlify dashboard,
  or set the build command to `npm run build` and the publish directory to
  `out`.
- **Vercel** — `vercel deploy` from the `dashboard/` folder; it auto-detects
  Next.js and builds correctly with the static export config.
- **GitHub Pages** — push the contents of `out/` to the `gh-pages` branch
  (or copy them into a `docs/` folder on `main` and enable Pages).
- **Any static host** — S3, Cloudflare Pages, Firebase Hosting, or even
  `python -m http.server` from the `out/` directory.

When you re-run `python fetch_league_history.py` to add a new season, just
rebuild the dashboard (`npm run build`) and redeploy `out/`.
