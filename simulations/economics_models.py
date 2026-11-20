"""Pure-calculation educational tools for the Islamic Economics Lab.

No AI calls here — these are deterministic, auditable calculations with
explicit, labeled assumptions. Zakat rulings differ between schools of fiqh
and individual scholars; this module implements one common, widely-cited
convention (2.5% on qualifying wealth above a nisab threshold) and is
explicit that it is not a religious ruling (fatwa).
"""
from __future__ import annotations

ZAKAT_RATE = 0.025

# Classical reference figures widely cited across schools of fiqh for the
# nisab (minimum threshold) of zakat on gold and silver.
NISAB_GOLD_GRAMS = 85.0
NISAB_SILVER_GRAMS = 595.0

ZAKAT_DISCLAIMER = (
    "This is an educational estimate, not a religious ruling (fatwa). Zakat "
    "calculation details (what counts as zakatable wealth, which nisab "
    "standard to use, how liabilities are treated) differ between schools of "
    "fiqh and individual scholars. Consult a qualified scholar for a ruling "
    "that applies to your specific situation."
)


def calculate_zakat(
    cash: float,
    gold_grams: float,
    silver_grams: float,
    trade_goods_value: float,
    liabilities: float,
    nisab_standard: str = "silver",
    gold_price_per_gram: float = 1.0,
    silver_price_per_gram: float = 1.0,
) -> dict:
    gold_value = gold_grams * gold_price_per_gram
    silver_value = silver_grams * silver_price_per_gram

    gross_wealth = cash + gold_value + silver_value + trade_goods_value
    zakatable_wealth = max(0.0, gross_wealth - liabilities)

    if nisab_standard == "gold":
        nisab_threshold = NISAB_GOLD_GRAMS * gold_price_per_gram
    else:
        nisab_threshold = NISAB_SILVER_GRAMS * silver_price_per_gram

    meets_nisab = zakatable_wealth >= nisab_threshold
    zakat_due = round(zakatable_wealth * ZAKAT_RATE, 2) if meets_nisab else 0.0

    assumptions = [
        f"Nisab standard: {nisab_standard} ({NISAB_GOLD_GRAMS if nisab_standard == 'gold' else NISAB_SILVER_GRAMS}g reference weight).",
        "Zakat rate applied: 2.5% of zakatable wealth, the rate most commonly cited for cash, gold, silver, and trade goods.",
        "Liabilities (debts due within the zakat year) are subtracted from gross wealth before applying the nisab test.",
        "Gold/silver values are computed from the prices you provided; use current market prices for an accurate figure.",
        "This calculation does not account for zakat on livestock, agricultural produce, or business inventory valuation nuances.",
    ]

    return {
        "zakatable_wealth": round(zakatable_wealth, 2),
        "nisab_threshold": round(nisab_threshold, 2),
        "meets_nisab": meets_nisab,
        "zakat_due": zakat_due,
        "rate": ZAKAT_RATE,
        "assumptions": assumptions,
        "disclaimer": ZAKAT_DISCLAIMER,
    }


WAQF_INFO = {
    "title": "Waqf (Islamic Endowment)",
    "summary": "A waqf is an inalienable charitable endowment under Islamic law, historically used to fund mosques, schools, hospitals, and public infrastructure in perpetuity.",
    "description": (
        "A waqf is created when an owner permanently dedicates an asset (often land "
        "or a building) so that its revenue is used for a specified charitable "
        "purpose, administered by a trustee (mutawalli). Historically, waqf "
        "endowments funded a large share of public institutions in the Islamic "
        "world, including mosques, madrasas (schools), hospitals (bimaristans), "
        "caravanserais, and public fountains. Because the underlying asset cannot "
        "be sold or inherited once dedicated, waqf served as a durable mechanism "
        "for long-term civic and religious funding."
    ),
    "evidence_level": "established",
    "sources": [
        "Encyclopaedia of Islam, entry: 'Waqf'",
        "Timur Kuran, 'The Long Divergence: How Islamic Law Held Back the Middle East' (academic discussion of waqf institutions and their economic effects — a contested, debated thesis in itself)",
    ],
    "disclaimer": "Historical scale estimates of waqf activity vary by region and period and are debated among economic historians.",
}


def simulate_budget(revenue_sources: dict[str, float], allocations: dict[str, float]) -> dict:
    total_revenue = sum(revenue_sources.values())
    total_allocated = sum(allocations.values())
    unallocated = round(total_revenue - total_allocated, 2)

    revenue_percentages = {
        k: round((v / total_revenue) * 100, 2) if total_revenue > 0 else 0.0
        for k, v in revenue_sources.items()
    }
    allocation_percentages = {
        k: round((v / total_revenue) * 100, 2) if total_revenue > 0 else 0.0
        for k, v in allocations.items()
    }

    return {
        "total_revenue": round(total_revenue, 2),
        "total_allocated": round(total_allocated, 2),
        "unallocated": unallocated,
        "allocation_percentages": allocation_percentages,
        "revenue_percentages": revenue_percentages,
        "disclaimer": (
            "This is an illustrative public-finance simulation for educational "
            "purposes, modeled loosely on historical treasury categories "
            "(e.g. kharaj, zakat, jizya as revenue; stipends, infrastructure, "
            "military as expenditure). It is not a reconstruction of any "
            "specific historical state's actual budget."
        ),
    }
