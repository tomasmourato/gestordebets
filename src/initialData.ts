import type { Bet } from "./types";
import type { StoredUser } from "./lib/authApi";

export interface InitialAppData {
  authenticated: boolean;
  user: StoredUser | null;
  bets: Bet[];
  pathname: string;
  search: string;
}

declare global {
  interface Window {
    __BETTRACKR_INITIAL_DATA__?: InitialAppData;
  }
}

