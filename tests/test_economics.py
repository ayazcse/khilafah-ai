from __future__ import annotations

from simulations.economics_models import calculate_zakat, simulate_budget


def test_zakat_below_nisab_owes_nothing():
    result = calculate_zakat(
        cash=100,
        gold_grams=0,
        silver_grams=0,
        trade_goods_value=0,
        liabilities=0,
        nisab_standard="silver",
        silver_price_per_gram=1.0,
    )
    assert result["meets_nisab"] is False
    assert result["zakat_due"] == 0.0


def test_zakat_above_nisab_calculates_due():
    result = calculate_zakat(
        cash=1000,
        gold_grams=0,
        silver_grams=0,
        trade_goods_value=0,
        liabilities=0,
        nisab_standard="silver",
        silver_price_per_gram=1.0,
    )
    assert result["meets_nisab"] is True
    assert result["zakat_due"] == round(1000 * 0.025, 2)
    assert result["rate"] == 0.025
    assert "disclaimer" in result and len(result["disclaimer"]) > 0


def test_zakat_liabilities_reduce_wealth():
    result = calculate_zakat(
        cash=1000,
        gold_grams=0,
        silver_grams=0,
        trade_goods_value=0,
        liabilities=500,
        nisab_standard="silver",
        silver_price_per_gram=1.0,
    )
    assert result["zakatable_wealth"] == 500.0


def test_budget_simulation_percentages():
    result = simulate_budget(
        revenue_sources={"kharaj": 600, "zakat": 400},
        allocations={"stipends": 500, "infrastructure": 300},
    )
    assert result["total_revenue"] == 1000
    assert result["total_allocated"] == 800
    assert result["unallocated"] == 200
    assert result["revenue_percentages"]["kharaj"] == 60.0


def test_api_zakat_endpoint(client):
    resp = client.post(
        "/api/economics/zakat",
        json={
            "cash": 2000,
            "gold_grams": 0,
            "silver_grams": 0,
            "trade_goods_value": 0,
            "liabilities": 0,
            "nisab_standard": "silver",
            "gold_price_per_gram": 1,
            "silver_price_per_gram": 1,
        },
    )
    assert resp.status_code == 200
    assert resp.json()["zakat_due"] == 50.0


def test_api_waqf_info_endpoint(client):
    resp = client.get("/api/economics/waqf-info")
    assert resp.status_code == 200
    assert "title" in resp.json()
