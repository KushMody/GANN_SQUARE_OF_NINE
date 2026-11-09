/**
 * TypeScript Interfaces for Gann Square of Nine Roadmap Application.
 */

export interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface RoadmapLevel {
  angle: number;
  cycle: number;
  angle_in_cycle: number;
  price: number;
  delta_price: number;
  is_major: boolean;
  label: string;
}

export interface RoadmapTimeLine {
  angle: number;
  bar_index: number;
  projected_date?: string | null;
  is_major: boolean;
  label: string;
}

export interface DiagonalChannel {
  id: string;
  name: string;
  start_bar: number;
  start_price: number;
  end_bar: number;
  end_price: number;
  slope: number;
  channel_type: string;
}

export interface RoadmapGridResult {
  grid_type: "bull" | "bear";
  mode: "grid" | "ghost";
  start_price: number;
  start_date: string;
  start_time?: string | null;
  degree_set: 90 | 60;
  degree_factor: number;
  multiplier: number;
  calculation_profile: string;
  horizontal_levels: RoadmapLevel[];
  vertical_time_lines: RoadmapTimeLine[];
  diagonal_channels: DiagonalChannel[];
}

export interface SwingPivot {
  index: number;
  date: string;
  price: number;
  pivot_type: "high" | "low";
  is_manual?: boolean;
}

export interface SwingLeg {
  start_index: number;
  end_index: number;
  start_date: string;
  end_date: string;
  start_price: number;
  end_price: number;
  price_range: number;
  direction: "bullish" | "bearish";
  trading_days: number;
  calendar_days: number;
  bars_count: number;
  percentage_change: number;
}

export interface SwingAnalysisResult {
  pivots: SwingPivot[];
  swings: SwingLeg[];
  active_swing?: SwingLeg | null;
}

export interface SquaringAspect {
  target_aspect: string;
  nominal_difference: number;
  actual_difference: number;
  orb: number;
  is_active: boolean;
}

export interface SquaringEvaluation {
  time_metric: string;
  time_value: number;
  time_angle: number;
  price_angle: number;
  angular_difference: number;
  active_aspects: SquaringAspect[];
  is_squared: boolean;
  harmonic_score: number;
}

export interface PriceTimeSquaringResult {
  method_id: string;
  method_name: string;
  method_status: string;
  price_range: number;
  price_angle: number;
  price_cycle: number;
  evaluations: Record<string, SquaringEvaluation>;
  primary_squaring_detected: boolean;
  summary_verdict: string;
}

export interface RotationNode {
  rotation_index: number;
  nominal_step_degrees: number;
  angle: number;
  label: string;
  is_matched: boolean;
  matched_target_label?: string | null;
  matched_target_angle?: number | null;
  orb?: number | null;
}

export interface RotationsResult {
  input_angle: number;
  rotation_type: string;
  step_increment: number;
  tolerance: number;
  rotations: RotationNode[];
  has_matches: boolean;
}

export interface LookAheadProjection {
  interval_trading_days: number;
  interval_calendar_days: number;
  projected_date: string;
  time_static_degree: number;
  target_angle: number;
  aspect_type: string;
  orb: number;
  confidence_score: number;
  explanation: string;
}

export interface LookAheadResult {
  start_date: string;
  price_range: number;
  price_angle: number;
  degree_set: number;
  horizon_days: number;
  tolerance: number;
  projections: LookAheadProjection[];
  disclaimer: string;
}

export interface BacktestSignal {
  bar_index: number;
  date: string;
  price: number;
  signal_type: string;
  price_range_squared: number;
  time_metric_squared: string;
  elapsed_time_units: number;
  orb: number;
  reversal_confirmed: boolean;
  bars_to_reversal?: number | null;
  mfe: number;
  mae: number;
  final_return_pct: number;
  is_false_positive: boolean;
}

export interface BacktestReport {
  symbol: string;
  timeframe: string;
  total_candles_analyzed: number;
  train_bars: number;
  test_bars: number;
  total_squaring_signals: number;
  reversals_confirmed: number;
  reversal_win_rate_pct: number;
  false_positive_rate_pct: number;
  avg_bars_to_reversal: number;
  avg_mfe_pct: number;
  avg_mae_pct: number;
  profit_factor?: number | null;
  signals: BacktestSignal[];
  verdict: string;
}

export interface StaticDegreeEntry {
  value: number;
  sqrt_value: number;
  cycle: number;
  static_degree: number;
  quadrant: number;
  cardinal_aspect?: string | null;
  trine_aspect?: string | null;
}

export interface StaticDegreeTableResponse {
  convention: string;
  formula_description: string;
  multiplier: number;
  precision: number;
  total_entries: number;
  entries: StaticDegreeEntry[];
}

export interface MarketSymbol {
  symbol: string;
  name: string;
  market: string;
  currency: string;
  category: string;
}

export interface SavedProject {
  id?: number;
  name: string;
  description?: string;
  symbol: string;
  timeframe: string;
  config: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}
