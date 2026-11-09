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
  Layers,
  Trash2,
  FolderOpen,
  Activity
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
    setSymbol,
    setTimeframe,
    setActiveRightTab,
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
    <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 text-xs select-none shadow-md z-30">
      {/* 1. Logo & App Brand */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Compass className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-wide text-slate-100 flex items-center gap-1.5">
              Gann Square of Nine
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                Roadmap
              </span>
            </h1>
            <p className="text-[10px] text-slate-400 hidden sm:block">
              Price-Time Squaring & Mathematical Roadmap Terminal
            </p>
          </div>
        </div>

        <div className="h-6 w-px bg-slate-800 mx-1" />

        {/* 2. Symbol Selector */}
        <div className="flex items-center gap-1.5">
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="bg-slate-950 border border-slate-700 hover:border-slate-600 rounded px-2.5 py-1.5 text-slate-100 font-medium focus:border-cyan-500 focus:outline-none"
          >
            <option value="SP500_2007">★ S&P 500 (TradingFives 2007 Reference)</option>
            <optgroup label="US Indices">
              <option value="^GSPC">S&P 500 Index (^GSPC)</option>
              <option value="^IXIC">NASDAQ Composite (^IXIC)</option>
              <option value="^DJI">Dow Jones (^DJI)</option>
            </optgroup>
            <optgroup label="Indian Markets">
              <option value="^NSEI">NIFTY 50 (^NSEI)</option>
              <option value="^NSEBANK">BANK NIFTY (^NSEBANK)</option>
              <option value="RELIANCE.NS">Reliance Industries (RELIANCE.NS)</option>
              <option value="TCS.NS">Tata Consultancy (TCS.NS)</option>
            </optgroup>
            <optgroup label="Forex & Crypto">
              <option value="EURUSD=X">EUR / USD (EURUSD=X)</option>
              <option value="USDINR=X">USD / INR (USDINR=X)</option>
              <option value="BTC-USD">Bitcoin (BTC-USD)</option>
              <option value="ETH-USD">Ethereum (ETH-USD)</option>
            </optgroup>
            <optgroup label="Commodities">
              <option value="GC=F">Gold Futures (GC=F)</option>
              <option value="CL=F">Crude Oil (CL=F)</option>
            </optgroup>
          </select>

          {/* Timeframe selector */}
          <div className="flex rounded bg-slate-950 border border-slate-700 p-0.5">
            {["1D", "1W", "1M", "1H"].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2 py-1 rounded font-medium transition ${
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
            className={`hidden xl:inline-block px-2 py-0.5 rounded text-[10px] font-mono ${
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

      {/* 3. Quick Action Toggles */}
      <div className="flex items-center gap-1.5">
        {/* Bull Grid Toggle */}
        <button
          onClick={toggleBull}
          className={`px-2.5 py-1.5 rounded flex items-center gap-1.5 font-medium border transition ${
            bullGrid.isActive
              ? "bg-emerald-950 text-emerald-300 border-emerald-600 shadow-sm shadow-emerald-500/10"
              : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
          }`}
          title="Toggle Bull Grid"
        >
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          <span>Bull Grid</span>
        </button>

        {/* Bear Grid Toggle */}
        <button
          onClick={toggleBear}
          className={`px-2.5 py-1.5 rounded flex items-center gap-1.5 font-medium border transition ${
            bearGrid.isActive
              ? "bg-rose-950 text-rose-300 border-rose-600 shadow-sm shadow-rose-500/10"
              : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
          }`}
          title="Toggle Bear Grid"
        >
          <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
          <span>Bear Grid</span>
        </button>

        {/* Ghost Mode Toggle */}
        <button
          onClick={toggleGhost}
          className={`px-2.5 py-1.5 rounded flex items-center gap-1.5 font-medium border transition ${
            bullGrid.isGhost || bearGrid.isGhost
              ? "bg-cyan-950 text-cyan-300 border-cyan-600 shadow-sm"
              : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
          }`}
          title="Toggle Ghost Mode"
        >
          <Ghost className="w-3.5 h-3.5 text-cyan-400" />
          <span>Ghost</span>
        </button>

        <div className="h-6 w-px bg-slate-800 mx-1" />

        {/* Rotations shortcut */}
        <button
          onClick={() => setActiveRightTab("rotations")}
          className={`p-1.5 rounded border transition ${
            activeRightTab === "rotations"
              ? "bg-cyan-900/60 text-cyan-300 border-cyan-500"
              : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
          }`}
          title="Square Rotations Tool"
        >
          <RotateCw className="w-4 h-4" />
        </button>

        {/* Look-Ahead shortcut */}
        <button
          onClick={() => setActiveRightTab("look_ahead")}
          className={`p-1.5 rounded border transition ${
            activeRightTab === "look_ahead"
              ? "bg-cyan-900/60 text-cyan-300 border-cyan-500"
              : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
          }`}
          title="Look-Ahead Projection Tool"
        >
          <Calendar className="w-4 h-4" />
        </button>

        {/* Quantitative Backtest */}
        <button
          onClick={() => setActiveRightTab("backtest")}
          className={`p-1.5 rounded border transition ${
            activeRightTab === "backtest"
              ? "bg-amber-900/60 text-amber-300 border-amber-500"
              : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
          }`}
          title="Quantitative Backtest Engine"
        >
          <Activity className="w-4 h-4 text-amber-400" />
        </button>

        {/* Projects Save/Load */}
        <button
          onClick={() => setActiveRightTab("projects")}
          className={`p-1.5 rounded border transition ${
            activeRightTab === "projects"
              ? "bg-indigo-900/60 text-indigo-300 border-indigo-500"
              : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
          }`}
          title="Analysis Projects"
        >
          <FolderOpen className="w-4 h-4 text-indigo-400" />
        </button>

        {/* Clear All */}
        <button
          onClick={clearAllGrids}
          className="p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded border border-slate-800 transition"
          title="Clear Roadmap & Pivots"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
