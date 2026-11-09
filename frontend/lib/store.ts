/**
 * Zustand Global Store for Gann Roadmap and Market Analysis.
 */

import { create } from "zustand";
import {
  CandleData,
  MarketSymbol,
  RoadmapGridResult,
  SwingPivot,
  SwingLeg,
  PriceTimeSquaringResult,
  RotationsResult,
  LookAheadResult,
  BacktestReport,
  SavedProject
} from "./types";
import { api } from "./api";

export interface GridConfig {
  isActive: boolean;
  isGhost: boolean;
  startDate: string;
  startTime: string;
  startPrice: number;
  degreeSet: 90 | 60;
  degreeFactor: number;
  multiplier: number;
  result: RoadmapGridResult | null;
}

export interface GridDisplaySettings {
  showHorizontal: boolean;
  showVertical: boolean;
  showChannels: boolean;
  bullColor: string;
  bearColor: string;
  ghostColor: string;
  channelColor: string;
  lineThickness: number;
  lineOpacity: number;
  numCycles: number;
}

export interface AppState {
  // Market & Data
  symbol: string;
  timeframe: string;
  dataSource: string;
  isDelayed: boolean;
  symbols: MarketSymbol[];
  candles: CandleData[];
  isLoadingData: boolean;

  // Bull & Bear Grids
  bullGrid: GridConfig;
  bearGrid: GridConfig;
  gridSettings: GridDisplaySettings;

  // Chart Preferences
  chartType: "candlestick" | "bar" | "line";
  showVolume: boolean;

  // Swings
  pivots: SwingPivot[];
  swings: SwingLeg[];
  selectedPivot: SwingPivot | null;
  selectedSwing: SwingLeg | null;
  minPctDeviation: number;
  swingMethod: "zigzag" | "atr";

  // Price-Time Squaring
  squaringResult: PriceTimeSquaringResult | null;
  squaringTolerance: number;
  squaringMethodId: string;
  squaringConvention: string;

  // Rotations
  rotationsResult: RotationsResult | null;
  rotationType: "90_degree" | "60_degree";
  rotationsTolerance: number;

  // Look-Ahead
  lookAheadResult: LookAheadResult | null;
  lookAheadHorizon: number;
  lookAheadTolerance: number;
  showLookAheadMarkers: boolean;

  // Backtest
  backtestReport: BacktestReport | null;
  isBacktesting: boolean;

  // UI Panels
  activeRightTab: "swings" | "squaring" | "static_degree" | "rotations" | "look_ahead" | "backtest" | "projects";
  theme: "dark" | "light";

  // Actions
  setSymbol: (sym: string) => void;
  setTimeframe: (tf: string) => void;
  setChartType: (ct: "candlestick" | "bar" | "line") => void;
  setShowVolume: (show: boolean) => void;
  setActiveRightTab: (tab: AppState["activeRightTab"]) => void;
  setTheme: (t: "dark" | "light") => void;

  updateBullGrid: (patch: Partial<GridConfig>) => void;
  updateBearGrid: (patch: Partial<GridConfig>) => void;
  updateGridSettings: (patch: Partial<GridDisplaySettings>) => void;

  selectPivot: (pivot: SwingPivot | null) => void;
  selectSwing: (swing: SwingLeg | null) => void;

  // High-Level Async Operations
  loadSymbols: () => Promise<void>;
  fetchCandles: (sym?: string, tf?: string) => Promise<void>;
  generateBullGrid: () => Promise<void>;
  generateBearGrid: () => Promise<void>;
  clearBullGrid: () => void;
  clearBearGrid: () => void;
  clearAllGrids: () => void;

  detectSwings: () => Promise<void>;
  runSquaring: () => Promise<void>;
  runRotations: (inputAngle?: number) => Promise<void>;
  runLookAhead: () => Promise<void>;
  runBacktest: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  symbol: "SP500_2007",
  timeframe: "1D",
  dataSource: "Verified TradingFives 2007 Reference Dataset",
  isDelayed: false,
  symbols: [],
  candles: [],
  isLoadingData: false,

  bullGrid: {
    isActive: true,
    isGhost: false,
    startDate: "2007-03-14",
    startTime: "09:30",
    startPrice: 1363.98,
    degreeSet: 90,
    degreeFactor: 0.8125,
    multiplier: 1.0,
    result: null
  },

  bearGrid: {
    isActive: false,
    isGhost: false,
    startDate: "2007-07-13",
    startTime: "09:30",
    startPrice: 1555.10,
    degreeSet: 90,
    degreeFactor: 0.8125,
    multiplier: 1.0,
    result: null
  },

