"""Comprehensive Automated Test Suite for Gann Mathematical Engine.

Tests all 14 mandatory requirements from Section 16 of the specification,
plus exact TradingFives 2007 reference dataset validation.
"""

import pytest
import math
from datetime import datetime

from backend.math_engine.square_of_nine import (
    calculate_price_step,
    generate_roadmap_grid,
    RoadmapGridResult
)
from backend.math_engine.static_degree import (
    calculate_static_degree,
    interpolate_static_degree,
    generate_static_degree_table,
    export_static_degree_csv
)
from backend.math_engine.price_time_squaring import (
    calculate_price_time_squaring,
    circular_difference,
    evaluate_angle_pair
)
from backend.math_engine.rotations import (
    calculate_square_rotations
)
from backend.math_engine.look_ahead import (
    project_future_alignments
)
from backend.math_engine.swing_detection import (
    Candle,
    SwingPivot,
    build_swing_leg,
    detect_swings_zigzag,
    detect_swings_atr,
    compute_calendar_days
)
from backend.math_engine.backtest import (
    run_gann_backtest
)
from backend.data_providers.market_data import (
    generate_reference_sp500_2007_data
)


# 1. Square of Nine Price Calculations
def test_1_square_of_nine_price_calculations():
    # Base price 100, 360° projection in standard Gann adds 2.0 to square root
    # sqrt(100) = 10.0 -> + 2.0 = 12.0 -> 12^2 = 144.0
    p_360 = calculate_price_step(base_price=100.0, angle=360.0, degree_factor=1.0, direction="bull")
    assert math.isclose(p_360, 144.0, rel_tol=1e-4)


# 2. Upward Price Projections
def test_2_upward_price_projections():
    # 90° upward: F = (90/360) * 2.0 = 0.5
    # sqrt(100) = 10.0 -> 10.5 -> 10.5^2 = 110.25
    p_90 = calculate_price_step(base_price=100.0, angle=90.0, degree_factor=1.0, direction="bull")
    assert math.isclose(p_90, 110.25, rel_tol=1e-4)

    # 180° upward: F = 1.0 -> 11.0^2 = 121.0
    p_180 = calculate_price_step(base_price=100.0, angle=180.0, degree_factor=1.0, direction="bull")
    assert math.isclose(p_180, 121.0, rel_tol=1e-4)


# 3. Downward Price Projections
def test_3_downward_price_projections():
    # 90° downward: F = 0.5
    # sqrt(100) = 10.0 -> 9.5 -> 9.5^2 = 90.25
    p_90_down = calculate_price_step(base_price=100.0, angle=90.0, degree_factor=1.0, direction="bear")
    assert math.isclose(p_90_down, 90.25, rel_tol=1e-4)

    # 180° downward: F = 1.0 -> 9.0^2 = 81.0
    p_180_down = calculate_price_step(base_price=100.0, angle=180.0, degree_factor=1.0, direction="bear")
    assert math.isclose(p_180_down, 81.0, rel_tol=1e-4)

    # Extreme downward clamp to non-negative root
    p_extreme = calculate_price_step(base_price=4.0, angle=720.0, degree_factor=1.0, direction="bear")
    assert p_extreme >= 0.0


# 4. Degree Factor Calculations
def test_4_degree_factor_calculations():
    # Factor = 0.8125 as specified in TradingFives prompt
    # 360° -> F = 2.0 * 0.8125 = 1.625
    # sqrt(100) = 10.0 -> 11.625^2 = 135.140625
    p_factored = calculate_price_step(base_price=100.0, angle=360.0, degree_factor=0.8125, direction="bull")
    assert math.isclose(p_factored, 135.140625, rel_tol=1e-4)


# 5. Multiplier Calculations
def test_5_multiplier_calculations():
    # Multiplier 0.1 for high index prices:
    # Base 1000 * 0.1 = 100. sqrt(100) = 10. + 2.0 = 12. 144 / 0.1 = 1440
    p_mult = calculate_price_step(base_price=1000.0, angle=360.0, degree_factor=1.0, multiplier=0.1, direction="bull")
    assert math.isclose(p_mult, 1440.0, rel_tol=1e-4)


# 6. 90-Degree Rotations
def test_6_rotations_90_degrees():
    # Example from prompt: Input 103.43°
    # Rotation 1: 103.43°
    # Rotation 2: 193.43° (+90)
    # Rotation 3: 283.43° (+180)
    # Rotation 4: 13.43° (+270 = 373.43 mod 360)
    res = calculate_square_rotations(input_angle=103.43, rotation_type="90_degree")
    assert len(res.rotations) == 4
    assert math.isclose(res.rotations[0].angle, 103.43, abs_tol=0.01)
    assert math.isclose(res.rotations[1].angle, 193.43, abs_tol=0.01)
    assert math.isclose(res.rotations[2].angle, 283.43, abs_tol=0.01)
    assert math.isclose(res.rotations[3].angle, 13.43, abs_tol=0.01)


# 7. 60-Degree Rotations
def test_7_rotations_60_degrees():
    res = calculate_square_rotations(input_angle=45.0, rotation_type="60_degree")
    assert len(res.rotations) == 6
    angles = [r.angle for r in res.rotations]
    expected = [45.0, 105.0, 165.0, 225.0, 285.0, 345.0]
    for a, exp in zip(angles, expected):
        assert math.isclose(a, exp, abs_tol=0.01)


