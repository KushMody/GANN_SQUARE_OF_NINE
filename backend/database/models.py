"""SQLAlchemy Database Schema for Gann Analysis Projects.
"""

from __future__ import annotations
from datetime import datetime
import json
from typing import Optional, Dict, Any
from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class ProjectModel(Base):
    """Database model for saving complete user analysis projects."""
    __tablename__ = "gann_projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(String(500), nullable=True)
    symbol = Column(String(50), nullable=False, default="SP500_2007")
    timeframe = Column(String(20), nullable=False, default="1D")
    config_json = Column(Text, nullable=False, default="{}")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self) -> Dict[str, Any]:
        try:
            cfg = json.loads(self.config_json)
        except Exception:
            cfg = {}
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "symbol": self.symbol,
            "timeframe": self.timeframe,
            "config": cfg,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
