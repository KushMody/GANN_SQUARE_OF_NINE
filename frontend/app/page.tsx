"use client";

import React, { useEffect } from "react";
import TopToolbar from "@/components/TopToolbar";
import LeftControlPanel from "@/components/LeftControlPanel";
import GannChart from "@/components/GannChart";
import RightPanel from "@/components/RightPanel";
import { useStore } from "@/lib/store";

export default function DashboardPage() {
  const { symbol, timeframe, candles, dataSource, fetchCandles, bullGrid, bearGrid } = useStore();

  useEffect(() => {
    // Initial load: Fetch default reference dataset (S&P 500 2007)
    fetchCandles("SP500_2007", "1D");
  }, [fetchCandles]);

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 overflow-hidden font-sans">
      {/* 1. Top Navigation Toolbar */}
      <TopToolbar />

      {/* 2. Main Financial Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Control Panel (Bull, Bear, Grid, Chart Settings) */}
        <LeftControlPanel />

        {/* Central High-Performance Gann Financial Chart */}
        <main className="flex-1 h-full flex flex-col relative overflow-hidden bg-slate-950">
          <GannChart />
        </main>

        {/* Right Information Panel (Swings, Squaring, Table, Rotations, Look-Ahead, Backtest) */}
        <RightPanel />
      </div>

      {/* 3. Bottom Status and Telemetry Bar */}
      <footer className="h-7 bg-slate-950 border-t border-slate-800/80 px-4 flex items-center justify-between text-[11px] text-slate-400 select-none z-20">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-300 font-medium">Terminal Online</span>
          </span>

          <span className="text-slate-600">|</span>

          <span>
            Symbol: <strong className="text-slate-200 font-mono">{symbol}</strong> ({timeframe})
          </span>

          <span className="text-slate-600">|</span>

          <span>
            Candles: <strong className="text-cyan-400 font-mono">{candles.length}</strong> loaded
          </span>

          <span className="text-slate-600">|</span>

          <span className="text-slate-400">
            Engine: <strong className="text-slate-300">Gann Square of Nine (TradingFives Profile)</strong>
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono text-[10px]">
          <span className="text-emerald-400">
            Bull Grid: {bullGrid.isActive ? `${bullGrid.startPrice} (${bullGrid.degreeSet}°)` : "Off"}
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-rose-400">
            Bear Grid: {bearGrid.isActive ? `${bearGrid.startPrice} (${bearGrid.degreeSet}°)` : "Off"}
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-amber-400">
            F: {bullGrid.degreeFactor}
          </span>
        </div>
      </footer>
    </div>
  );
}
