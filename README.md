# Gann Square of Nine Roadmap & Price-Time Analysis Platform

A professional, quantitative browser-based financial charting and market analysis application inspired by the **TradingFives Square of Nine Roadmap Chart** software.

Built for traders, quantitative analysts, and financial researchers studying geometric price-time squaring and dynamic Square of Nine roadmaps.

---

## Key Features

### 1. Square of Nine Roadmap Charts
- **Bull Grid & Bear Grid**: Independent upward and downward roadmap projections from any selected pivot point.
- **Ghost Mode**: Projected future levels and channels rendered with non-intrusive styling for look-ahead scenario planning.
- **90° & 60° Degree Sets**: Switch between cardinal (90°, 180°, 270°, 360°) and hexagonal (60°, 120°, 180°, 240°, 300°, 360°) configurations without page reload.
- **Configurable Degree Factor**: Decimal degree factors (such as the default TradingFives `0.8125` factor or custom factors).
- **Price Multipliers**: Multipliers (`1.0`, `0.1`, `10.0`, `100.0`) to handle high-nominal indices (e.g., S&P 500, NIFTY 50), single stocks, forex pairs, or cryptocurrencies.
- **Horizontal Price Levels & Vertical Time Lines**: Synchronized price steps and time cycles.
- **Diagonal Roadmap Channels**: Gann 1x1, 1x2, 2x1 harmonic angles and corner channel envelope.

### 2. Historical Swing Detection & Statistics
- **Auto & Manual Swing Modes**: Configurable ZigZag and ATR-based threshold detection, or manual candle clicking.
- **Exact Trading Session Counting**: Counts real market trading days (excluding weekends and market holidays), calendar days, and intraday bars.
- **TradingFives 2007 S&P 500 Reference Validation**:
  - Starting Pivot: **1363.98** (March 14, 2007)
  - Ending Pivot: **1555.10** (July 13, 2007)
  - Price Range: **191.12**
  - Trading Days: **84**
  - Calendar Days: **121**
  - Bearish Pivot: **1370.60** (August 16, 2007)
  - Bearish Range: **184.50**

### 3. Price-Time Squaring Module
- **Method 1**: *Previous Trend Price Range vs Current Trend Time* (fully verified and implemented).
- **Extensible Architecture**: Modular hooks for methods 2 through 5.
- **Angular Conversion**: Converts price ranges and elapsed time into Square of Nine circular degrees (0–360°).
- **Aspect Alignment**: Identifies Conjunctions (0°), Squares (90°/270°), Oppositions (180°), and Trines (120°/240°) within configurable orb tolerances.

### 4. Interactive Static Degree Table
- Real-time lookup for numbers **1 to 1000+**.
- Full search and filtering by number, angle, quadrant, or aspect.
- Continuous interpolation for non-integer decimal inputs.
- One-click **CSV export**.

### 5. Square Rotations Tool
- Generates 90° and 60° rotation sequences normalized to 0–360°.
- Detects matches against price and time angles within a configurable tolerance.

### 6. Look-Ahead Projection Tool
- Projects future calendar dates and trading-day horizons where price-time squaring is mathematically scheduled.
- Displays projected dates directly as vertical markers on the central candlestick chart.

### 7. Quantitative Backtesting Engine
- Evaluates historical predictive performance of price-time squaring signals without look-ahead bias.
- Metrics: Reversal win rate, Maximum Adverse Excursion (MAE), Maximum Favourable Excursion (MFE), average bars to reversal, and false-positive rate.

### 8. Project Storage & Export
- Save analysis projects directly into PostgreSQL / SQLite database.
- Export and import complete analysis states as JSON.

---

## Technology Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, TradingView Lightweight Charts v5, Zustand, Lucide Icons.
- **Backend**: Python 3.11, FastAPI, NumPy, Pandas, Pydantic v2, SQLAlchemy, Uvicorn, yfinance.
- **Database**: PostgreSQL (production) / SQLite (development).

---

## Project Structure