  gridSettings: {
    showHorizontal: true,
    showVertical: true,
    showChannels: true,
    bullColor: "#10b981",    // Emerald
    bearColor: "#ef4444",    // Crimson Red
    ghostColor: "#64748b",   // Muted Slate
    channelColor: "#f59e0b", // Warm Amber
    lineThickness: 1,
    lineOpacity: 0.85,
    numCycles: 4
  },

  chartType: "candlestick",
  showVolume: true,

  pivots: [],
  swings: [],
  selectedPivot: null,
  selectedSwing: null,
  minPctDeviation: 3.0,
  swingMethod: "zigzag",

  squaringResult: null,
  squaringTolerance: 5.0,
  squaringMethodId: "method_1",
  squaringConvention: "gann_cardinal_axis",

  rotationsResult: null,
  rotationType: "90_degree",
  rotationsTolerance: 3.0,

  lookAheadResult: null,
  lookAheadHorizon: 90,
  lookAheadTolerance: 4.0,
  showLookAheadMarkers: true,

  backtestReport: null,
  isBacktesting: false,

  activeRightTab: "swings",
  theme: "dark",

  // Basic Setters
  setSymbol: (symbol) => {
    set({ symbol });
    get().fetchCandles(symbol, get().timeframe);
  },
  setTimeframe: (timeframe) => {
    set({ timeframe });
    get().fetchCandles(get().symbol, timeframe);
  },
  setChartType: (chartType) => set({ chartType }),
  setShowVolume: (showVolume) => set({ showVolume }),
  setActiveRightTab: (activeRightTab) => set({ activeRightTab }),
  setTheme: (theme) => set({ theme }),

  updateBullGrid: (patch) => set((s) => ({ bullGrid: { ...s.bullGrid, ...patch } })),
  updateBearGrid: (patch) => set((s) => ({ bearGrid: { ...s.bearGrid, ...patch } })),
  updateGridSettings: (patch) => set((s) => ({ gridSettings: { ...s.gridSettings, ...patch } })),

  selectPivot: (selectedPivot) => {
    set({ selectedPivot });
    if (selectedPivot) {
      // Auto-populate relevant grid start parameters
      if (selectedPivot.pivot_type === "low") {
        get().updateBullGrid({
          startPrice: selectedPivot.price,
          startDate: selectedPivot.date
        });
      } else {
        get().updateBearGrid({
          startPrice: selectedPivot.price,
          startDate: selectedPivot.date
        });
      }
    }
  },

  selectSwing: (selectedSwing) => {
    set({ selectedSwing });
    if (selectedSwing) {
      // Auto-trigger squaring analysis for this selected swing
      get().runSquaring();
    }
  },

  loadSymbols: async () => {
    try {
      const syms = await api.getSymbols();
      set({ symbols: syms });
    } catch (e) {
      console.warn("Could not load symbols:", e);
    }
  },

  fetchCandles: async (targetSym, targetTf) => {
    const sym = targetSym || get().symbol;
    const tf = targetTf || get().timeframe;
    set({ isLoadingData: true });

    try {
      const resp = await api.getHistory(sym, tf);
      const candles = resp.candles;

      set({
        candles,
        dataSource: resp.data_source,
        isDelayed: resp.is_delayed,
        isLoadingData: false
      });

      // Auto-detect swings on new candle series
      if (candles.length > 5) {
        await get().detectSwings();
        // Generate default bull grid if enabled
        if (get().bullGrid.isActive) {
          await get().generateBullGrid();
        }
      }
    } catch (e) {
      console.error("Failed to fetch candles:", e);
      set({ isLoadingData: false });
    }
  },

  generateBullGrid: async () => {
    const { bullGrid, gridSettings, candles } = get();
    try {
      const tradingDates = candles.map((c) => c.time);
      const res = await api.getRoadmapGrid({
        start_price: bullGrid.startPrice,
        start_date: bullGrid.startDate,
        start_time: bullGrid.startTime,
        direction: "bull",
        mode: bullGrid.isGhost ? "ghost" : "grid",
        degree_set: bullGrid.degreeSet,
        degree_factor: bullGrid.degreeFactor,
        multiplier: bullGrid.multiplier,
        num_cycles: gridSettings.numCycles,
        trading_dates: tradingDates
      });
      set((s) => ({
        bullGrid: { ...s.bullGrid, isActive: true, result: res }
      }));
    } catch (e) {
      console.error("Failed to generate Bull Grid:", e);
    }
  },