# 8. Static Degree Conversion
def test_8_static_degree_conversion():
    # In standard Gann cardinal axis:
    # N = 1 (origin) -> angle 0.0°
    # N = 9 (cycle 1 cardinal) -> sqrt(9) = 3.0, (3-1) % 2 = 0 -> angle 0.0°
    # N = 4 -> sqrt(4) = 2.0, (2-1) % 2 = 1 -> angle 180.0°
    # N = 25 -> sqrt(25) = 5.0, (5-1) % 2 = 0 -> angle 0.0°
    e1 = calculate_static_degree(1.0)
    assert math.isclose(e1.static_degree, 0.0, abs_tol=0.1)

    e9 = calculate_static_degree(9.0)
    assert math.isclose(e9.static_degree, 0.0, abs_tol=0.1)

    e4 = calculate_static_degree(4.0)
    assert math.isclose(e4.static_degree, 180.0, abs_tol=0.1)


# 9. Interpolation
def test_9_static_degree_interpolation():
    interp = interpolate_static_degree(val=10.5)
    assert interp["input_value"] == 10.5
    assert interp["fraction"] == 0.5
    assert interp["lower_integer_entry"]["value"] == 10.0
    assert interp["upper_integer_entry"]["value"] == 11.0


# 10. Trading-Day Counting
def test_10_trading_day_counting():
    p1 = SwingPivot(index=10, date="2007-03-14", price=1363.98, pivot_type="low")
    p2 = SwingPivot(index=94, date="2007-07-13", price=1555.10, pivot_type="high")
    leg = build_swing_leg(p1, p2)
    # Exact market session count is index difference
    assert leg.trading_days == 84


# 11. Calendar-Day Counting
def test_11_calendar_day_counting():
    # From March 14, 2007 to July 13, 2007:
    cal_days = compute_calendar_days("2007-03-14", "2007-07-13")
    assert cal_days == 121


# 12. Look-Ahead Calculations
def test_12_look_ahead_calculations():
    res = project_future_alignments(
        start_date="2007-03-14",
        price_range=191.12,
        degree_set=90,
        horizon_trading_days=90,
        tolerance=4.0
    )
    assert res.start_date == "2007-03-14"
    assert math.isclose(res.price_range, 191.12, abs_tol=0.01)
    assert len(res.projections) > 0
    # Every projection has valid projected_date and confidence score
    for proj in res.projections:
        assert proj.interval_trading_days > 0
        assert 0.0 <= proj.confidence_score <= 100.0


# 13. Swing Detection
def test_13_swing_detection():
    # Test on synthetic triangle wave
    candles = []
    base_dt = datetime(2024, 1, 1)
    # Up to 100
    for i in range(20):
        p = 50.0 + i * 2.5
        candles.append(Candle(time=f"2024-01-{i+1:02d}", open=p-1, high=p+1, low=p-1, close=p))
    # Down to 60
    for i in range(20):
        p = 100.0 - i * 2.0
        candles.append(Candle(time=f"2024-02-{i+1:02d}", open=p-1, high=p+1, low=p-1, close=p))
    
    res = detect_swings_zigzag(candles, min_pct_deviation=5.0, left_bars=2, right_bars=2)
    assert len(res.pivots) >= 2
    assert any(p.pivot_type == "high" for p in res.pivots)


# 14. Historical Backtesting
def test_14_historical_backtesting():
    candles = generate_reference_sp500_2007_data()
    bt = run_gann_backtest(
        candles=candles,
        symbol="SP500_2007",
        eval_horizon_bars=10,
        reversal_min_pct=1.5,
        angular_tolerance=5.0
    )
    assert bt.total_candles_analyzed == len(candles)
    assert bt.train_bars > 0
    assert bt.test_bars > 0
    assert bt.total_squaring_signals >= 0
    assert 0.0 <= bt.reversal_win_rate_pct <= 100.0


# 15. Reference Validation: TradingFives S&P 500 2007 Screenshot Data
def test_15_tradingfives_sp500_reference_validation():
    """Validates the exact reference figures specified in the prompt:
    - Starting pivot: 1363.98
    - Ending pivot: 1555.10
    - Price range: 191.12
    - Trading days: 84
    - Calendar days: 121
    - Subsequent pivot: 1370.60
    - Bearish price range: 184.50
    """
    p_start = 1363.98
    p_end = 1555.10
    p_subsequent = 1370.60

    # Bullish Swing:
    piv_start = SwingPivot(index=0, date="2007-03-14", price=p_start, pivot_type="low")
    piv_end = SwingPivot(index=84, date="2007-07-13", price=p_end, pivot_type="high")
    bull_swing = build_swing_leg(piv_start, piv_end)

    assert math.isclose(bull_swing.price_range, 191.12, abs_tol=1e-2), f"Expected 191.12, got {bull_swing.price_range}"
    assert bull_swing.trading_days == 84, f"Expected 84, got {bull_swing.trading_days}"
    assert bull_swing.calendar_days == 121, f"Expected 121, got {bull_swing.calendar_days}"
    assert bull_swing.direction == "bullish"

    # Bearish Swing:
    piv_bear = SwingPivot(index=108, date="2007-08-16", price=p_subsequent, pivot_type="low")
    bear_swing = build_swing_leg(piv_end, piv_bear)

    assert math.isclose(bear_swing.price_range, 184.50, abs_tol=1e-2), f"Expected 184.50, got {bear_swing.price_range}"
    assert bear_swing.direction == "bearish"