```
├── backend/
│   ├── api/
│   │   ├── main.py                  # FastAPI app entrypoint
│   │   └── routers/
│   │       ├── gann_router.py       # Roadmap, squaring, rotations, look-ahead, backtest
│   │       ├── market_data_router.py# Historical candles & symbol catalog
│   │       └── projects_router.py   # Analysis project persistence CRUD
│   ├── data_providers/
│   │   └── market_data.py           # yfinance + TradingFives 2007 reference dataset
│   ├── database/
│   │   ├── db.py                    # SQLAlchemy session & SQLite/Postgres engine
│   │   └── models.py                # Database models
│   ├── math_engine/
│   │   ├── square_of_nine.py        # Core Square of Nine price/time/channel calculations
│   │   ├── static_degree.py         # Static degree table, interpolation, CSV export
│   │   ├── price_time_squaring.py   # Squaring methodologies & aspect detection
│   │   ├── rotations.py             # 90° & 60° rotation sequences
│   │   ├── look_ahead.py            # Future date alignment projections
│   │   ├── swing_detection.py       # ZigZag, ATR, and manual swing pivots
│   │   └── backtest.py              # Quantitative backtesting engine
│   └── tests/
│       ├── test_math_engine.py      # 15 mandatory unit tests & reference validation
│       └── test_api.py              # Integration tests for all API endpoints
├── frontend/
│   ├── app/
│   │   ├── globals.css              # Financial terminal styling
│   │   ├── layout.tsx               # Root layout
│   │   └── page.tsx                 # Main application dashboard
│   ├── components/
│   │   ├── GannChart.tsx            # Lightweight Charts + HTML5 Gann Canvas overlay
│   │   ├── LeftControlPanel.tsx     # Bull/Bear Grid, Ghost, and Grid settings
│   │   ├── RightPanel.tsx           # Swings, Squaring, Table, Rotations, Look-Ahead, Backtest, Projects
│   │   └── TopToolbar.tsx           # Symbols, timeframes, quick toggles, clear
│   ├── lib/
│   │   ├── api.ts                   # Backend API client
│   │   ├── store.ts                 # Zustand reactive global store
│   │   └── types.ts                 # Full TypeScript interfaces
│   └── package.json
├── .env.example
└── README.md
```

---

## Quickstart Installation & Setup

### Prerequisites
- Node.js (v18 or higher) and npm
- Python 3.10+ (Python 3.11 recommended) or `uv`

### 1. Backend Setup

```bash
# Navigate to workspace root
cd WORK2

# Create Python virtual environment
python -m venv backend/.venv

# Activate virtual environment
# Windows:
backend\.venv\Scripts\activate
# Linux/macOS:
source backend/.venv/bin/activate

# Install dependencies
pip install fastapi uvicorn pydantic numpy pandas sqlalchemy yfinance pytest httpx python-multipart

# Run unit tests to verify mathematical correctness
$env:PYTHONPATH="."
pytest backend/tests -v
```

All 25 automated tests will run and pass, validating all Square of Nine formulas and the TradingFives reference values!

To start the FastAPI backend:
```bash
uvicorn backend.api.main:app --host 0.0.0.0 --port 8000 --reload
```
The API documentation is interactively available at: `http://localhost:8000/docs`

---

### 2. Frontend Setup

```bash
# In another terminal, navigate to frontend
cd frontend

# Install dependencies
npm install

# Build production bundle
npm run build

# Start local server
npm run dev
```

Open your browser at `http://localhost:3000` to interact with the platform.

---

## Deployment Guide

### Frontend Deployment (Vercel)
1. Push repository to GitHub/GitLab.
2. In Vercel, import the repository and set the Root Directory to `frontend`.
3. Set the Environment Variable:
   - `NEXT_PUBLIC_API_URL`: URL of your deployed backend (e.g. `https://your-api.railway.app`).
4. Deploy!

### Backend Deployment (Railway / Render / Docker)
1. Create a `Procfile` or Dockerfile pointing to:
   ```
   web: uvicorn backend.api.main:app --host 0.0.0.0 --port $PORT
   ```
2. Provision a PostgreSQL instance and set `DATABASE_URL` in the hosting environment variables.
3. Deploy!
