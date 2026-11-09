"use client";

import React, { useState } from "react";
import { useStore } from "@/lib/store";
import {
  TrendingUp,
  TrendingDown,
  Sliders,
  BarChart2,
  Play,
  RotateCcw,
  Eye,
  EyeOff
} from "lucide-react";

export default function LeftControlPanel() {
  const {
    bullGrid,
    bearGrid,
    gridSettings,
    chartType,
    showVolume,
    updateBullGrid,
    updateBearGrid,
    updateGridSettings,
    generateBullGrid,
    generateBearGrid,
    clearBullGrid,
    clearBearGrid,
    setChartType,
    setShowVolume
  } = useStore();

  const [activeTab, setActiveTab] = useState<"bull" | "bear" | "grid_settings" | "chart_settings">("bull");

  return (
    <div className="w-80 h-full flex flex-col bg-slate-900 border-r border-slate-800 text-xs select-none">
      {/* Panel Tab Headers */}
      <div className="grid grid-cols-4 bg-slate-950 border-b border-slate-800 p-1 text-center font-medium">
        <button
          onClick={() => setActiveTab("bull")}
          className={`py-2 px-1 rounded transition flex flex-col items-center gap-1 ${
            activeTab === "bull"
              ? "bg-emerald-950/70 text-emerald-400 border border-emerald-800/60"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Bull Grid</span>
        </button>

        <button
          onClick={() => setActiveTab("bear")}
          className={`py-2 px-1 rounded transition flex flex-col items-center gap-1 ${
            activeTab === "bear"
              ? "bg-rose-950/70 text-rose-400 border border-rose-800/60"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <TrendingDown className="w-3.5 h-3.5" />
          <span>Bear Grid</span>
        </button>

        <button
          onClick={() => setActiveTab("grid_settings")}
          className={`py-2 px-1 rounded transition flex flex-col items-center gap-1 ${
            activeTab === "grid_settings"
              ? "bg-cyan-950/70 text-cyan-400 border border-cyan-800/60"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Grid</span>
        </button>

        <button
          onClick={() => setActiveTab("chart_settings")}
          className={`py-2 px-1 rounded transition flex flex-col items-center gap-1 ${
            activeTab === "chart_settings"
              ? "bg-amber-950/70 text-amber-400 border border-amber-800/60"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" />
          <span>Chart</span>
        </button>
      </div>

      {/* Tab Contents Container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* ================= SECTION A: BULL GRID ================= */}
        {activeTab === "bull" && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-semibold text-emerald-400 flex items-center gap-1.5 text-sm">
                <TrendingUp className="w-4 h-4" /> Bullish Roadmap
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${bullGrid.isActive ? "bg-emerald-950 text-emerald-300 border border-emerald-800" : "bg-slate-800 text-slate-400"}`}>
                {bullGrid.isActive ? "ACTIVE" : "OFF"}
              </span>
            </div>

            {/* Mode: Grid vs Ghost */}
            <div>
              <label className="text-slate-400 block mb-1.5 font-medium">Display Projection Mode</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => updateBullGrid({ isGhost: false })}
                  className={`py-1.5 px-2 rounded border text-center font-medium transition ${
                    !bullGrid.isGhost
                      ? "bg-emerald-600 text-white border-emerald-500 shadow-sm"
                      : "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800"
                  }`}
                >
                  Standard Grid
                </button>
                <button
                  type="button"
                  onClick={() => updateBullGrid({ isGhost: true })}
                  className={`py-1.5 px-2 rounded border text-center font-medium transition ${
                    bullGrid.isGhost
                      ? "bg-slate-700 text-cyan-300 border-cyan-500 shadow-sm"
                      : "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800"
                  }`}
                >
                  Ghost Mode
                </button>
              </div>
            </div>

            {/* Starting Pivot Price */}
            <div>
              <label className="text-slate-400 block mb-1 font-medium">Starting Pivot Price</label>
              <input
                type="number"
                step="0.01"
                value={bullGrid.startPrice}
                onChange={(e) => updateBullGrid({ startPrice: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-mono focus:border-emerald-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Anchor price for Square of Nine spiral root</span>
            </div>

            {/* Start Date & Time */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 block mb-1 font-medium">Start Date</label>
                <input
                  type="date"
                  value={bullGrid.startDate}
                  onChange={(e) => updateBullGrid({ startDate: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-slate-100 font-mono text-[11px] focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1 font-medium">Start Time</label>
                <input
                  type="time"
                  value={bullGrid.startTime}
                  onChange={(e) => updateBullGrid({ startTime: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-slate-100 font-mono text-[11px] focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Degree Factor */}
            <div>
              <label className="text-slate-400 block mb-1 font-medium">Degree Factor (TradingFives: 0.8125)</label>
              <input
                type="number"
                step="0.0001"
                value={bullGrid.degreeFactor}
                onChange={(e) => updateBullGrid({ degreeFactor: parseFloat(e.target.value) || 1.0 })}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Degree Set: 90° vs 60° */}
            <div>
              <label className="text-slate-400 block mb-1.5 font-medium">Degree Set Configuration</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => updateBullGrid({ degreeSet: 90 })}
                  className={`py-1.5 px-2 rounded border text-center font-mono font-medium transition ${
                    bullGrid.degreeSet === 90
                      ? "bg-emerald-950 text-emerald-300 border-emerald-600"
                      : "bg-slate-800 text-slate-400 border-slate-700"
                  }`}
                >
                  90° (Cardinal)
                </button>
                <button
                  type="button"
                  onClick={() => updateBullGrid({ degreeSet: 60 })}
                  className={`py-1.5 px-2 rounded border text-center font-mono font-medium transition ${
                    bullGrid.degreeSet === 60
                      ? "bg-emerald-950 text-emerald-300 border-emerald-600"
                      : "bg-slate-800 text-slate-400 border-slate-700"
                  }`}
                >
                  60° (Hexagonal)
                </button>
              </div>
            </div>

            {/* Multiplier */}
            <div>
              <label className="text-slate-400 block mb-1 font-medium">Price Multiplier</label>
              <select
                value={bullGrid.multiplier}
                onChange={(e) => updateBullGrid({ multiplier: parseFloat(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-mono focus:border-emerald-500 focus:outline-none"
              >
                <option value={1.0}>1.0 (Standard Indices & Stocks)</option>
                <option value={0.1}>0.1 (High Nominal Scale)</option>
                <option value={10.0}>10.0 (Forex / Decimals)</option>
                <option value={100.0}>100.0 (Micro Units)</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={generateBullGrid}
                className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium flex items-center justify-center gap-1.5 shadow transition"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Generate Bull Grid
              </button>
              <button
                onClick={clearBullGrid}
                className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition"
                title="Clear Grid"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ================= SECTION B: BEAR GRID ================= */}
        {activeTab === "bear" && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-semibold text-rose-400 flex items-center gap-1.5 text-sm">
                <TrendingDown className="w-4 h-4" /> Bearish Roadmap
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${bearGrid.isActive ? "bg-rose-950 text-rose-300 border border-rose-800" : "bg-slate-800 text-slate-400"}`}>
                {bearGrid.isActive ? "ACTIVE" : "OFF"}
              </span>
            </div>

            {/* Mode: Grid vs Ghost */}
            <div>
              <label className="text-slate-400 block mb-1.5 font-medium">Display Projection Mode</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => updateBearGrid({ isGhost: false })}
                  className={`py-1.5 px-2 rounded border text-center font-medium transition ${
                    !bearGrid.isGhost
                      ? "bg-rose-600 text-white border-rose-500 shadow-sm"
                      : "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800"
                  }`}
                >
                  Standard Grid
                </button>
                <button
                  type="button"
                  onClick={() => updateBearGrid({ isGhost: true })}
                  className={`py-1.5 px-2 rounded border text-center font-medium transition ${
                    bearGrid.isGhost
                      ? "bg-slate-700 text-cyan-300 border-cyan-500 shadow-sm"
                      : "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800"
                  }`}
                >
                  Ghost Mode
                </button>
              </div>
            </div>

            {/* Starting Pivot Price */}
            <div>
              <label className="text-slate-400 block mb-1 font-medium">Starting Pivot Price</label>
              <input
                type="number"
                step="0.01"
                value={bearGrid.startPrice}
                onChange={(e) => updateBearGrid({ startPrice: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-mono focus:border-rose-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">High pivot for downward inverse projections</span>
            </div>

            {/* Start Date & Time */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 block mb-1 font-medium">Start Date</label>
                <input
                  type="date"
                  value={bearGrid.startDate}
                  onChange={(e) => updateBearGrid({ startDate: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-slate-100 font-mono text-[11px] focus:border-rose-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1 font-medium">Start Time</label>
                <input
                  type="time"
                  value={bearGrid.startTime}
                  onChange={(e) => updateBearGrid({ startTime: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-slate-100 font-mono text-[11px] focus:border-rose-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Degree Factor */}
            <div>
              <label className="text-slate-400 block mb-1 font-medium">Degree Factor (TradingFives: 0.8125)</label>
              <input
                type="number"
                step="0.0001"
                value={bearGrid.degreeFactor}
                onChange={(e) => updateBearGrid({ degreeFactor: parseFloat(e.target.value) || 1.0 })}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-mono focus:border-rose-500 focus:outline-none"
              />
            </div>

            {/* Degree Set */}
            <div>
              <label className="text-slate-400 block mb-1.5 font-medium">Degree Set Configuration</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => updateBearGrid({ degreeSet: 90 })}
                  className={`py-1.5 px-2 rounded border text-center font-mono font-medium transition ${
                    bearGrid.degreeSet === 90
                      ? "bg-rose-950 text-rose-300 border-rose-600"
                      : "bg-slate-800 text-slate-400 border-slate-700"
                  }`}
                >
                  90° (Cardinal)
                </button>
                <button
                  type="button"
                  onClick={() => updateBearGrid({ degreeSet: 60 })}
                  className={`py-1.5 px-2 rounded border text-center font-mono font-medium transition ${
                    bearGrid.degreeSet === 60
                      ? "bg-rose-950 text-rose-300 border-rose-600"
                      : "bg-slate-800 text-slate-400 border-slate-700"
                  }`}
                >
                  60° (Hexagonal)
                </button>
              </div>
            </div>

            {/* Multiplier */}
            <div>
              <label className="text-slate-400 block mb-1 font-medium">Price Multiplier</label>
              <select
                value={bearGrid.multiplier}
                onChange={(e) => updateBearGrid({ multiplier: parseFloat(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-mono focus:border-rose-500 focus:outline-none"
              >
                <option value={1.0}>1.0 (Standard Indices & Stocks)</option>
                <option value={0.1}>0.1 (High Nominal Scale)</option>
                <option value={10.0}>10.0 (Forex / Decimals)</option>
                <option value={100.0}>100.0 (Micro Units)</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={generateBearGrid}
                className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded font-medium flex items-center justify-center gap-1.5 shadow transition"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Generate Bear Grid
              </button>
              <button
                onClick={clearBearGrid}
                className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition"
                title="Clear Grid"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ================= SECTION C: GRID SETTINGS ================= */}
        {activeTab === "grid_settings" && (
          <div className="space-y-4">
            <div className="border-b border-slate-800 pb-2">
              <span className="font-semibold text-cyan-400 flex items-center gap-1.5 text-sm">
                <Sliders className="w-4 h-4" /> Global Grid Styling
              </span>
            </div>

            {/* Element Visibilities */}
            <div className="space-y-2">
              <label className="text-slate-400 block font-medium">Layer Visibility</label>
              <div className="space-y-2 bg-slate-950/60 p-2.5 rounded border border-slate-800">
                <label className="flex items-center justify-between cursor-pointer">
                  <span>Horizontal Price Levels</span>
                  <input
                    type="checkbox"
                    checked={gridSettings.showHorizontal}
                    onChange={(e) => updateGridSettings({ showHorizontal: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span>Vertical Time Projections</span>
                  <input
                    type="checkbox"
                    checked={gridSettings.showVertical}
                    onChange={(e) => updateGridSettings({ showVertical: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span>Diagonal Roadmap Channels</span>
                  <input
                    type="checkbox"
                    checked={gridSettings.showChannels}
                    onChange={(e) => updateGridSettings({ showChannels: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                  />
                </label>
              </div>
            </div>

            {/* Line Colors */}
            <div className="space-y-2">
              <label className="text-slate-400 block font-medium">Palette Configuration</label>
              <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-2.5 rounded border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Bullish Grid</span>
                  <input
                    type="color"
                    value={gridSettings.bullColor}
                    onChange={(e) => updateGridSettings({ bullColor: e.target.value })}
                    className="w-full h-7 rounded cursor-pointer bg-transparent border-0"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Bearish Grid</span>
                  <input
                    type="color"
                    value={gridSettings.bearColor}
                    onChange={(e) => updateGridSettings({ bearColor: e.target.value })}
                    className="w-full h-7 rounded cursor-pointer bg-transparent border-0"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Ghost Projection</span>
                  <input
                    type="color"
                    value={gridSettings.ghostColor}
                    onChange={(e) => updateGridSettings({ ghostColor: e.target.value })}
                    className="w-full h-7 rounded cursor-pointer bg-transparent border-0"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Channels</span>
                  <input
                    type="color"
                    value={gridSettings.channelColor}
                    onChange={(e) => updateGridSettings({ channelColor: e.target.value })}
                    className="w-full h-7 rounded cursor-pointer bg-transparent border-0"
                  />
                </div>
              </div>
            </div>

            {/* Line Thickness & Opacity */}
            <div className="space-y-3 bg-slate-950/60 p-2.5 rounded border border-slate-800">
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Line Thickness</span>
                  <span className="font-mono text-slate-200">{gridSettings.lineThickness}px</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.5"
                  value={gridSettings.lineThickness}
                  onChange={(e) => updateGridSettings({ lineThickness: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Grid Opacity</span>
                  <span className="font-mono text-slate-200">{Math.round(gridSettings.lineOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="1.0"
                  step="0.05"
                  value={gridSettings.lineOpacity}
                  onChange={(e) => updateGridSettings({ lineOpacity: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Cycles Projected</span>
                  <span className="font-mono text-slate-200">{gridSettings.numCycles} (360° × {gridSettings.numCycles})</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="8"
                  value={gridSettings.numCycles}
                  onChange={(e) => updateGridSettings({ numCycles: parseInt(e.target.value) })}
                  className="w-full accent-cyan-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= SECTION D: CHART SETTINGS ================= */}
        {activeTab === "chart_settings" && (
          <div className="space-y-4">
            <div className="border-b border-slate-800 pb-2">
              <span className="font-semibold text-amber-400 flex items-center gap-1.5 text-sm">
                <BarChart2 className="w-4 h-4" /> Financial Chart Engine
              </span>
            </div>

            {/* Chart Style */}
            <div className="space-y-2">
              <label className="text-slate-400 block font-medium">Chart Representation</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setChartType("candlestick")}
                  className={`py-2 px-2 rounded border text-center font-medium transition ${
                    chartType === "candlestick"
                      ? "bg-amber-950 text-amber-300 border-amber-600"
                      : "bg-slate-800 text-slate-400 border-slate-700"
                  }`}
                >
                  Candlestick
                </button>
                <button
                  type="button"
                  onClick={() => setChartType("bar")}
                  className={`py-2 px-2 rounded border text-center font-medium transition ${
                    chartType === "bar"
                      ? "bg-amber-950 text-amber-300 border-amber-600"
                      : "bg-slate-800 text-slate-400 border-slate-700"
                  }`}
                >
                  OHLC Bar
                </button>
                <button
                  type="button"
                  onClick={() => setChartType("line")}
                  className={`py-2 px-2 rounded border text-center font-medium transition ${
                    chartType === "line"
                      ? "bg-amber-950 text-amber-300 border-amber-600"
                      : "bg-slate-800 text-slate-400 border-slate-700"
                  }`}
                >
                  Line
                </button>
              </div>
            </div>

            {/* Volume */}
            <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800 space-y-2">
              <label className="flex items-center justify-between cursor-pointer">
                <span>Display Session Volume</span>
                <input
                  type="checkbox"
                  checked={showVolume}
                  onChange={(e) => setShowVolume(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0"
                />
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
