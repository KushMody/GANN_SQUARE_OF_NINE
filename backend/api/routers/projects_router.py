"""Analysis Projects Persistence API Router.
"""

import json
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from ...database.db import get_db
from ...database.models import ProjectModel

router = APIRouter(prefix="/api/projects", tags=["Projects"])


class ProjectCreateRequest(BaseModel):
    name: str = Field(..., max_length=200)
    description: Optional[str] = Field(None, max_length=500)
    symbol: str = Field("SP500_2007")
    timeframe: str = Field("1D")
    config: Dict[str, Any] = Field(default_factory=dict)


class ProjectResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    symbol: str
    timeframe: str
    config: Dict[str, Any]
    created_at: Optional[str]
    updated_at: Optional[str]


@router.get("", response_model=List[ProjectResponse])
def list_projects(db: Session = Depends(get_db)):
    """List all saved Gann analysis projects."""
    projects = db.query(ProjectModel).order_by(ProjectModel.updated_at.desc()).all()
    return [p.to_dict() for p in projects]


@router.post("", response_model=ProjectResponse)
def create_project(req: ProjectCreateRequest, db: Session = Depends(get_db)):
    """Save a new Gann analysis project."""
    new_proj = ProjectModel(
        name=req.name,
        description=req.description,
        symbol=req.symbol,
        timeframe=req.timeframe,
        config_json=json.dumps(req.config)
    )
    db.add(new_proj)
    db.commit()
    db.refresh(new_proj)
    return new_proj.to_dict()


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: int, db: Session = Depends(get_db)):
    """Retrieve a specific saved project."""
    proj = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    return proj.to_dict()


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(project_id: int, req: ProjectCreateRequest, db: Session = Depends(get_db)):
    """Update an existing saved project."""
    proj = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    proj.name = req.name
    proj.description = req.description
    proj.symbol = req.symbol
    proj.timeframe = req.timeframe
    proj.config_json = json.dumps(req.config)
    db.commit()
    db.refresh(proj)
    return proj.to_dict()


@router.delete("/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db)):
    """Delete a saved project."""
    proj = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(proj)
    db.commit()
    return {"message": "Project deleted successfully", "id": project_id}
