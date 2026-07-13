export type BetStatus = 'POR_LIQUIDAR' | 'GANHA' | 'PERDIDA' | 'ANULADA' | 'MEIO_GANHA' | 'MEIO_PERDIDA' | 'CASHOUT';
export type BetType = 'SIMPLES' | 'MULTIPLA';

// Regra de pagamento de uma freebet:
//  SNR = Stake Not Returned (ganho = (odd-1) * stake) — padrão da indústria
//  SR  = Stake Returned     (ganho = odd * stake)     — variante do Betclic
export type FreebetType = 'SNR' | 'SR';

export interface Selection {
  id: string;
  event: string;
  market: string;
  choice: string;
  odd: number;
  sport?: string;
  betType?: string;
}

export interface BetMetadata {
  screenshotConfidence?: number;
  detectedFields?: string[];
  correctedFields?: string[];
  source?: 'betclic' | 'betano' | string;
  ref?: string | null;
  importKey?: string | null;
  originalStatus?: string | number | null;
  originalReturn?: number | string | null;
  promotionType?: string | null;
  promotionAmount?: number | null;
  bonusType?: string | number | null;
  bonusTokens?: Array<{ type?: string | null; amount?: number | null }>;
  [key: string]: unknown;
}

export interface Bet {
  id: string;
  type: BetType;
  status: BetStatus;
  selections: Selection[];
  stake: number; // For normal bets, this is real cash. For freebets, it's the freebet value.
  odd: number; // Multiplied odds of all selections
  isFreebet: boolean;
  freebetType?: FreebetType; // só relevante quando isFreebet; default resolvido pela casa
  potentialReturn: number;
  finalReturn: number;
  netProfit: number;
  bookmaker: string;
  dateTime: string;
  notes?: string;
  origin: 'MANUAL' | 'SCREENSHOT' | 'CSV';
  comment?: string;
  tags?: string;
  metadata?: BetMetadata;
}

export type ThemeMode = 'light' | 'dark' | 'system';
export type Language = 'pt' | 'en';

export interface Preferences {
  currency: string;
  defaultBookmaker: string;
  defaultStake: number;
  theme: ThemeMode;
  language: Language;
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
  cashoutBets: number;
  totalStake: number;
  totalReturn: number;
  netProfit: number;
  roi: number; // Return on Investment (netProfit / totalStake) * 100
  yield: number; // (netProfit / totalStake) * 100 or yield formula (lucro liquido / stake total) * 100. Actually ROI and Yield are often used interchangeably or slightly differently. Yield is typically net profit / total stakes. ROI is typically profit / total risk or capital. Let's use standard definitions.
  winRate: number; // (won + 0.5 * halfWon) / settled bets * 100
}
