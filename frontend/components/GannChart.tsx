"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickSeries,
  BarSeries,
  LineSeries,
  HistogramSeries,
  ColorType,
  CrosshairMode,
  Time
} from "lightweight-charts";
import { useStore } from "@/lib/store";
import { CandleData, SwingPivot, SwingLeg } from "@/lib/types";
import { Camera, ZoomIn, RefreshCw, Maximize2 } from "lucide-react";

export default function GannChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const chartApiRef = useRef<IChartApi | null>(null);
  const mainSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<any> | null>(null);

  const [hoveredCandle, setHoveredCandle] = useState<CandleData | null>(null);

  const {
    candles,
    chartType,
    showVolume,
    bullGrid,
    bearGrid,
    gridSettings,
    pivots,
    swings,
    selectedPivot,
    lookAheadResult,
    showLookAheadMarkers,
    selectPivot
  } = useStore();

  // Draw Gann Overlay on HTML5 Canvas aligned with Lightweight Charts
  const renderGannOverlay = useCallback(() => {
    const canvas = canvasRef.current;
    const chart = chartApiRef.current;
    const series = mainSeriesRef.current;
    if (!canvas || !chart || !series || !candles.length) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const timeScale = chart.timeScale();

    // Helper: Map Candle Date to X coordinate
    const dateToX = (dateStr: string): number | null => {
      try {
        const x = timeScale.timeToCoordinate(dateStr as unknown as Time);
        return x;
      } catch {
        return null;
      }
    };

    // Helper: Map Price to Y coordinate
    const priceToY = (price: number): number | null => {
      try {
        const y = series.priceToCoordinate(price);
        return y;
      } catch {
        return null;
      }
    };

    // Helper: Draw single Roadmap Grid
    const drawGrid = (
      gridResult: typeof bullGrid.result,
      isGhost: boolean,
      baseColor: string
    ) => {
      if (!gridResult) return;

      const alpha = isGhost ? 0.35 : gridSettings.lineOpacity;
      const lineWidth = isGhost ? 1 : gridSettings.lineThickness;

      // 1. Horizontal Price Levels
      if (gridSettings.showHorizontal) {
        gridResult.horizontal_levels.forEach((lvl) => {
          const y = priceToY(lvl.price);
          if (y !== null && y >= 0 && y <= height) {
            ctx.beginPath();
            ctx.strokeStyle = lvl.is_major ? baseColor : `${baseColor}99`;
            ctx.lineWidth = lvl.is_major ? lineWidth + 0.5 : lineWidth;
            if (isGhost || !lvl.is_major) {
              ctx.setLineDash([4, 4]);
            } else {
              ctx.setLineDash([]);
            }
            ctx.globalAlpha = alpha;
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();

            // Label on the left margin
            ctx.globalAlpha = isGhost ? 0.5 : 0.9;
            ctx.fillStyle = baseColor;
            ctx.font = lvl.is_major ? "bold 10px monospace" : "9px monospace";
            ctx.fillText(
              `${lvl.label} ${lvl.price.toFixed(2)}`,
              10,
              Math.max(12, y - 3)
            );
          }
        });
      }

      // 2. Vertical Time Projection Lines
      if (gridSettings.showVertical) {
        gridResult.vertical_time_lines.forEach((tl) => {
          if (!tl.projected_date) return;
          const x = dateToX(tl.projected_date);
          if (x !== null && x >= 0 && x <= width) {
            ctx.beginPath();
            ctx.strokeStyle = tl.is_major ? baseColor : `${baseColor}88`;
            ctx.lineWidth = lineWidth;
            ctx.setLineDash(isGhost ? [3, 5] : [2, 3]);
            ctx.globalAlpha = alpha * 0.7;
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();

            // Vertical label at top
            ctx.globalAlpha = 0.8;
            ctx.fillStyle = baseColor;
            ctx.font = "9px monospace";
            ctx.fillText(tl.label, x + 3, 20);
          }
        });
      }

      // 3. Diagonal Roadmap Channels
      if (gridSettings.showChannels && gridResult.diagonal_channels) {
        const startX = dateToX(gridResult.start_date);
        const startY = priceToY(gridResult.start_price);

        if (startX !== null && startY !== null) {
          gridResult.diagonal_channels.forEach((ch) => {
            const endY = priceToY(ch.end_price);
            if (endY !== null) {
              const xEnd = startX + ch.end_bar * 12; // estimated visual projection length

              ctx.beginPath();
              ctx.strokeStyle = ch.channel_type === "main" ? gridSettings.channelColor : baseColor;
              ctx.lineWidth = ch.channel_type === "main" ? 1.5 : 1.0;
              ctx.setLineDash(ch.channel_type === "harmonic" ? [4, 4] : []);
              ctx.globalAlpha = alpha * 0.9;
              ctx.moveTo(startX, startY);
              ctx.lineTo(Math.min(width, xEnd), endY);
              ctx.stroke();

              // Channel tag
              ctx.font = "10px sans-serif";
              ctx.fillStyle = ch.channel_type === "main" ? gridSettings.channelColor : baseColor;
              ctx.fillText(ch.name, Math.min(width - 90, xEnd - 40), endY - 4);
            }
          });
        }
      }
    };

    // Render Bull Grid
    if (bullGrid.isActive && bullGrid.result) {
      drawGrid(
        bullGrid.result,
        bullGrid.isGhost,
        bullGrid.isGhost ? gridSettings.ghostColor : gridSettings.bullColor
      );
    }

    // Render Bear Grid
    if (bearGrid.isActive && bearGrid.result) {
      drawGrid(
        bearGrid.result,
        bearGrid.isGhost,
        bearGrid.isGhost ? gridSettings.ghostColor : gridSettings.bearColor
      );
    }

    // 4. Render Swing Pivots and Information Labels (TradingFives Style)
    ctx.setLineDash([]);
    pivots.forEach((p) => {
      const x = dateToX(p.date);
      const y = priceToY(p.price);
      if (x !== null && y !== null && x >= 0 && x <= width) {
        const isSelected = selectedPivot && selectedPivot.date === p.date;
        const isHigh = p.pivot_type === "high";

        // Pivot Circle Marker
        ctx.beginPath();
        ctx.arc(x, y, isSelected ? 6 : 4, 0, Math.PI * 2);
        ctx.fillStyle = isHigh ? "#ef4444" : "#10b981";
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = isSelected ? "#38bdf8" : "#ffffff";
        ctx.stroke();

        // Label box
        const text = `${p.price.toFixed(2)}`;
        ctx.font = "bold 10px monospace";
        ctx.fillStyle = "#ffffff";
        const labelY = isHigh ? y - 10 : y + 16;
        ctx.fillText(text, x - 15, labelY);
      }
    });

    // 5. Connect Detected Swings with Trend Lines & Info Box
    swings.forEach((s) => {
      const x1 = dateToX(s.start_date);
      const y1 = priceToY(s.start_price);
      const x2 = dateToX(s.end_date);
      const y2 = priceToY(s.end_price);

      if (x1 !== null && y1 !== null && x2 !== null && y2 !== null) {
        ctx.beginPath();
        ctx.strokeStyle = s.direction === "bullish" ? "#10b98188" : "#ef444488";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([2, 2]);
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Swing Data Callout directly on chart (Reference format from TradingFives)
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;

        if (midX > 40 && midX < width - 120) {
          ctx.setLineDash([]);
          ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
          ctx.fillRect(midX - 5, midY - 32, 115, 42);
          ctx.strokeStyle = s.direction === "bullish" ? "#10b981" : "#ef4444";
          ctx.lineWidth = 1;
          ctx.strokeRect(midX - 5, midY - 32, 115, 42);

          ctx.fillStyle = "#f8fafc";
          ctx.font = "bold 9px monospace";
          ctx.fillText(`RANGE: ${s.price_range.toFixed(2)}`, midX, midY - 20);
          ctx.fillText(`TRADING: ${s.trading_days} days`, midX, midY - 9);
          ctx.fillText(`CALENDAR: ${s.calendar_days} days`, midX, midY + 2);
        }
      }
    });

    // 6. Render Look-Ahead Future Date Projections
    if (showLookAheadMarkers && lookAheadResult?.projections) {
      lookAheadResult.projections.slice(0, 8).forEach((proj) => {
        const x = dateToX(proj.projected_date);
        if (x !== null && x >= 0 && x <= width) {
          ctx.beginPath();
          ctx.strokeStyle = "#38bdf8";
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 3]);
          ctx.globalAlpha = 0.65;
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();

          // Projection Badge
          ctx.globalAlpha = 0.9;
          ctx.fillStyle = "#0284c7";
          ctx.fillRect(x - 2, 40, 75, 22);
          ctx.fillStyle = "#ffffff";
          ctx.font = "8px monospace";
          ctx.fillText(`${proj.aspect_type.split(" ")[0]} ${proj.projected_date}`, x + 2, 50);
          ctx.fillText(`Conf: ${proj.confidence_score.toFixed(0)}%`, x + 2, 58);
        }
      });
    }

    ctx.globalAlpha = 1.0;
    ctx.setLineDash([]);
  }, [
    bullGrid,
    bearGrid,
    gridSettings,
    pivots,
    swings,
    selectedPivot,
    lookAheadResult,
    showLookAheadMarkers,
    candles
  ]);

  // Initialize and Update Lightweight Charts
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const container = chartContainerRef.current;
    container.innerHTML = "";

    // 1. Create Chart
    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: "#090d16" },
        textColor: "#94a3b8"
      },
      grid: {
        vertLines: { color: "#1e293b", style: 2 },
        horzLines: { color: "#1e293b", style: 2 }
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: "#38bdf8", width: 1, style: 3 },
        horzLine: { color: "#38bdf8", width: 1, style: 3 }
      },
      timeScale: {
        borderColor: "#334155",
        timeVisible: true,
        secondsVisible: false
      },
      rightPriceScale: {
        borderColor: "#334155",
        autoScale: true
      }
    });

    chartApiRef.current = chart;

    // 2. Add Main Financial Series
    let series: ISeriesApi<any>;

    if (chartType === "candlestick") {
      series = chart.addSeries(CandlestickSeries, {
        upColor: "#10b981",
        downColor: "#ef4444",
        borderVisible: false,
        wickUpColor: "#10b981",
        wickDownColor: "#ef4444"
      });
    } else if (chartType === "bar") {
      series = chart.addSeries(BarSeries, {
        upColor: "#10b981",
        downColor: "#ef4444"
      });
    } else {
      series = chart.addSeries(LineSeries, {
        color: "#38bdf8",
        lineWidth: 2
      });
    }
    mainSeriesRef.current = series;

    // 3. Add Volume Series
    if (showVolume) {
      const volSeries = chart.addSeries(HistogramSeries, {
        color: "#334155",
        priceFormat: { type: "volume" },
        priceScaleId: "" // overlay
      });
      volSeries.priceScale().applyOptions({
        scaleMargins: { top: 0.82, bottom: 0 }
      });
      volumeSeriesRef.current = volSeries;
    }

    // 4. Set Candle Data
    if (candles.length) {
      if (chartType === "line") {
        series.setData(
          candles.map((c) => ({
            time: c.time as unknown as Time,
            value: c.close
          }))
        );
      } else {
        series.setData(
          candles.map((c) => ({
            time: c.time as unknown as Time,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close
          }))
        );
      }

      if (showVolume && volumeSeriesRef.current) {
        volumeSeriesRef.current.setData(
          candles.map((c) => ({
            time: c.time as unknown as Time,
            value: c.volume || 100000,
            color: c.close >= c.open ? "#10b98133" : "#ef444433"
          }))
        );
      }

      chart.timeScale().fitContent();
    }

    // 5. Crosshair Movement Subscription
    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.seriesData) {
        setHoveredCandle(null);
        return;
      }
      const data = param.seriesData.get(series) as any;
      if (data) {
        setHoveredCandle({
          time: String(param.time),
          open: data.open ?? data.value,
          high: data.high ?? data.value,
          low: data.low ?? data.value,
          close: data.close ?? data.value,
          volume: data.value
        });
      }
    });

    // 6. Click Handler for Pivot Selection
    chart.subscribeClick((param) => {
      if (param.time && param.point) {
        const timeStr = String(param.time);
        const candle = candles.find((c) => c.time === timeStr);
        if (candle) {
          // Check if near high or low
          const y = param.point.y;
          const yHigh = series.priceToCoordinate(candle.high) || 0;
          const yLow = series.priceToCoordinate(candle.low) || 0;
          const isHigh = Math.abs(y - yHigh) < Math.abs(y - yLow);

          const pivot: SwingPivot = {
            index: candles.indexOf(candle),
            date: candle.time,
            price: isHigh ? candle.high : candle.low,
            pivot_type: isHigh ? "high" : "low",
            is_manual: true
          };
          selectPivot(pivot);
        }
      }
    });

    // 7. TimeScale Change Listener to trigger Canvas Repaint
    const timeScale = chart.timeScale();
    timeScale.subscribeVisibleTimeRangeChange(() => {
      requestAnimationFrame(renderGannOverlay);
    });
    timeScale.subscribeVisibleLogicalRangeChange(() => {
      requestAnimationFrame(renderGannOverlay);
    });

    // 8. Canvas Resize Sync
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries.length || !chartApiRef.current) return;
      const { width, height } = entries[0].contentRect;
      chart.applyOptions({ width, height });

      if (canvasRef.current) {
        canvasRef.current.width = width;
        canvasRef.current.height = height;
        renderGannOverlay();
      }
    });
    resizeObserver.observe(container);

    // Initial canvas dimensions
    if (canvasRef.current) {
      canvasRef.current.width = container.clientWidth;
      canvasRef.current.height = container.clientHeight;
      setTimeout(renderGannOverlay, 50);
    }

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [candles, chartType, showVolume, selectPivot, renderGannOverlay]);

  // Re-render canvas overlay whenever roadmap results or swings update
  useEffect(() => {
    const timer = setTimeout(() => {
      renderGannOverlay();
    }, 40);
    return () => clearTimeout(timer);
  }, [renderGannOverlay]);

  // Export Screenshot
  const exportScreenshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `Gann_Roadmap_${candles[0]?.time || "chart"}.png`;
    a.click();
  };

  const handleFit = () => {
    chartApiRef.current?.timeScale().fitContent();
  };

  const handleReset = () => {
    chartApiRef.current?.timeScale().resetTimeScale();
    chartApiRef.current?.priceScale("right").applyOptions({ autoScale: true });
  };

  return (
    <div className="relative flex-1 h-full w-full bg-slate-950 overflow-hidden select-none">
      {/* Top Floating Candlestick Telemetry */}
      <div className="absolute top-2 left-4 z-20 flex items-center gap-3 px-3 py-1.5 rounded bg-slate-900/85 border border-slate-800 text-xs text-slate-300 backdrop-blur pointer-events-none">
        {hoveredCandle ? (
          <>
            <span className="font-semibold text-cyan-400">{hoveredCandle.time}</span>
            <span>O: <span className="font-mono text-slate-100">{hoveredCandle.open.toFixed(2)}</span></span>
            <span>H: <span className="font-mono text-emerald-400">{hoveredCandle.high.toFixed(2)}</span></span>
            <span>L: <span className="font-mono text-rose-400">{hoveredCandle.low.toFixed(2)}</span></span>
            <span>C: <span className="font-mono text-cyan-300">{hoveredCandle.close.toFixed(2)}</span></span>
          </>
        ) : (
          <span className="text-slate-500 italic">Hover cursor over chart candles to inspect exact OHLC coordinates</span>
        )}
      </div>

      {/* Quick Chart Action Toolbar Floating Top Right */}
      <div className="absolute top-2 right-4 z-20 flex items-center gap-1.5 px-2 py-1 rounded bg-slate-900/85 border border-slate-800 backdrop-blur">
        <button
          onClick={handleFit}
          title="Auto-Fit Chart"
          className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded transition"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleReset}
          title="Reset Scale"
          className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded transition"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
        <button
          onClick={exportScreenshot}
          title="Export High-Res Snapshot"
          className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition"
        >
          <Camera className="w-4 h-4" />
        </button>
      </div>

      {/* Lightweight Charts Mount Container */}
      <div ref={chartContainerRef} className="absolute inset-0 w-full h-full" />

      {/* Synchronized HTML5 Canvas Overlay for Gann Square of Nine Roadmap */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      />
    </div>
  );
}
