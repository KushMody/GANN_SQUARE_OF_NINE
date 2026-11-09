"use client";

import React, { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api";
import { StaticDegreeEntry, SavedProject } from "@/lib/types";
import {
  Layers,
  Scale,
  Table as TableIcon,
  RotateCw,
  Calendar,
  Activity,
  FolderOpen,
  Search,
  Download,
  CheckCircle,
  AlertCircle,
  Play,
  Save,
  Trash2,
  FileDown,
  Upload,
  X
} from "lucide-react";

export default function RightPanel() {
  const {
    activeRightTab,
    isRightPanelOpen,
    setRightPanelOpen,
    swings,
    selectedSwing,
    squaringResult,
    squaringTolerance,
    squaringMethodId,
    squaringConvention,
    rotationsResult,
    rotationType,
    rotationsTolerance,
    lookAheadResult,
    lookAheadHorizon,
    lookAheadTolerance,
    backtestReport,
    isBacktesting,
    setActiveRightTab,
    selectSwing,
    runSquaring,
    runRotations,
    runLookAhead,
    runBacktest,
    symbol,
    timeframe,
    bullGrid,
    bearGrid,
    gridSettings
  } = useStore();

  // Static Degree Table State
  const [staticTable, setStaticTable] = useState<StaticDegreeEntry[]>([]);
  const [staticSearch, setStaticSearch] = useState<string>("");
  const [tableStart, setTableStart] = useState<number>(1);
  const [tableEnd, setTableEnd] = useState<number>(120);
  const [convention, setConvention] = useState<string>("gann_cardinal_axis");

  // Projects State
  const [projectsList, setProjectsList] = useState<SavedProject[]>([]);
  const [newProjectName, setNewProjectName] = useState<string>("");

  // Load Static Degree Table
  useEffect(() => {
    if (activeRightTab === "static_degree") {
      api
        .getStaticDegreeTable({
          start: tableStart,
          end: tableEnd,
          convention: convention
        })
        .then((res) => setStaticTable(res.entries))
        .catch((e) => console.warn(e));
    }
  }, [activeRightTab, tableStart, tableEnd, convention]);

  // Load Projects List
  const loadProjects = () => {
    api
      .getProjects()
      .then((p) => setProjectsList(p))
      .catch((e) => console.warn(e));
  };

  useEffect(() => {
    if (activeRightTab === "projects") {
      loadProjects();
    }
  }, [activeRightTab]);

  const handleSaveProject = async () => {
    if (!newProjectName.trim()) return;
    try {
      await api.saveProject({
        name: newProjectName.trim(),
        symbol,
        timeframe,
        config: {
          bullGrid,
          bearGrid,
          gridSettings,
          selectedSwing
        }
      });
      setNewProjectName("");
      loadProjects();
    } catch (e) {
      alert("Error saving project: " + e);
    }
  };

  const handleDeleteProject = async (id?: number) => {
    if (!id) return;
    try {
      await api.deleteProject(id);
      loadProjects();
    } catch (e) {
      alert("Error deleting project: " + e);
    }
  };

  const handleExportJson = () => {
    const exportData = {
      app: "Gann Square of Nine Roadmap",
      exportedAt: new Date().toISOString(),
      symbol,
      timeframe,
      bullGrid,
      bearGrid,
      gridSettings,
      selectedSwing
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Gann_Project_${symbol}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  const filteredStaticEntries = staticTable.filter((e) => {
    if (!staticSearch) return true;
    return (
      String(e.value).includes(staticSearch) ||
      String(e.static_degree).includes(staticSearch) ||
      (e.cardinal_aspect && e.cardinal_aspect.toLowerCase().includes(staticSearch.toLowerCase()))
    );
  });

  if (!isRightPanelOpen) {
    return null;
  }

  return (
    <>
      {/* Mobile / Tablet Backdrop */}
      <div
        onClick={() => setRightPanelOpen(false)}
        className="xl:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-30 transition-opacity"
      />

      <aside className="fixed inset-y-0 right-0 z-40 w-[92vw] max-w-sm sm:max-w-md md:max-w-lg xl:static xl:z-auto xl:w-80 2xl:w-96 h-full flex flex-col bg-slate-900 border-l border-slate-800 text-xs select-none shadow-2xl xl:shadow-none shrink-0">
        {/* Mobile Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-slate-950 border-b border-slate-800 xl:hidden">
          <span className="font-semibold text-slate-200 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-cyan-400" />
            Analysis & Gann Tools
          </span>
          <button
            onClick={() => setRightPanelOpen(false)}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      {/* Navigation Tabs Header */}
      <div className="flex bg-slate-950 border-b border-slate-800 p-1 text-[11px] overflow-x-auto">
        <button
          onClick={() => setActiveRightTab("swings")}
          className={`py-1.5 px-2.5 rounded transition flex items-center gap-1.5 whitespace-nowrap ${
            activeRightTab === "swings"
              ? "bg-slate-800 text-cyan-400 font-semibold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Swings</span>
        </button>

        <button
          onClick={() => setActiveRightTab("squaring")}
          className={`py-1.5 px-2.5 rounded transition flex items-center gap-1.5 whitespace-nowrap ${
            activeRightTab === "squaring"
              ? "bg-slate-800 text-cyan-400 font-semibold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>Squaring</span>
        </button>

        <button
          onClick={() => setActiveRightTab("static_degree")}
          className={`py-1.5 px-2.5 rounded transition flex items-center gap-1.5 whitespace-nowrap ${
            activeRightTab === "static_degree"
              ? "bg-slate-800 text-cyan-400 font-semibold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <TableIcon className="w-3.5 h-3.5" />
          <span>Degree Table</span>
        </button>

        <button
          onClick={() => setActiveRightTab("rotations")}
          className={`py-1.5 px-2.5 rounded transition flex items-center gap-1.5 whitespace-nowrap ${
            activeRightTab === "rotations"
              ? "bg-slate-800 text-cyan-400 font-semibold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Rotations</span>
        </button>

        <button
          onClick={() => setActiveRightTab("look_ahead")}
          className={`py-1.5 px-2.5 rounded transition flex items-center gap-1.5 whitespace-nowrap ${
            activeRightTab === "look_ahead"
              ? "bg-slate-800 text-cyan-400 font-semibold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Look-Ahead</span>
        </button>

        <button
          onClick={() => setActiveRightTab("backtest")}
          className={`py-1.5 px-2.5 rounded transition flex items-center gap-1.5 whitespace-nowrap ${
            activeRightTab === "backtest"
              ? "bg-slate-800 text-cyan-400 font-semibold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Backtest</span>
        </button>

        <button
          onClick={() => setActiveRightTab("projects")}
          className={`py-1.5 px-2.5 rounded transition flex items-center gap-1.5 whitespace-nowrap ${
            activeRightTab === "projects"
              ? "bg-slate-800 text-cyan-400 font-semibold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span>Projects</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {/* ================= TAB 1: SWING INFORMATION PANEL ================= */}
        {activeRightTab === "swings" && (
          <div className="space-y-4">
            <div className="border-b border-slate-800 pb-2 flex justify-between items-center">
              <span className="font-semibold text-slate-100 flex items-center gap-1.5 text-sm">
                <Layers className="w-4 h-4 text-cyan-400" /> Swing Analysis & Statistics
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {swings.length} Swings Detected
              </span>
            </div>

            {/* Selected Active Swing Telemetry Card */}
            {selectedSwing ? (
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span
                    className={`font-semibold uppercase tracking-wider text-[11px] ${
                      selectedSwing.direction === "bullish" ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {selectedSwing.direction} Trend
                  </span>
                  <span className="font-mono text-cyan-400 font-bold text-sm">
                    {selectedSwing.percentage_change > 0 ? "+" : ""}
                    {selectedSwing.percentage_change}%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div className="bg-slate-900/80 p-2 rounded border border-slate-800/80">
                    <span className="text-slate-400 block text-[10px]">PRICE RANGE</span>
                    <span className="font-mono font-bold text-sm text-slate-100">
                      {selectedSwing.price_range.toFixed(2)}
                    </span>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded border border-slate-800/80">
                    <span className="text-slate-400 block text-[10px]">TRADING DAYS</span>
                    <span className="font-mono font-bold text-sm text-cyan-300">
                      {selectedSwing.trading_days} days
                    </span>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded border border-slate-800/80">
                    <span className="text-slate-400 block text-[10px]">CALENDAR DAYS</span>
                    <span className="font-mono font-bold text-sm text-slate-200">
                      {selectedSwing.calendar_days} days
                    </span>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded border border-slate-800/80">
                    <span className="text-slate-400 block text-[10px]">TOTAL BARS</span>
                    <span className="font-mono font-bold text-sm text-slate-200">
                      {selectedSwing.bars_count} bars
                    </span>
                  </div>
                </div>

                <div className="pt-2 text-[10px] space-y-1 font-mono text-slate-400 border-t border-slate-800/80">
                  <div className="flex justify-between">
                    <span>START PIVOT:</span>
                    <span className="text-slate-200">
                      {selectedSwing.start_price.toFixed(2)} ({selectedSwing.start_date})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>END PIVOT:</span>
                    <span className="text-slate-200">
                      {selectedSwing.end_price.toFixed(2)} ({selectedSwing.end_date})
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded border border-dashed border-slate-800 text-center text-slate-500">
                Click any swing from the list below or on chart to inspect statistics
              </div>
            )}

            {/* TradingFives Reference Swing Showcase Badge */}
            {symbol === "SP500_2007" && (
              <div className="bg-gradient-to-r from-amber-950/40 to-slate-950 p-2.5 rounded border border-amber-900/60 text-[11px]">
                <span className="text-amber-400 font-semibold block mb-1">
                  TradingFives 2007 Reference Benchmark:
                </span>
                <p className="text-slate-300 leading-relaxed font-mono text-[10px]">
                  PRICE: 1555.10 | DATE: July 13, 2007<br />
                  RANGE: 191.12 | TRADING: 84 DAYS | CALENDAR: 121 DAYS
                </p>
              </div>
            )}

            {/* List of Historical Swings */}
            <div className="space-y-1.5">
              <span className="font-medium text-slate-400 block mb-1">Detected Swings History</span>
              {swings.map((s, idx) => (
                <div
                  key={idx}
                  onClick={() => selectSwing(s)}
                  className={`p-2.5 rounded border cursor-pointer transition flex items-center justify-between ${
                    selectedSwing?.start_index === s.start_index
                      ? "bg-slate-800 border-cyan-500 shadow-sm"
                      : "bg-slate-950 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="space-y-0.5">
                    <span
                      className={`font-semibold text-[11px] ${
                        s.direction === "bullish" ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {s.direction === "bullish" ? "▲ Bull" : "▼ Bear"} {s.start_price.toFixed(2)} →{" "}
                      {s.end_price.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      {s.start_date} to {s.end_date}
                    </span>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-slate-100 font-bold block">{s.price_range.toFixed(2)} pts</span>
                    <span className="text-[10px] text-cyan-400">{s.trading_days} T-Days</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 2: PRICE-TIME SQUARING ================= */}
        {activeRightTab === "squaring" && (
          <div className="space-y-4">
            <div className="border-b border-slate-800 pb-2 flex justify-between items-center">
              <span className="font-semibold text-slate-100 flex items-center gap-1.5 text-sm">
                <Scale className="w-4 h-4 text-cyan-400" /> Price-Time Squaring
              </span>
              <button
                onClick={runSquaring}
                className="py-1 px-2.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-medium flex items-center gap-1 text-[11px]"
              >
                <Play className="w-3 h-3 fill-current" /> Recalculate
              </button>
            </div>

            {/* Squaring Method Selector */}
            <div>
              <label className="text-slate-400 block mb-1 font-medium">Squaring Methodology</label>
              <select
                value={squaringMethodId}
                disabled
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-mono text-[11px] focus:outline-none"
              >
                <option value="method_1">Method 1: Previous Trend Price Range vs Current Trend Time (Verified)</option>
                <option value="method_2" disabled>Method 2: Current Trend Price Range vs Time (Pending Spec)</option>
                <option value="method_3" disabled>Method 3: Extreme Price vs Extreme Time (Pending Spec)</option>
                <option value="method_4" disabled>Method 4: High/Low Price vs Cycle Time (Pending Spec)</option>
                <option value="method_5" disabled>Method 5: Vector Range vs Cumulative Time (Pending Spec)</option>
              </select>
            </div>

            {squaringResult ? (
              <div className="space-y-3">
                {/* Status Alert Banner */}
                <div
                  className={`p-3 rounded-lg border flex items-start gap-2.5 ${
                    squaringResult.primary_squaring_detected
                      ? "bg-emerald-950/60 border-emerald-600 text-emerald-200"
                      : "bg-slate-950 border-slate-800 text-slate-300"
                  }`}
                >
                  {squaringResult.primary_squaring_detected ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-bold block text-sm">
                      {squaringResult.primary_squaring_detected
                        ? "Geometric Squaring Active!"
                        : "No Exact Square Detected"}
                    </span>
                    <p className="text-[11px] mt-0.5 leading-relaxed opacity-90">
                      {squaringResult.summary_verdict}
                    </p>
                  </div>
                </div>

                {/* Price Static Degree Card */}
                <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Price Range Analyzed:</span>
                    <span className="font-mono font-bold text-slate-100 text-sm">
                      {squaringResult.price_range.toFixed(2)} pts
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Price Static Degree:</span>
                    <span className="font-mono font-bold text-cyan-400 text-sm">
                      {squaringResult.price_angle.toFixed(2)}°
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500">
                    <span>Square of Nine Cycle:</span>
                    <span>Cycle {squaringResult.price_cycle}</span>
                  </div>
                </div>

                {/* Individual Time Metrics Comparisons */}
                <div className="space-y-2">
                  <span className="font-medium text-slate-400 block">Time Metrics Alignment</span>

                  {Object.entries(squaringResult.evaluations).map(([metric, evalData]) => (
                    <div
                      key={metric}
                      className="bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1.5"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-slate-200 capitalize">
                          {metric.replace("_", " ")} ({evalData.time_value})
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                            evalData.is_squared
                              ? "bg-emerald-950 text-emerald-300 border border-emerald-700"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          Score: {evalData.harmonic_score}%
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1 font-mono text-[10px] text-slate-300">
                        <div>
                          <span className="text-slate-500 block">Time Angle:</span>
                          <span>{evalData.time_angle}°</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Price Angle:</span>
                          <span>{evalData.price_angle}°</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Difference:</span>
                          <span className="text-cyan-400">{evalData.angular_difference}°</span>
                        </div>
                      </div>

                      {evalData.active_aspects.length > 0 && (
                        <div className="pt-1 border-t border-slate-800/80 text-[10px] text-emerald-400 font-medium">
                          Active: {evalData.active_aspects.map((a) => `${a.target_aspect} (orb ${a.orb}°)`).join(", ")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center p-6 text-slate-500 italic">
                Select a swing from the Swings tab or click Recalculate
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: STATIC DEGREE TABLE ================= */}
        {activeRightTab === "static_degree" && (
          <div className="space-y-3.5">
            <div className="border-b border-slate-800 pb-2 flex justify-between items-center">
              <span className="font-semibold text-slate-100 flex items-center gap-1.5 text-sm">
                <TableIcon className="w-4 h-4 text-cyan-400" /> Static Degree Lookup (1 to 1000+)
              </span>
              <a
                href={api.getStaticDegreeCsvUrl({ start: 1, end: 1000, convention })}
                download="gann_static_degree_table.csv"
                className="py-1 px-2.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 flex items-center gap-1 text-[11px]"
              >
                <Download className="w-3 h-3" /> CSV
              </a>
            </div>

            {/* Formula Description Card */}
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-400 space-y-1">
              <span className="font-semibold text-cyan-400 block">Square of Nine Formula Convention:</span>
              <p className="font-mono">
                Angle = [((sqrt(N) - 1.0) mod 2.0) × 180°] mod 360°
              </p>
              <p className="text-slate-500">
                Odd squares (1, 9, 25, 49, 81...) anchor at 0°/360°, even squares (4, 16, 36...) at 180°.
              </p>
            </div>

            {/* Search and Filter */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search number, angle, or aspect (e.g. 90°, Square)..."
                value={staticSearch}
                onChange={(e) => setStaticSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded pl-8 pr-2 py-1.5 text-slate-100 text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Table view */}
            <div className="h-80 overflow-y-auto border border-slate-800 rounded bg-slate-950">
              <table className="w-full text-left font-mono text-[11px]">
                <thead className="bg-slate-900 border-b border-slate-800 sticky top-0 text-[10px] text-slate-400">
                  <tr>
                    <th className="py-1.5 px-2">Value</th>
                    <th className="py-1.5 px-2">Sqrt</th>
                    <th className="py-1.5 px-2">Cycle</th>
                    <th className="py-1.5 px-2 text-cyan-400">Degree</th>
                    <th className="py-1.5 px-2">Aspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredStaticEntries.slice(0, 150).map((row) => (
                    <tr
                      key={row.value}
                      className="hover:bg-slate-800/40 transition"
                    >
                      <td className="py-1 px-2 font-bold text-slate-100">{row.value}</td>
                      <td className="py-1 px-2 text-slate-400">{row.sqrt_value.toFixed(2)}</td>
                      <td className="py-1 px-2 text-slate-500">C{row.cycle}</td>
                      <td className="py-1 px-2 font-bold text-cyan-300">{row.static_degree.toFixed(1)}°</td>
                      <td className="py-1 px-2 text-[10px] text-amber-400">
                        {row.cardinal_aspect || row.trine_aspect || `Q${row.quadrant}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 4: SQUARE ROTATIONS TOOL ================= */}
        {activeRightTab === "rotations" && (
          <div className="space-y-4">
            <div className="border-b border-slate-800 pb-2 flex justify-between items-center">
              <span className="font-semibold text-slate-100 flex items-center gap-1.5 text-sm">
                <RotateCw className="w-4 h-4 text-cyan-400" /> Square Rotations
              </span>
              <button
                onClick={() => runRotations()}
                className="py-1 px-2.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-medium flex items-center gap-1 text-[11px]"
              >
                <Play className="w-3 h-3 fill-current" /> Rotate
              </button>
            </div>

            {rotationsResult ? (
              <div className="space-y-3">
                <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Input Angle:</span>
                    <span className="font-mono font-bold text-cyan-400 text-sm">
                      {rotationsResult.input_angle.toFixed(2)}°
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Rotation Mode:</span>
                    <span className="font-mono text-slate-200">
                      {rotationsResult.rotation_type === "90_degree" ? "90° Cardinal (4 rotations)" : "60° Trine (6 rotations)"}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[10px]">
                    <span>Tolerance Threshold:</span>
                    <span>±{rotationsResult.tolerance}°</span>
                  </div>
                </div>

                {/* Rotations Table */}
                <div className="border border-slate-800 rounded bg-slate-950 overflow-hidden">
                  <table className="w-full text-left font-mono text-[11px]">
                    <thead className="bg-slate-900 border-b border-slate-800 text-[10px] text-slate-400">
                      <tr>
                        <th className="py-2 px-2.5">Rotation</th>
                        <th className="py-2 px-2.5 text-cyan-400">Normalized Angle</th>
                        <th className="py-2 px-2.5">Match Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {rotationsResult.rotations.map((r) => (
                        <tr
                          key={r.rotation_index}
                          className={`transition ${
                            r.is_matched ? "bg-emerald-950/40" : "hover:bg-slate-900/40"
                          }`}
                        >
                          <td className="py-1.5 px-2.5 font-medium text-slate-200">{r.label}</td>
                          <td className="py-1.5 px-2.5 font-bold text-slate-100">{r.angle.toFixed(2)}°</td>
                          <td className="py-1.5 px-2.5">
                            {r.is_matched ? (
                              <span className="text-emerald-400 font-bold flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> {r.matched_target_label} (orb {r.orb}°)
                              </span>
                            ) : (
                              <span className="text-slate-500">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center p-6 text-slate-500 italic">
                Click Rotate to generate angular wheel sequences
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 5: LOOK-AHEAD TOOL ================= */}
        {activeRightTab === "look_ahead" && (
          <div className="space-y-4">
            <div className="border-b border-slate-800 pb-2 flex justify-between items-center">
              <span className="font-semibold text-slate-100 flex items-center gap-1.5 text-sm">
                <Calendar className="w-4 h-4 text-cyan-400" /> Look-Ahead Projections
              </span>
              <button
                onClick={runLookAhead}
                className="py-1 px-2.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-medium flex items-center gap-1 text-[11px]"
              >
                <Play className="w-3 h-3 fill-current" /> Project
              </button>
            </div>

            {lookAheadResult ? (
              <div className="space-y-3">
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-[11px] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Reference Price Range:</span>
                    <span className="font-mono font-bold text-slate-100">
                      {lookAheadResult.price_range.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Projection Horizon:</span>
                    <span className="font-mono text-cyan-300">
                      {lookAheadResult.horizon_days} Trading Days
                    </span>
                  </div>
                  <p className="text-[10px] text-amber-400/90 pt-1 border-t border-slate-800/80 italic">
                    {lookAheadResult.disclaimer}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <span className="font-medium text-slate-400 block">Projected Future Alignment Dates</span>
                  {lookAheadResult.projections.map((p, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded border border-slate-800 bg-slate-950 space-y-1 hover:border-slate-700 transition"
                    >
                      <div className="flex justify-between items-center font-mono">
                        <span className="font-bold text-cyan-400 text-sm">{p.projected_date}</span>
                        <span className="text-slate-300 font-semibold">{p.aspect_type}</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                        <span>Trading: +{p.interval_trading_days} days</span>
                        <span>Calendar: ~{p.interval_calendar_days} days</span>
                        <span className="text-emerald-400 font-bold">Conf: {p.confidence_score}%</span>
                      </div>
                      <p className="text-[10px] text-slate-500 italic pt-0.5">{p.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center p-6 text-slate-500 italic">
                Click Project to calculate mathematical turning date windows
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 6: QUANTITATIVE BACKTEST ================= */}
        {activeRightTab === "backtest" && (
          <div className="space-y-4">
            <div className="border-b border-slate-800 pb-2 flex justify-between items-center">
              <span className="font-semibold text-slate-100 flex items-center gap-1.5 text-sm">
                <Activity className="w-4 h-4 text-amber-400" /> Quantitative Backtester
              </span>
              <button
                onClick={runBacktest}
                disabled={isBacktesting}
                className="py-1 px-2.5 rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-medium flex items-center gap-1 text-[11px]"
              >
                <Play className="w-3 h-3 fill-current" /> {isBacktesting ? "Testing..." : "Run Backtest"}
              </button>
            </div>

            {backtestReport ? (
              <div className="space-y-3">
                {/* Metrics Summary Grid */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">REVERSAL WIN RATE</span>
                    <span className="font-mono font-bold text-base text-emerald-400">
                      {backtestReport.reversal_win_rate_pct}%
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">TOTAL SIGNALS</span>
                    <span className="font-mono font-bold text-base text-slate-100">
                      {backtestReport.total_squaring_signals}
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">AVG MFE (FAVORABLE)</span>
                    <span className="font-mono font-bold text-base text-cyan-300">
                      +{backtestReport.avg_mfe_pct}%
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">AVG MAE (ADVERSE)</span>
                    <span className="font-mono font-bold text-base text-rose-400">
                      -{backtestReport.avg_mae_pct}%
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-[11px] leading-relaxed text-slate-300">
                  <span className="font-semibold text-amber-400 block mb-0.5">Objective Appraisal:</span>
                  {backtestReport.verdict}
                </div>

                {/* Signals Table */}
                <div className="space-y-1.5">
                  <span className="font-medium text-slate-400 block">Evaluated Signal Log</span>
                  <div className="max-h-60 overflow-y-auto border border-slate-800 rounded bg-slate-950">
                    <table className="w-full text-left font-mono text-[10px]">
                      <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 sticky top-0">
                        <tr>
                          <th className="py-1.5 px-2">Date</th>
                          <th className="py-1.5 px-2">Type</th>
                          <th className="py-1.5 px-2">MFE</th>
                          <th className="py-1.5 px-2">Confirmed</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {backtestReport.signals.map((sig, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/40">
                            <td className="py-1 px-2 text-slate-200">{sig.date}</td>
                            <td className="py-1 px-2">
                              <span
                                className={
                                  sig.signal_type === "potential_top" ? "text-rose-400" : "text-emerald-400"
                                }
                              >
                                {sig.signal_type === "potential_top" ? "TOP" : "BOTTOM"}
                              </span>
                            </td>
                            <td className="py-1 px-2 text-cyan-400">+{sig.mfe}%</td>
                            <td className="py-1 px-2">
                              {sig.reversal_confirmed ? (
                                <span className="text-emerald-400 font-bold">YES</span>
                              ) : (
                                <span className="text-slate-500">NO</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center p-6 text-slate-500 italic">
                Click Run Backtest to test Square of Nine reversals without lookahead bias
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 7: PROJECTS PERSISTENCE ================= */}
        {activeRightTab === "projects" && (
          <div className="space-y-4">
            <div className="border-b border-slate-800 pb-2 flex justify-between items-center">
              <span className="font-semibold text-slate-100 flex items-center gap-1.5 text-sm">
                <FolderOpen className="w-4 h-4 text-indigo-400" /> Saved Analysis Projects
              </span>
              <button
                onClick={handleExportJson}
                className="py-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 flex items-center gap-1 text-[11px]"
              >
                <FileDown className="w-3 h-3" /> Export JSON
              </button>
            </div>

            {/* Save Current Workspace */}
            <div className="space-y-2 bg-slate-950 p-2.5 rounded border border-slate-800">
              <label className="text-slate-400 block font-medium">Save Current Workspace</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Project name (e.g. S&P 500 Bull Roadmap)..."
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleSaveProject}
                  className="py-1 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium flex items-center gap-1 shadow"
                >
                  <Save className="w-3.5 h-3.5" /> Save
                </button>
              </div>
            </div>

            {/* Projects List */}
            <div className="space-y-2">
              <span className="font-medium text-slate-400 block">Database Saved Projects</span>
              {projectsList.length ? (
                projectsList.map((p) => (
                  <div
                    key={p.id}
                    className="p-2.5 rounded bg-slate-950 border border-slate-800 hover:border-slate-700 transition flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-slate-100 block text-xs">{p.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {p.symbol} ({p.timeframe}) • {p.updated_at?.slice(0, 10)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteProject(p.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition"
                      title="Delete Project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center p-4 border border-dashed border-slate-800 rounded text-slate-500 text-[11px]">
                  No projects saved yet. Enter a name above to store your analysis.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  </>
);
}
