"""Market Data API Router.
"""

from typing import Optional, List
from fastapi import APIRouter, Query
from ...data_providers.market_data import (
    SUPPORTED_SYMBOLS,
    MarketSymbol,
    fetch_historical_candles
)

router = APIRouter(prefix="/api/market-data", tags=["Market Data"])


@router.get("/symbols", response_model=List[MarketSymbol])
def get_symbols():
    """List all supported symbols and markets."""
    return SUPPORTED_SYMBOLS


@router.get("/history")
def get_history(
    symbol: str = Query("SP500_2007", description="Ticker symbol or SP500_2007 reference"),
    timeframe: str = Query("1D", description="1D, 1W, 1M, 1H"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None)
):
    """Retrieve historical OHLC candlestick data."""
    return fetch_historical_candles(
        symbol=symbol,
        timeframe=timeframe,
        start_date=start_date,
        end_date=end_date
    )
