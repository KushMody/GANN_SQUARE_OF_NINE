"use client";

import React, { useEffect } from "react";
import TopToolbar from "@/components/TopToolbar";
import LeftControlPanel from "@/components/LeftControlPanel";
import GannChart from "@/components/GannChart";
import RightPanel from "@/components/RightPanel";
import { useStore } from "@/lib/store";
import { LineChart, Sliders, Layers } from "lucide-react";

export default function DashboardPage() {
  const {
    symbol,
    timeframe,
    candles,
    fetchCandles,
    bullGrid,
    bearGrid,
    isLeftPanelOpen,
    isRightPanelOpen,
    setLeftPanelOpen,
    setRightPanelOpen
  } = useStore();

  useEffect(() => {
    // Initial load: Fetch default reference dataset (S&P 500 2007)
    fetchCandles("SP500_2007", "1D");

    // Auto-adjust panels for viewport size on initial load
    if (typeof window !== "undefined") {
      if (window.innerWidth < 1280) {
        setRightPanelOpen(false);
      }
      if (window.innerWidth < 1024) {
        setLeftPanelOpen(false);
      }
    }
  }, [fetchCandles, setLeftPanelOpen, setRightPanelOpen]);

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 overflow-hidden font-sans select-none">
      {/* 1. Top Navigation Toolbar */}
      <TopToolbar />

      {/* 2. Main Financial Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Control Panel (Bull, Bear, Grid, Chart Settings) */}
        <LeftControlPanel />

        {/* Central High-Performance Gann Financial Chart */}
        <main className="flex-1 h-full flex flex-col relative overflow-hidden bg-slate-950 min-w-0">
          <GannChart />
        </main>

        {/* Right Information Panel (Swings, Squaring, Table, Rotations, Look-Ahead, Backtest) */}
        <RightPanel />
      </div>

      {/* 3. Mobile Quick Nav Bar (< md) */}
      <div className="md:hidden flex items-center justify-around bg-slate-900 border-t border-slate-800 py-1.5 px-3 z-30 shrink-0">
        <button
          onClick={() => {
            setLeftPanelOpen(false);
            setRightPanelOpen(false);
          }}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded text-[10px] font-medium transition ${
            !isLeftPanelOpen && !isRightPanelOpen
              ? "text-cyan-400 bg-slate-800"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <LineChart className="w-4 h-4" />
          <span>Chart</span>
        </button>

        <button
          onClick={() => {
            setLeftPanelOpen(true);
            setRightPanelOpen(false);
          }}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded text-[10px] font-medium transition ${
            isLeftPanelOpen
              ? "text-cyan-400 bg-slate-800"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Grid Controls</span>
        </button>

        <button
          onClick={() => {
            setRightPanelOpen(true);
            setLeftPanelOpen(false);
          }}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded text-[10px] font-medium transition ${
            isRightPanelOpen
              ? "text-cyan-400 bg-slate-800"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Analysis & Tools</span>
        </button>
      </div>

      {/* 4. Bottom Status and Telemetry Bar */}
      <footer className="h-6 sm:h-7 bg-slate-950 border-t border-slate-800/80 px-2 sm:px-4 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400 select-none z-20 shrink-0">
        <div className="flex items-center gap-2 sm:gap-4 overflow-hidden text-ellipsis whitespace-nowrap">
          <span className="flex items-center gap-1.5 shrink-0">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-300 font-medium hidden xs:inline">Online</span>
          </span>

          <span className="text-slate-600 hidden xs:inline">|</span>

          <span className="shrink-0">
            <strong className="text-slate-200 font-mono">{symbol}</strong> ({timeframe})
          </span>

          <span className="text-slate-600 hidden sm:inline">|</span>

          <span className="hidden sm:inline">
            Candles: <strong className="text-cyan-400 font-mono">{candles.length}</strong>
          </span>

          <span className="text-slate-600 hidden lg:inline">|</span>

          <span className="text-slate-400 hidden lg:inline truncate">
            Engine: <strong className="text-slate-300 font-normal">Gann Square of Nine (TradingFives)</strong>
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-2 sm:gap-3 font-mono text-[9px] sm:text-[10px] shrink-0">
          <span className="text-emerald-400">
            Bull: {bullGrid.isActive ? `${bullGrid.startPrice}` : "Off"}
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-rose-400">
            Bear: {bearGrid.isActive ? `${bearGrid.startPrice}` : "Off"}
          </span>
          <span className="text-slate-600 hidden md:inline">|</span>
          <span className="text-amber-400 hidden md:inline">
            F: {bullGrid.degreeFactor}
          </span>
        </div>
      </footer>
    </div>
  );
}
