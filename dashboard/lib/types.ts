export type OwnerId = string;

export interface OwnerRegistryEntry {
  owner_id: OwnerId;
  display_name: string;
  first_seen_year: number | null;
  last_seen_year: number | null;
  seasons: string[];
  team_names_used: string[];
}

export interface Standing {
  year: number;
  team_id: number | null;
  team_name: string | null;
  team_abbrev: string | null;
  owner: string;
  owner_id: OwnerId | null;
  owner_ids: OwnerId[];
  wins: number;
  losses: number;
  ties: number;
  points_for: number;
  points_against: number;
  final_standing: number | null;
  division: string | null;
  weekly_scores: number[];
  weekly_outcomes: string[];
  weekly_opponent_ids: (number | null)[];
}

export interface PlayerLineup {
  player_id: number | null;
  name: string | null;
  pro_team: string | null;
  position: string | null;
  lineup_slot: string | null;
  points: number;
  projected_points: number;
}

export type MatchupType =
  | "REGULAR"
  | "WINNERS_BRACKET"
  | "LOSERS_BRACKET"
  | "WINNERS_CONSOLATION_LADDER"
  | "LOSERS_CONSOLATION_LADDER";

export interface Matchup {
  week: number;
  matchup_type: MatchupType;
  is_playoff: boolean;
  home_team: string | null;
  home_team_id: number | null;
  home_owner_id: OwnerId | null;
  home_owner_ids: OwnerId[];
  home_score: number;
  home_lineup: PlayerLineup[];
  away_team: string | null;
  away_team_id: number | null;
  away_owner_id: OwnerId | null;
  away_owner_ids: OwnerId[];
  away_score: number;
  away_lineup: PlayerLineup[];
  winner: string | null;
}

export interface DraftPick {
  round: number | null;
  round_pick: number | null;
  team_id: number | null;
  team_name: string | null;
  owner_id: OwnerId | null;
  owner_ids: OwnerId[];
  player_id: number | null;
  player_name: string | null;
  bid_amount: number;
  keeper_status: boolean;
  nominating_team: string | null;
}

export interface Season {
  standings: Standing[];
  matchups: Matchup[];
  draft: DraftPick[];
}

export interface LeagueData {
  league_id: number;
  owners: Record<OwnerId, OwnerRegistryEntry>;
  seasons: Record<string, Season>;
}
