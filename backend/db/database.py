from sqlalchemy import create_engine, Column, String, Float, Integer, JSON, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://aics:aics_pass@localhost:5432/aics"
)

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class SimulationRecord(Base):
    __tablename__ = "simulations"
    id            = Column(String, primary_key=True)
    scenario_name = Column(String, nullable=False)
    config        = Column(JSON)
    status        = Column(String, default="pending")
    created_at    = Column(DateTime, default=datetime.utcnow)
    completed_at  = Column(DateTime, nullable=True)


class SnapshotRecord(Base):
    __tablename__ = "snapshots"
    id                     = Column(Integer, primary_key=True, autoincrement=True)
    simulation_id          = Column(String, nullable=False, index=True)
    year                   = Column(Float)
    world_gdp              = Column(Float)
    population             = Column(Float)
    temp_anomaly           = Column(Float)
    automation_index       = Column(Float)
    geopolitical_stability = Column(Float)
    data                   = Column(JSON)
    created_at             = Column(DateTime, default=datetime.utcnow)


class ScenarioRecord(Base):
    __tablename__ = "scenarios"
    id          = Column(String, primary_key=True)
    name        = Column(String, nullable=False)
    description = Column(Text)
    params      = Column(JSON)
    tags        = Column(JSON, default=list)
    created_at  = Column(DateTime, default=datetime.utcnow)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()