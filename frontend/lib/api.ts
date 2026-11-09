/**
 * API Client for Gann Roadmap and Square of Nine Backend.
 */

import {
  CandleData,
  RoadmapGridResult,
  SwingAnalysisResult,
  PriceTimeSquaringResult,
  RotationsResult,
  LookAheadResult,
  BacktestReport,
  StaticDegreeTableResponse,
  MarketSymbol,
  SavedProject
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {})
      }
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`API Error (${res.status}): ${errText}`);
    }
    return (await res.json()) as T;
  } catch (err: any) {
    console.warn(`Request to ${endpoint} failed:`, err.message);
    throw err;
  }
}

export const api = {
  // Market Data
  getSymbols: async (): Promise<MarketSymbol[]> => {
    return fetchJson<MarketSymbol[]>("/api/market-data/symbols");
  },

  getHistory: async (symbol: string, timeframe: string = "1D"): Promise<{
    symbol: string;
    candles: CandleData[];
    data_source: string;
    is_delayed: boolean;
  }> => {
    return fetchJson(`/api/market-data/history?symbol=${encodeURIComponent(symbol)}&timeframe=${timeframe}`);
  },

  // Roadmap Grid
  getRoadmapGrid: async (payload: {
    start_price: number;
    start_date: string;
    start_time?: string | null;
    direction: "bull" | "bear";
    mode: "grid" | "ghost";
    degree_set: 90 | 60;
    degree_factor: number;
    multiplier: number;
    num_cycles?: number;
    trading_dates?: string[];
  }): Promise<RoadmapGridResult> => {
    return fetchJson<RoadmapGridResult>("/api/gann/roadmap", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  // Swings
  detectSwings: async (payload: {
    candles: CandleData[];
    method?: "zigzag" | "atr";
    min_pct_deviation?: number;
    left_bars?: number;
    right_bars?: number;
  }): Promise<SwingAnalysisResult> => {
    return fetchJson<SwingAnalysisResult>("/api/gann/swings", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  // Static Degree
  getStaticDegreeTable: async (params: {
    start?: number;
    end?: number;
    multiplier?: number;
    convention?: string;
    precision?: number;
  }): Promise<StaticDegreeTableResponse> => {
    const qs = new URLSearchParams({
      start: String(params.start ?? 1),
      end: String(params.end ?? 1000),
      multiplier: String(params.multiplier ?? 1.0),
      convention: params.convention ?? "gann_cardinal_axis",
      precision: String(params.precision ?? 2)
    });
    return fetchJson<StaticDegreeTableResponse>(`/api/gann/static-degree/table?${qs.toString()}`);
  },

  getStaticDegreeCsvUrl: (params: { start?: number; end?: number; multiplier?: number; convention?: string }) => {
    const qs = new URLSearchParams({
      start: String(params.start ?? 1),
      end: String(params.end ?? 1000),
      multiplier: String(params.multiplier ?? 1.0),
      convention: params.convention ?? "gann_cardinal_axis"
    });
    return `${API_BASE}/api/gann/static-degree/csv?${qs.toString()}`;
  },

  lookupStaticDegree: async (val: number, multiplier = 1.0, convention = "gann_cardinal_axis") => {
    return fetchJson(`/api/gann/static-degree/lookup?value=${val}&multiplier=${multiplier}&convention=${convention}`);
  },

  // Price-Time Squaring
  calculateSquaring: async (payload: {
    price_range: number;
    trading_days?: number;
    calendar_days?: number;
    intraday_bars?: number;
    method_id?: string;
    price_multiplier?: number;
    time_multiplier?: number;
    tolerance_degrees?: number;
    convention?: string;
  }): Promise<PriceTimeSquaringResult> => {
    return fetchJson<PriceTimeSquaringResult>("/api/gann/squaring", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  // Rotations
  calculateRotations: async (payload: {
    input_angle: number;
    rotation_type: "90_degree" | "60_degree";
    comparison_targets?: Record<string, number>;
    tolerance?: number;
  }): Promise<RotationsResult> => {
    return fetchJson<RotationsResult>("/api/gann/rotations", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  // Look-Ahead
  calculateLookAhead: async (payload: {
    start_date: string;
    price_range: number;
    degree_set?: number;
    horizon_trading_days?: number;
    tolerance?: number;
    price_multiplier?: number;
    time_multiplier?: number;
    known_session_dates?: string[];
  }): Promise<LookAheadResult> => {
    return fetchJson<LookAheadResult>("/api/gann/look-ahead", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  // Backtest
  runBacktest: async (payload: {
    candles: CandleData[];
    symbol?: string;
    timeframe?: string;
    eval_horizon_bars?: number;
    reversal_min_pct?: number;
    angular_tolerance?: number;
    degree_set?: number;
    degree_factor?: number;
  }): Promise<BacktestReport> => {
    return fetchJson<BacktestReport>("/api/gann/backtest", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  // Projects
  getProjects: async (): Promise<SavedProject[]> => {
    return fetchJson<SavedProject[]>("/api/projects");
  },

  saveProject: async (project: {
    name: string;
    description?: string;
    symbol: string;
    timeframe: string;
    config: Record<string, any>;
  }): Promise<SavedProject> => {
    return fetchJson<SavedProject>("/api/projects", {
      method: "POST",
      body: JSON.stringify(project)
    });
  },

  deleteProject: async (id: number): Promise<{ message: string }> => {
    return fetchJson<{ message: string }>(`/api/projects/${id}`, {
      method: "DELETE"
    });
  }
};
