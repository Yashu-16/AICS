import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from simulation.engine import SimulationEngine, SimulationConfig


def make_engine(years=5, **kwargs):
    config = SimulationConfig(start_year=2025, end_year=2025+years, **kwargs)
    return SimulationEngine(config)


def test_engine_initializes():
    e = make_engine()
    assert e.simulation_id is not None
    assert len(e.countries) == 18

def test_short_run():
    snaps = make_engine(years=2).run()
    assert len(snaps) > 0
    assert snaps[0].year == 2025.0

def test_gdp_grows():
    snaps = make_engine(years=10).run()
    assert snaps[-1].world_gdp > snaps[0].world_gdp

def test_temp_rises():
    snaps = make_engine(years=20).run()
    assert snaps[-1].temp_anomaly > snaps[0].temp_anomaly

def test_carbon_tax_helps():
    b = make_engine(years=10, carbon_tax_per_tonne=0,   random_seed=42).run()
    t = make_engine(years=10, carbon_tax_per_tonne=200, random_seed=42).run()
    assert t[-1].temp_anomaly <= b[-1].temp_anomaly

def test_agi_boosts_automation():
    early = make_engine(years=20, agi_introduction_year=2026, random_seed=1).run()
    late  = make_engine(years=20, agi_introduction_year=2060, random_seed=1).run()
    assert early[-1].automation_index > late[-1].automation_index

def test_deterministic():
    s1 = make_engine(years=5, random_seed=99).run()
    s2 = make_engine(years=5, random_seed=99).run()
    assert s1[-1].world_gdp == s2[-1].world_gdp