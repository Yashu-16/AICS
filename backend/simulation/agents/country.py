from dataclasses import dataclass, field
from typing import Dict
import numpy as np


@dataclass
class Country:
    name:       str
    gdp:        float
    population: float
    tech_index: float
    stability:  float
    config:     object = field(repr=False)
    rng:        object = field(repr=False)

    renewable_share:  float = 0.15
    carbon_emissions: float = 0.0
    unemployment:     float = 0.05
    education_index:  float = 0.6

    def __post_init__(self):
        self.carbon_emissions = self.gdp * 0.4
        self.education_index  = min(1.0, self.tech_index * 0.8 + 0.2)

    def update(self, year, econ, climate, tech, geo, pop):
        dt = self.config.time_step

        # GDP growth
        growth = (0.025
                  + (tech["progress_index"] - 0.5) * 0.03
                  - max(0, (climate["temp_anomaly"] - 1.5)) * 0.008)
        self.gdp = max(0, self.gdp * (1 + growth * dt))

        # Population
        gr = 0.008 - self.education_index * 0.005
        self.population *= (1 + gr * dt)

        # Unemployment rises with automation
        auto_delta = tech["automation_index"] - 0.3
        if auto_delta > 0:
            self.unemployment = min(0.45, self.unemployment + auto_delta * 0.02 * dt)
        self.unemployment = max(0.02, self.unemployment - 0.005 * dt)

        # Renewable energy adoption
        push = 0.02 * dt * (2.0 if self.config.carbon_tax_per_tonne > 50 else 1.0)
        self.renewable_share = min(1.0, self.renewable_share + push)
        self.carbon_emissions = self.gdp * 0.4 * (1 - self.renewable_share * 0.7)

        # Political stability
        drag = max(0, econ["gini"] - 0.5) * 0.02 * dt
        self.stability = max(0.05, min(1.0,
            self.stability - drag + self.rng.normal(0, 0.005)))

        # Tech diffusion from global leaders
        self.tech_index = min(1.0,
            self.tech_index + (tech["progress_index"] - self.tech_index) * 0.03 * dt)

    def to_dict(self) -> Dict:
        return {
            "name":             self.name,
            "gdp":              round(self.gdp, 3),
            "population":       round(self.population, 1),
            "tech_index":       round(self.tech_index, 3),
            "stability":        round(self.stability, 3),
            "unemployment":     round(self.unemployment, 3),
            "renewable_share":  round(self.renewable_share, 3),
            "carbon_emissions": round(self.carbon_emissions, 3),
        }