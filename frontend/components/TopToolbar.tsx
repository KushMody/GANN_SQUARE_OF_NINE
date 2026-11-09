"use client";

import React, { useEffect } from "react";
import { useStore } from "@/lib/store";
import {
  Compass,
  TrendingUp,
  TrendingDown,
  Ghost,
  RotateCw,
  Calendar,
  Trash2,
  FolderOpen,
  Activity,
  PanelLeft,
  PanelRight,
  SlidersHorizontal,
  ChevronDown
} from "lucide-react";

export default function TopToolbar() {
  const {
    symbol,
    timeframe,
    symbols,
    bullGrid,
    bearGrid,
    dataSource,
    isDelayed,
    activeRightTab,
    isLeftPanelOpen,
    isRightPanelOpen,
    setSymbol,
    setTimeframe,
    setActiveRightTab,
    toggleLeftPanel,
    toggleRightPanel,
    updateBullGrid,
    updateBearGrid,
    generateBullGrid,
    generateBearGrid,
    clearAllGrids,
    loadSymbols
  } = useStore();

  useEffect(() => {
    loadSymbols();
  }, [loadSymbols]);

  const toggleBull = () => {
    if (bullGrid.isActive) {
      updateBullGrid({ isActive: false });
    } else {
      generateBullGrid();
    }
  };

  const toggleBear = () => {
    if (bearGrid.isActive) {
      updateBearGrid({ isActive: false });
    } else {
      generateBearGrid();
    }
  };

  const toggleGhost = () => {
    const next = !bullGrid.isGhost;
    updateBullGrid({ isGhost: next });
    updateBearGrid({ isGhost: next });
    if (bullGrid.isActive) generateBullGrid();
    if (bearGrid.isActive) generateBearGrid();
  };

  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-2 sm:px-4 text-xs select-none shadow-md z-30 shrink-0 gap-2">
      {/* 1. Left Controls Toggle & Logo */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        <button
          onClick={toggleLeftPanel}
          className={`p-1.5 rounded border transition flex items-center gap-1 ${
            isLeftPanelOpen
              ? "bg-slate-800 text-cyan-400 border-cyan-700/80"
              : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700"
          }`}
          title={isLeftPanelOpen ? "Hide Controls Panel" : "Show Controls Panel"}
          aria-label="Toggle Controls Panel"
        >
          <PanelLeft className="w-4 h-4" />
          <span className="hidden lg:inline text-[10px] font-mono">Controls</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
            <Compass className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-xs sm:text-sm tracking-wide text-slate-100 flex items-center gap-1">
              <span className="hidden xs:inline">Gann</span> Sq9
              <span className="text-[9px] uppercase font-mono px-1 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 hidden sm:inline">
                Roadmap
              </span>
            </h1>
            <p className="text-[9px] text-slate-400 hidden xl:block">
              Price-Time Squaring & Mathematical Terminal
            </p>
          </div>
        </div>

        <div className="h-5 w-px bg-slate-800 mx-0.5 hidden sm:block" />

        {/* 2. Symbol Selector */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="bg-slate-950 border border-slate-700 hover:border-slate-600 rounded px-2 py-1 text-slate-100 font-medium focus:border-cyan-500 focus:outline-none max-w-[130px] xs:max-w-[160px] sm:max-w-[210px] text-[11px]"
          >
            <option value="SP500_2007">★ S&P 500 (TradingFives 2007 Reference)</option>
            <optgroup label="US Indices">
              <option value="^GSPC">S&P 500 (^GSPC)</option>
              <option value="^IXIC">NASDAQ (^IXIC)</option>
              <option value="^DJI">Dow Jones (^DJI)</option>
            </optgroup>
            <optgroup label="Indian Markets">
              <option value="^NSEI">NIFTY 50 (^NSEI)</option>
              <option value="^NSEBANK">BANK NIFTY (^NSEBANK)</option>
              <option value="RELIANCE.NS">Reliance (RELIANCE.NS)</option>
              <option value="TCS.NS">TCS (TCS.NS)</option>
            </optgroup>
            <optgroup label="Forex & Crypto">
              <option value="EURUSD=X">EUR / USD</option>
              <option value="USDINR=X">USD / INR</option>
              <option value="BTC-USD">Bitcoin (BTC)</option>
              <option value="ETH-USD">Ethereum (ETH)</option>
            </optgroup>
            <optgroup label="Commodities">
              <option value="GC=F">Gold Futures</option>
              <option value="CL=F">Crude Oil</option>
            </optgroup>
          </select>

          {/* Timeframe selector */}
          <div className="flex rounded bg-slate-950 border border-slate-700 p-0.5">
            {["1D", "1W", "1M", "1H"].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-medium transition ${
                  timeframe === tf
                    ? "bg-cyan-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Data source badge */}
          <span
            className={`hidden 2xl:inline-block px-2 py-0.5 rounded text-[10px] font-mono ${
              symbol === "SP500_2007"
                ? "bg-amber-950/70 text-amber-300 border border-amber-800/80"
                : isDelayed
                ? "bg-slate-800 text-slate-400 border border-slate-700"
                : "bg-emerald-950/70 text-emerald-300 border border-emerald-800/80"
            }`}
          >
            {dataSource}
          </span>
        </div>
      </div>

      {/* 3. Quick Action Toggles & Right Controls Toggle */}
      <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto scrollbar-none py-1">
        {/* Bull Grid Toggle */}
        <button
          onClick={toggleBull}
          className={`px-2 sm:px-2.5 py-1 rounded flex items-center gap-1 font-medium border text-[11px] transition shrink-0 ${
            bullGrid.isActive
              ? "bg-emerald-950 text-emerald-300 border-emerald-600 shadow-sm shadow-emerald-500/10"
              : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
          }`}
          title="Toggle Bull Grid"
        >
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden md:inline">Bull</span>
        </button>

        {/* Bear Grid Toggle */}
        <button
          onClick={toggleBear}
          className={`px-2 sm:px-2.5 py-1 rounded flex items-center gap-1 font-medium border text-[11px] transition shrink-0 ${
            bearGrid.isActive
              ? "bg-rose-950 text-rose-300 border-rose-600 shadow-sm shadow-rose-500/10"
              : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
          }`}
          title="Toggle Bear Grid"
        >
          <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
          <span className="hidden md:inline">Bear</span>
        </button>

        {/* Ghost Mode Toggle */}
        <button
          onClick={toggleGhost}
          className={`px-2 sm:px-2.5 py-1 rounded flex items-center gap-1 font-medium border text-[11px] transition shrink-0 ${
            bullGrid.isGhost || bearGrid.isGhost
              ? "bg-cyan-950 text-cyan-300 border-cyan-600 shadow-sm"
              : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
          }`}
          title="Toggle Ghost Mode"
        >
          <Ghost className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden lg:inline">Ghost</span>
        </button>

        <div className="h-5 w-px bg-slate-800 mx-0.5 hidden sm:block" />

        {/* Rotations shortcut */}
        <button
          onClick={() => {
            setActiveRightTab("rotations");
            useStore.getState().setRightPanelOpen(true);
          }}
          className={`p-1.5 rounded border transition shrink-0 ${
            activeRightTab === "rotations" && isRightPanelOpen
              ? "bg-cyan-900/60 text-cyan-300 border-cyan-500"
              : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
          }`}
          title="Square Rotations Tool"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>

        {/* Look-Ahead shortcut */}
        <button
          onClick={() => {
            setActiveRightTab("look_ahead");
            useStore.getState().setRightPanelOpen(true);
          }}
          className={`p-1.5 rounded border transition shrink-0 ${
            activeRightTab === "look_ahead" && isRightPanelOpen
              ? "bg-cyan-900/60 text-cyan-300 border-cyan-500"
              : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
          }`}
          title="Look-Ahead Projection Tool"
        >
          <Calendar className="w-3.5 h-3.5" />
        </button>

        {/* Quantitative Backtest */}
        <button
          onClick={() => {
            setActiveRightTab("backtest");
            useStore.getState().setRightPanelOpen(true);
          }}
          className={`p-1.5 rounded border transition shrink-0 ${
            activeRightTab === "backtest" && isRightPanelOpen
              ? "bg-amber-900/60 text-amber-300 border-amber-500"
              : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
          }`}
          title="Quantitative Backtest Engine"
        >
          <Activity className="w-3.5 h-3.5 text-amber-400" />
        </button>

        {/* Projects Save/Load */}
        <button
          onClick={() => {
            setActiveRightTab("projects");
            useStore.getState().setRightPanelOpen(true);
          }}
          className={`p-1.5 rounded border transition shrink-0 ${
            activeRightTab === "projects" && isRightPanelOpen
              ? "bg-indigo-900/60 text-indigo-300 border-indigo-500"
              : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
          }`}
          title="Analysis Projects"
        >
          <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
        </button>

        {/* Clear All */}
        <button
          onClick={clearAllGrids}
          className="p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded border border-slate-800 transition shrink-0"
          title="Clear Roadmap & Pivots"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>

        <div className="h-5 w-px bg-slate-800 mx-0.5" />

        {/* Right Panel Toggle Button */}
        <button
          onClick={toggleRightPanel}
          className={`p-1.5 rounded border transition flex items-center gap-1 shrink-0 ${
            isRightPanelOpen
              ? "bg-slate-800 text-cyan-400 border-cyan-700/80"
              : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700"
          }`}
          title={isRightPanelOpen ? "Hide Analysis Panel" : "Show Analysis Panel"}
          aria-label="Toggle Analysis Panel"
        >
          <span className="hidden lg:inline text-[10px] font-mono">Analysis</span>
          <PanelRight className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
