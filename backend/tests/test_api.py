"""API Direct Route Unit Tests.
"""

from backend.api.main import health_check
from backend.api.routers.market_data_router import get_symbols, get_history
from backend.api.routers.gann_router import (
    get_roadmap_grid,
    get_static_degree_table,
    download_static_degree_csv,
    execute_squaring,
    execute_rotations,
    execute_look_ahead,
    RoadmapGridRequest,
    SquaringRequest,
    RotationsRequest,
    LookAheadRequest
)
from backend.database.db import SessionLocal, init_db
from backend.database.models import ProjectModel


def setup_module():
    init_db()


def test_health_check_direct():
    res = health_check()
    assert res["status"] == "online"
    assert "TradingFives" in res["reference_dataset"]


def test_symbols_endpoint_direct():
    syms = get_symbols()
    assert len(syms) > 0
    assert any(s.symbol == "SP500_2007" for s in syms)


def test_history_reference_sp500_direct():
    data = get_history(symbol="SP500_2007", timeframe="1D")
    assert data["symbol"] == "SP500_2007"
    candles = data["candles"]
    assert len(candles) >= 100
    assert candles[0]["low"] == 1363.98
    jul_13 = next(c for c in candles if "2007-07-13" in c["time"])
    assert jul_13["high"] == 1555.10


def test_roadmap_grid_api_direct():
    req = RoadmapGridRequest(
        start_price=1363.98,
        start_date="2007-03-14",
        direction="bull",
        degree_set=90,
        degree_factor=1.0,
        multiplier=1.0,
        num_cycles=2
    )
    grid = get_roadmap_grid(req)
    assert grid.grid_type == "bull"
    assert len(grid.horizontal_levels) > 0
    assert len(grid.vertical_time_lines) > 0
    assert len(grid.diagonal_channels) > 0


def test_static_degree_table_api_direct():
    table = get_static_degree_table(start=1, end=50)
    assert table.total_entries == 50
    assert table.entries[0].value == 1.0


def test_static_degree_csv_api_direct():
    res = download_static_degree_csv(start=1, end=10)
    csv_body = res.body.decode("utf-8")
    assert "Value,SquareRoot,Cycle" in csv_body


def test_squaring_api_direct():
    req = SquaringRequest(
        price_range=191.12,
        trading_days=84,
        calendar_days=121
    )
    res = execute_squaring(req)
    assert res.price_range == 191.12
    assert "trading_days" in res.evaluations


def test_rotations_api_direct():
    req = RotationsRequest(
        input_angle=103.43,
        rotation_type="90_degree"
    )
    res = execute_rotations(req)
    assert len(res.rotations) == 4


def test_look_ahead_api_direct():
    req = LookAheadRequest(
        start_date="2007-03-14",
        price_range=191.12,
        degree_set=90,
        horizon_trading_days=60
    )
    res = execute_look_ahead(req)
    assert len(res.projections) > 0


def test_projects_crud_direct():
    db = SessionLocal()
    try:
        p = ProjectModel(
            name="Direct Test Project",
            symbol="SP500_2007",
            timeframe="1D",
            config_json="{}"
        )
        db.add(p)
        db.commit()
        db.refresh(p)
        assert p.id is not None
        assert p.name == "Direct Test Project"

        # Query
        fetched = db.query(ProjectModel).filter(ProjectModel.id == p.id).first()
        assert fetched is not None
        assert fetched.symbol == "SP500_2007"

        # Cleanup
        db.delete(fetched)
        db.commit()
    finally:
        db.close()
