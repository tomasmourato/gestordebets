export type BetStatus = 'POR_LIQUIDAR' | 'GANHA' | 'PERDIDA' | 'ANULADA' | 'MEIO_GANHA' | 'MEIO_PERDIDA';
export type BetType = 'SIMPLES' | 'MULTIPLA';

export interface Selection {
  id: string;
  event: string;
  market: string;
  choice: string;
  odd: number;
  sport?: string;
  betType?: string;
}

export interface Bet {
  id: string;
  type: BetType;
  status: BetStatus;
  selections: Selection[];
  stake: number; // For normal bets, this is real cash. For freebets, it's the freebet value.
  odd: number; // Multiplied odds of all selections
  isFreebet: boolean;
  potentialReturn: number;
  finalReturn: number;
  netProfit: number;
  bookmaker: string;
  dateTime: string;
  notes?: string;
  origin: 'MANUAL' | 'SCREENSHOT' | 'CSV';
  comment?: string;
  tags?: string;
  metadata?: {
    screenshotConfidence?: number;
    detectedFields?: string[];
    correctedFields?: string[];
  };
}

export interface Preferences {
  currency: string;
  defaultBookmaker: string;
  defaultStake: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
}

export interface DashboardStats {
  totalBets: number;
  pendingBets: number;
  wonBets: number;
  lostBets: number;
  refundedBets: number; // Anuladas
  halfWonBets: number;
  halfLostBets: number;
  totalStake: number;
  totalReturn: number;
  netProfit: number;
  roi: number; // Return on Investment (netProfit / totalStake) * 100
  yield: number; // (netProfit / totalStake) * 100 or yield formula (lucro liquido / stake total) * 100. Actually ROI and Yield are often used interchangeably or slightly differently. Yield is typically net profit / total stakes. ROI is typically profit / total risk or capital. Let's use standard definitions.
  winRate: number; // (won + 0.5 * halfWon) / settled bets * 100
}
