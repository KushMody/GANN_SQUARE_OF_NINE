"""Gann Analysis and Mathematical Engine API Router.
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Query, Response
from pydantic import BaseModel, Field

from ...math_engine.square_of_nine import (
    generate_roadmap_grid,
    RoadmapGridResult
)
from ...math_engine.static_degree import (
    generate_static_degree_table,
    export_static_degree_csv,
    interpolate_static_degree,
    calculate_static_degree,
    StaticDegreeTableResponse
)
from ...math_engine.price_time_squaring import (
    calculate_price_time_squaring,
    PriceTimeSquaringResult
)
from ...math_engine.rotations import (
    calculate_square_rotations,
    RotationsResult
)
from ...math_engine.look_ahead import (
    project_future_alignments,
    LookAheadResult
)
from ...math_engine.swing_detection import (
    Candle,
    detect_swings_zigzag,
    detect_swings_atr,
    build_swing_leg,
    SwingPivot,
    SwingAnalysisResult
)
from ...math_engine.backtest import (
    run_gann_backtest,
    BacktestReport
)

router = APIRouter(prefix="/api/gann", tags=["Gann Engine"])


# Request Models
class RoadmapGridRequest(BaseModel):
    start_price: float = Field(..., description="Pivot start price")
    start_date: str = Field(..., description="Pivot start date YYYY-MM-DD")
    start_time: Optional[str] = Field(None, description="Pivot start time HH:MM")
    direction: str = Field("bull", description="'bull' or 'bear'")
    mode: str = Field("grid", description="'grid' or 'ghost'")
    degree_set: int = Field(90, description="90 or 60")
    degree_factor: float = Field(1.0, description="e.g. 0.8125 or 1.0")
    multiplier: float = Field(1.0, description="Price multiplier")
    num_cycles: int = Field(4, description="Cycles to project")
    trading_dates: Optional[List[str]] = Field(None, description="Known forward dates")


class SwingsRequest(BaseModel):
    candles: List[Candle]
    method: str = Field("zigzag", description="'zigzag' or 'atr'")
    min_pct_deviation: float = Field(3.0)
    left_bars: int = Field(5)
    right_bars: int = Field(5)
    atr_period: int = Field(14)
    atr_multiplier: float = Field(2.5)


class SquaringRequest(BaseModel):
    price_range: float
    trading_days: Optional[int] = None
    calendar_days: Optional[int] = None
    intraday_bars: Optional[int] = None
    method_id: str = Field("method_1")
    price_multiplier: float = Field(1.0)
    time_multiplier: float = Field(1.0)
    tolerance_degrees: float = Field(5.0)
    convention: str = Field("gann_cardinal_axis")


class RotationsRequest(BaseModel):
    input_angle: float
    rotation_type: str = Field("90_degree", description="'90_degree' or '60_degree'")
    comparison_targets: Optional[Dict[str, float]] = None
    tolerance: float = Field(3.0)


class LookAheadRequest(BaseModel):
    start_date: str
    price_range: float
    degree_set: int = Field(90)
    horizon_trading_days: int = Field(120)
    tolerance: float = Field(4.0)
    price_multiplier: float = Field(1.0)
    time_multiplier: float = Field(1.0)
    known_session_dates: Optional[List[str]] = None


class BacktestRequest(BaseModel):
    candles: List[Candle]
    symbol: str = Field("BENCHMARK")
    timeframe: str = Field("1D")
    eval_horizon_bars: int = Field(10)
    reversal_min_pct: float = Field(2.0)
    angular_tolerance: float = Field(4.0)
    degree_set: int = Field(90)
    degree_factor: float = Field(1.0)
    slippage_pct: float = Field(0.05)
    commission_pct: float = Field(0.05)


@router.post("/roadmap", response_model=RoadmapGridResult)
def get_roadmap_grid(req: RoadmapGridRequest):
    return generate_roadmap_grid(
        start_price=req.start_price,
        start_date=req.start_date,
        start_time=req.start_time,
        direction=req.direction,
        mode=req.mode,
        degree_set=req.degree_set,
        degree_factor=req.degree_factor,
        multiplier=req.multiplier,
        num_cycles=req.num_cycles,
        trading_dates=req.trading_dates
    )


@router.post("/swings", response_model=SwingAnalysisResult)
def get_swings(req: SwingsRequest):
    if req.method == "atr":
        return detect_swings_atr(
            candles=req.candles,
            atr_period=req.atr_period,
            atr_multiplier=req.atr_multiplier
        )
    return detect_swings_zigzag(
        candles=req.candles,
        min_pct_deviation=req.min_pct_deviation,
        left_bars=req.left_bars,
        right_bars=req.right_bars
    )


@router.get("/static-degree/table", response_model=StaticDegreeTableResponse)
def get_static_degree_table(
    start: int = 1,
    end: int = 1000,
    multiplier: float = 1.0,
    convention: str = "gann_cardinal_axis",
    precision: int = 2
):
    return generate_static_degree_table(
        start_val=int(start),
        end_val=int(end),
        step=1,
        multiplier=float(multiplier),
        convention=convention,
        precision=int(precision)
    )


@router.get("/static-degree/lookup")
def lookup_static_degree(
    value: float,
    multiplier: float = 1.0,
    convention: str = "gann_cardinal_axis",
    precision: int = 4
):
    return interpolate_static_degree(
        val=float(value),
        multiplier=float(multiplier),
        convention=convention,
        precision=int(precision)
    )


@router.get("/static-degree/csv")
def download_static_degree_csv(
    start: int = 1,
    end: int = 1000,
    multiplier: float = 1.0,
    convention: str = "gann_cardinal_axis"
):
    csv_text = export_static_degree_csv(int(start), int(end), float(multiplier), convention)
    return Response(
        content=csv_text,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=static_degree_{start}_{end}.csv"}
    )


@router.post("/squaring", response_model=PriceTimeSquaringResult)
def execute_squaring(req: SquaringRequest):
    return calculate_price_time_squaring(
        price_range=req.price_range,
        trading_days=req.trading_days,
        calendar_days=req.calendar_days,
        intraday_bars=req.intraday_bars,
        method_id=req.method_id,
        price_multiplier=req.price_multiplier,
        time_multiplier=req.time_multiplier,
        tolerance_degrees=req.tolerance_degrees,
        convention=req.convention
    )


@router.post("/rotations", response_model=RotationsResult)
def execute_rotations(req: RotationsRequest):
    return calculate_square_rotations(
        input_angle=req.input_angle,
        rotation_type=req.rotation_type,
        comparison_targets=req.comparison_targets,
        tolerance=req.tolerance
    )


@router.post("/look-ahead", response_model=LookAheadResult)
def execute_look_ahead(req: LookAheadRequest):
    return project_future_alignments(
        start_date=req.start_date,
        price_range=req.price_range,
        degree_set=req.degree_set,
        horizon_trading_days=req.horizon_trading_days,
        tolerance=req.tolerance,
        price_multiplier=req.price_multiplier,
        time_multiplier=req.time_multiplier,
        known_session_dates=req.known_session_dates
    )


@router.post("/backtest", response_model=BacktestReport)
def execute_backtest(req: BacktestRequest):
    return run_gann_backtest(
        candles=req.candles,
        symbol=req.symbol,
        timeframe=req.timeframe,
        eval_horizon_bars=req.eval_horizon_bars,
        reversal_min_pct=req.reversal_min_pct,
        angular_tolerance=req.angular_tolerance,
        degree_set=req.degree_set,
        degree_factor=req.degree_factor,
        slippage_pct=req.slippage_pct,
        commission_pct=req.commission_pct
    )