  generateBearGrid: async () => {
    const { bearGrid, gridSettings, candles } = get();
    try {
      const tradingDates = candles.map((c) => c.time);
      const res = await api.getRoadmapGrid({
        start_price: bearGrid.startPrice,
        start_date: bearGrid.startDate,
        start_time: bearGrid.startTime,
        direction: "bear",
        mode: bearGrid.isGhost ? "ghost" : "grid",
        degree_set: bearGrid.degreeSet,
        degree_factor: bearGrid.degreeFactor,
        multiplier: bearGrid.multiplier,
        num_cycles: gridSettings.numCycles,
        trading_dates: tradingDates
      });
      set((s) => ({
        bearGrid: { ...s.bearGrid, isActive: true, result: res }
      }));
    } catch (e) {
      console.error("Failed to generate Bear Grid:", e);
    }
  },

  clearBullGrid: () => set((s) => ({ bullGrid: { ...s.bullGrid, isActive: false, result: null } })),
  clearBearGrid: () => set((s) => ({ bearGrid: { ...s.bearGrid, isActive: false, result: null } })),
  clearAllGrids: () => {
    get().clearBullGrid();
    get().clearBearGrid();
    set({ selectedPivot: null, selectedSwing: null });
  },

  detectSwings: async () => {
    const { candles, swingMethod, minPctDeviation } = get();
    if (!candles.length) return;

    try {
      const res = await api.detectSwings({
        candles,
        method: swingMethod,
        min_pct_deviation: minPctDeviation,
        left_bars: 4,
        right_bars: 4
      });

      set({
        pivots: res.pivots,
        swings: res.swings,
        selectedPivot: res.pivots.length ? res.pivots[res.pivots.length - 1] : null,
        selectedSwing: res.swings.length ? res.swings[0] : null
      });

      // If we have swings, run initial squaring on the first swing
      if (res.swings.length) {
        await get().runSquaring();
      }
    } catch (e) {
      console.error("Failed to detect swings:", e);
    }
  },

  runSquaring: async () => {
    const { selectedSwing, squaringMethodId, squaringTolerance, squaringConvention } = get();
    if (!selectedSwing) return;

    try {
      const res = await api.calculateSquaring({
        price_range: selectedSwing.price_range,
        trading_days: selectedSwing.trading_days,
        calendar_days: selectedSwing.calendar_days,
        intraday_bars: selectedSwing.bars_count,
        method_id: squaringMethodId,
        tolerance_degrees: squaringTolerance,
        convention: squaringConvention
      });
      set({ squaringResult: res });

      // Also auto-refresh look-ahead with current swing price range
      await get().runLookAhead();
      // And rotations with price angle
      await get().runRotations(res.price_angle);
    } catch (e) {
      console.error("Failed to calculate squaring:", e);
    }
  },

  runRotations: async (angleInput?: number) => {
    const { squaringResult, rotationType, rotationsTolerance } = get();
    const baseAngle = angleInput ?? (squaringResult?.price_angle ?? 103.43);

    try {
      const targets: Record<string, number> = {};
      if (squaringResult?.evaluations?.trading_days) {
        targets["Trading Days Angle"] = squaringResult.evaluations.trading_days.time_angle;
      }
      if (squaringResult?.evaluations?.calendar_days) {
        targets["Calendar Days Angle"] = squaringResult.evaluations.calendar_days.time_angle;
      }

      const res = await api.calculateRotations({
        input_angle: baseAngle,
        rotation_type: rotationType,
        comparison_targets: targets,
        tolerance: rotationsTolerance
      });
      set({ rotationsResult: res });
    } catch (e) {
      console.error("Failed to run rotations:", e);
    }
  },

  runLookAhead: async () => {
    const { selectedSwing, bullGrid, lookAheadHorizon, lookAheadTolerance, candles } = get();
    const pRange = selectedSwing ? selectedSwing.price_range : 191.12;
    const startDate = selectedSwing ? selectedSwing.end_date : bullGrid.startDate;

    try {
      const tradingDates = candles.map((c) => c.time);
      const res = await api.calculateLookAhead({
        start_date: startDate,
        price_range: pRange,
        degree_set: bullGrid.degreeSet,
        horizon_trading_days: lookAheadHorizon,
        tolerance: lookAheadTolerance,
        known_session_dates: tradingDates
      });
      set({ lookAheadResult: res });
    } catch (e) {
      console.error("Failed to run look-ahead:", e);
    }
  },

  runBacktest: async () => {
    const { candles, symbol, timeframe, bullGrid } = get();
    if (candles.length < 20) return;
    set({ isBacktesting: true });

    try {
      const res = await api.runBacktest({
        candles,
        symbol,
        timeframe,
        eval_horizon_bars: 10,
        reversal_min_pct: 1.5,
        angular_tolerance: 4.5,
        degree_set: bullGrid.degreeSet,
        degree_factor: bullGrid.degreeFactor
      });
      set({ backtestReport: res, isBacktesting: false });
    } catch (e) {
      console.error("Failed to run backtest:", e);
      set({ isBacktesting: false });
    }
  }
}));
