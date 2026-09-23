"""Deterministic city model shared by HTTP routes and the AI integration."""

from app.domain.engine import SimulationEngine, ValidationError

__all__ = ["SimulationEngine", "ValidationError"]
