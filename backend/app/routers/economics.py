"""Islamic Economics Lab — zakat calculator, waqf info, budget simulation."""
from __future__ import annotations

from fastapi import APIRouter

from backend.app.schemas import (
    BudgetSimulationRequest,
    BudgetSimulationResponse,
    ZakatRequest,
    ZakatResponse,
)
from simulations.economics_models import WAQF_INFO, calculate_zakat, simulate_budget

router = APIRouter(prefix="/economics", tags=["economics"])


@router.post("/zakat", response_model=ZakatResponse)
def zakat(payload: ZakatRequest) -> dict:
    return calculate_zakat(
        cash=payload.cash,
        gold_grams=payload.gold_grams,
        silver_grams=payload.silver_grams,
        trade_goods_value=payload.trade_goods_value,
        liabilities=payload.liabilities,
        nisab_standard=payload.nisab_standard,
        gold_price_per_gram=payload.gold_price_per_gram,
        silver_price_per_gram=payload.silver_price_per_gram,
    )


@router.get("/waqf-info")
def waqf_info() -> dict:
    return WAQF_INFO


@router.post("/budget-simulation", response_model=BudgetSimulationResponse)
def budget_simulation(payload: BudgetSimulationRequest) -> dict:
    return simulate_budget(payload.revenue_sources, payload.allocations)
