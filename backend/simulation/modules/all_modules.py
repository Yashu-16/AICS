import numpy as np
from typing import List, Dict


class EconomyModule:
    def __init__(self, config, rng):
        self.config = config
        self.rng    = rng
        self._hist  = []
        self.gini   = 0.42

    def step(self, year: float, countries: List, tech: Dict) -> Dict:
        dt        = self.config.time_step
        world_gdp = sum(c.gdp for c in countries)
        self._hist.append(world_gdp)
        auto           = tech["automation_index"]
        unemployment   = 0.05 + max(0, auto - 0.3) * 0.35
        gini_drift     = 0.003 if auto > 0.5 else -0.001
        self.gini      = max(0.25, min(0.75,
            self.gini + gini_drift * dt + self.rng.normal(0, 0.002)))
        renewable_share = (sum(c.renewable_share * c.gdp for c in countries) / world_gdp
                           if world_gdp else 0.3)
        gdp_growth      = (world_gdp / self._hist[-2] - 1) if len(self._hist) > 1 else 0.025
        return {
            "world_gdp":       world_gdp,
            "unemployment":    round(unemployment, 4),
            "gini":            round(self.gini, 4),
            "renewable_share": round(renewable_share, 4),
            "gdp_growth":      round(gdp_growth, 4),
        }


class ClimateModule:
    def __init__(self, config, rng):
        self.config       = config
        self.rng          = rng
        self.co2_ppm      = 422.0
        self.temp_anomaly = 1.2
        self.sea_level_cm = 22.0

    def step(self, year: float, econ: Dict) -> Dict:
        dt       = self.config.time_step
        fossil   = max(0, 1 - econ["renewable_share"])
        emissions = (econ["world_gdp"] * 0.38 * fossil
                     * (1 - min(0.5, self.config.carbon_tax_per_tonne * 0.001)))
        self.co2_ppm     += emissions * 0.47 * dt * 0.5
        eq_temp           = 3.0 * np.log2(self.co2_ppm / 280.0)
        self.temp_anomaly += ((eq_temp - self.temp_anomaly) * 0.02 * dt
                              + self.rng.normal(0, 0.01 * dt))
        self.sea_level_cm += (0.4 + (self.temp_anomaly - 1.0) * 0.5) * dt
        risk = min(1.0, max(0, (self.temp_anomaly - 1.0) / 3.5))
        return {
            "co2_ppm":              round(self.co2_ppm, 1),
            "temp_anomaly":         round(self.temp_anomaly, 3),
            "sea_level_cm":         round(self.sea_level_cm, 2),
            "annual_emissions_gt":  round(emissions, 2),
            "climate_risk":         round(risk, 3),
            "migration_pressure_M": round(max(0, (self.temp_anomaly - 1.5) * 20 * dt), 1),
        }


class TechnologyModule:
    def __init__(self, config, rng):
        self.config           = config
        self.rng              = rng
        self.progress_index   = 0.55
        self.automation_index = 0.18
        self.agi_unlocked     = False

    def step(self, year: float, countries: List) -> Dict:
        dt     = self.config.time_step
        growth = 0.012 * dt * (2.0 if self.progress_index > 0.75 else 1.0)
        self.progress_index = min(1.0,
            self.progress_index + growth + self.rng.normal(0, 0.003 * dt))
        auto_target           = self.config.global_automation_rate + (self.progress_index - 0.5) * 0.6
        self.automation_index += (auto_target - self.automation_index) * 0.05 * dt
        agi_active = year >= self.config.agi_introduction_year
        if agi_active and not self.agi_unlocked:
            self.agi_unlocked      = True
            self.progress_index    = min(1.0, self.progress_index   + 0.15)
            self.automation_index  = min(1.0, self.automation_index + 0.10)
        return {
            "progress_index":   round(self.progress_index, 4),
            "automation_index": round(min(1.0, self.automation_index), 4),
            "agi_active":       agi_active,
        }


class GeopoliticsModule:
    def __init__(self, config, rng):
        self.config   = config
        self.rng      = rng
        tmap          = {"low": 0.2, "medium": 0.45, "high": 0.65, "critical": 0.85}
        self.tension  = tmap.get(config.geopolitical_tension, 0.45)
        self.stability= 1 - self.tension

    def step(self, year: float, countries: List, econ: Dict, tech: Dict) -> Dict:
        dt     = self.config.time_step
        driver = (max(0, econ["gini"] - 0.5) * 0.05
                  + max(0, tech["progress_index"] - 0.8) * 0.04)
        self.tension   = max(0, min(1,
            self.tension + (driver + self.rng.normal(0, 0.008)) * dt))
        self.stability = 1 - self.tension
        for c in countries:
            c.stability = max(0.05, min(1.0,
                c.stability + (self.stability - c.stability) * 0.01 * dt
                + self.rng.normal(0, 0.003)))
        return {
            "tension":      round(self.tension, 4),
            "stability":    round(self.stability, 4),
            "num_unstable": sum(1 for c in countries if c.stability < 0.4),
        }


class PopulationModule:
    def __init__(self, config, rng):
        self.config             = config
        self.rng                = rng
        self.world_population_M = 8100.0
        self.urbanization_rate  = 0.57

    def step(self, year: float, countries: List, econ: Dict, climate: Dict) -> Dict:
        dt    = self.config.time_step
        birth = 0.018 - econ["gini"] * 0.002
        death = 0.008 + climate["climate_risk"] * 0.003
        self.world_population_M  *= (1 + (birth - death) * dt)
        self.urbanization_rate    = min(0.90, self.urbanization_rate + 0.003 * dt)
        return {
            "world_population_M": round(self.world_population_M, 1),
            "urbanization":       round(self.urbanization_rate, 3),
            "climate_migrants_M": climate["migration_pressure_M"],
        }