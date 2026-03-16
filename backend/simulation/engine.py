import asyncio
import uuid
from dataclasses import dataclass, field
from typing import Dict, List
import numpy as np

from simulation.agents.country import Country
from simulation.modules.all_modules import (
    EconomyModule, ClimateModule, TechnologyModule,
    GeopoliticsModule, PopulationModule
)


@dataclass
class SimulationConfig:
    start_year:              int   = 2025
    end_year:                int   = 2125
    time_step:               float = 0.25
    agi_introduction_year:   int   = 2055
    global_automation_rate:  float = 0.25
    carbon_tax_per_tonne:    float = 0.0
    renewable_energy_target: float = 0.35
    geopolitical_tension:    str   = "medium"
    scenario_name:           str   = "Baseline"
    random_seed:             int   = 42


@dataclass
class SimulationSnapshot:
    year:                   float
    world_gdp:              float
    population:             float
    temp_anomaly:           float
    automation_index:       float
    geopolitical_stability: float
    tech_progress_index:    float
    renewable_share:        float
    unemployment_rate:      float
    gini_coefficient:       float
    co2_ppm:                float
    sea_level_rise_cm:      float
    events:                 List[str] = field(default_factory=list)
    country_data:           Dict      = field(default_factory=dict)


# 18 countries: (name, gdp_T, population_M, tech_index, stability)
COUNTRY_BASELINE = [
    ("USA",          28.0,  340,  0.92, 0.72),
    ("China",        18.5, 1410,  0.85, 0.68),
    ("EU",           18.0,  450,  0.88, 0.75),
    ("India",         3.7, 1440,  0.62, 0.63),
    ("Japan",         4.2,  124,  0.89, 0.80),
    ("UK",            3.1,   67,  0.87, 0.73),
    ("Brazil",        2.1,  215,  0.58, 0.55),
    ("Russia",        2.2,  145,  0.70, 0.45),
    ("Canada",        2.1,   40,  0.86, 0.82),
    ("Australia",     1.7,   27,  0.84, 0.83),
    ("South Korea",   1.7,   52,  0.90, 0.76),
    ("Mexico",        1.4,  130,  0.54, 0.50),
    ("Indonesia",     1.3,  275,  0.50, 0.58),
    ("Nigeria",       0.5,  225,  0.32, 0.38),
    ("South Africa",  0.4,   60,  0.48, 0.45),
    ("Bangladesh",    0.4,  170,  0.38, 0.42),
    ("Ethiopia",      0.15, 125,  0.20, 0.30),
    ("Other",        15.0, 2000,  0.45, 0.52),
]


class SimulationEngine:
    def __init__(self, config: SimulationConfig):
        self.config        = config
        self.simulation_id = str(uuid.uuid4())
        self.rng           = np.random.default_rng(config.random_seed)
        self.economy       = EconomyModule(config, self.rng)
        self.climate       = ClimateModule(config, self.rng)
        self.technology    = TechnologyModule(config, self.rng)
        self.geopolitics   = GeopoliticsModule(config, self.rng)
        self.population    = PopulationModule(config, self.rng)
        self.countries     = [
            Country(n, g, p, t, s, config, self.rng)
            for n, g, p, t, s in COUNTRY_BASELINE
        ]
        self.snapshots:   List[SimulationSnapshot] = []
        self.current_year = float(config.start_year)
        self.is_running   = False

    def run(self) -> List[SimulationSnapshot]:
        """Synchronous run — used by background tasks."""
        self.is_running = True
        year = float(self.config.start_year)
        while year <= self.config.end_year and self.is_running:
            snap = self._tick(year)
            self.snapshots.append(snap)
            year = round(year + self.config.time_step, 4)
        self.is_running = False
        return self.snapshots

    async def run_async(self):
        """Async generator — used by WebSocket streaming."""
        self.is_running = True
        year = float(self.config.start_year)
        while year <= self.config.end_year and self.is_running:
            snap = self._tick(year)
            self.snapshots.append(snap)
            yield snap
            await asyncio.sleep(0)
            year = round(year + self.config.time_step, 4)
        self.is_running = False

    def _tick(self, year: float) -> SimulationSnapshot:
        self.current_year = year
        tech    = self.technology.step(year, self.countries)
        econ    = self.economy.step(year, self.countries, tech)
        climate = self.climate.step(year, econ)
        pop     = self.population.step(year, self.countries, econ, climate)
        geo     = self.geopolitics.step(year, self.countries, econ, tech)
        for c in self.countries:
            c.update(year, econ, climate, tech, geo, pop)
        return SimulationSnapshot(
            year=year,
            world_gdp=round(sum(c.gdp for c in self.countries), 3),
            population=round(sum(c.population for c in self.countries), 1),
            temp_anomaly=climate["temp_anomaly"],
            automation_index=tech["automation_index"],
            geopolitical_stability=geo["stability"],
            tech_progress_index=tech["progress_index"],
            renewable_share=econ["renewable_share"],
            unemployment_rate=econ["unemployment"],
            gini_coefficient=econ["gini"],
            co2_ppm=climate["co2_ppm"],
            sea_level_rise_cm=climate["sea_level_cm"],
            events=self._events(year, econ, climate, tech, geo),
            country_data={c.name: c.to_dict() for c in self.countries},
        )

    def _events(self, year, econ, climate, tech, geo) -> List[str]:
        r, ev = self.rng, []
        if climate["temp_anomaly"] > 2.5 and r.random() < 0.12:
            ev.append(f"{int(year)}: Extreme weather displaces {r.integers(2,30)}M people")
        if tech["progress_index"] > 0.85 and r.random() < 0.08:
            ev.append(f"{int(year)}: AI breakthrough in "
                      f"{r.choice(['healthcare','energy','manufacturing'])}")
        if year >= self.config.agi_introduction_year and r.random() < 0.25:
            ev.append(f"{int(year)}: AGI accelerates automation across "
                      f"{r.integers(3,12)} sectors")
        if econ["unemployment"] > 0.22 and r.random() < 0.10:
            ev.append(f"{int(year)}: Social unrest over unemployment in major economy")
        if geo["tension"] > 0.7 and r.random() < 0.07:
            ev.append(f"{int(year)}: Regional conflict disrupts global supply chains")
        return ev

    def stop(self):
        self.is_running = False

    def progress_pct(self) -> float:
        span = self.config.end_year - self.config.start_year
        return round((self.current_year - self.config.start_year) / span * 100, 2)

    @classmethod
    def from_live_data(cls, live: dict, config: "SimulationConfig") -> "SimulationEngine":
        """
        Create an engine seeded with real-world data instead of hardcoded baselines.
        Call this instead of SimulationEngine(config) when live data is available.
        """
        engine = cls(config)
        countries_live = live.get("countries", {})
        world_live     = live.get("world", {})

        # Patch each country agent with real values
        for country in engine.countries:
            if country.name in countries_live:
                real = countries_live[country.name]
                country.gdp             = real.get("gdp",          country.gdp)
                country.population      = real.get("population",   country.population)
                country.renewable_share = real.get("renewable", country.renewable_share * 100) / 100
                country.unemployment    = real.get("unemployment", country.unemployment)

        # Patch climate module with real CO₂ and temp
        if world_live.get("co2_ppm"):
            engine.climate.co2_ppm      = world_live["co2_ppm"]
        if world_live.get("temp_anomaly"):
            engine.climate.temp_anomaly = world_live["temp_anomaly"]

        print(f"[Engine] Seeded with live data — "
              f"CO₂: {engine.climate.co2_ppm} ppm, "
              f"Temp: +{engine.climate.temp_anomaly}°C")
        return engine