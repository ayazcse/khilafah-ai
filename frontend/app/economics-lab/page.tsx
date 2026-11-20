"use client";

import { useEffect, useState } from "react";
import { api, ApiError, ZakatResponse } from "@/lib/api";
import { ErrorBanner } from "@/components/StateViews";

export default function EconomicsLabPage() {
  const [cash, setCash] = useState("");
  const [goldGrams, setGoldGrams] = useState("");
  const [silverGrams, setSilverGrams] = useState("");
  const [tradeGoods, setTradeGoods] = useState("");
  const [liabilities, setLiabilities] = useState("");
  const [nisabStandard, setNisabStandard] = useState<"gold" | "silver">("silver");
  const [goldPrice, setGoldPrice] = useState("1");
  const [silverPrice, setSilverPrice] = useState("1");

  const [result, setResult] = useState<ZakatResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [calculating, setCalculating] = useState(false);

  async function handleCalculate(e: React.FormEvent) {
    e.preventDefault();
    setCalculating(true);
    setError(null);
    try {
      const res = await api.post<ZakatResponse>("/economics/zakat", {
        cash: parseFloat(cash) || 0,
        gold_grams: parseFloat(goldGrams) || 0,
        silver_grams: parseFloat(silverGrams) || 0,
        trade_goods_value: parseFloat(tradeGoods) || 0,
        liabilities: parseFloat(liabilities) || 0,
        nisab_standard: nisabStandard,
        gold_price_per_gram: parseFloat(goldPrice) || 1,
        silver_price_per_gram: parseFloat(silverPrice) || 1,
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof ApiError ? String(err.detail) : "Calculation failed.");
    } finally {
      setCalculating(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">
      <div>
        <h1 className="text-2xl font-serif font-semibold text-white mb-1">Islamic Economics Lab</h1>
        <p className="text-white/50 text-sm">
          Educational tools for zakat calculation, waqf research, and illustrative public-finance simulation.
        </p>
      </div>

      <section className="card">
        <h2 className="text-gold font-medium mb-4">Zakat Calculator</h2>
        <form onSubmit={handleCalculate} className="grid sm:grid-cols-2 gap-4">
          <Field label="Cash" value={cash} onChange={setCash} />
          <Field label="Gold (grams)" value={goldGrams} onChange={setGoldGrams} />
          <Field label="Silver (grams)" value={silverGrams} onChange={setSilverGrams} />
          <Field label="Trade goods value" value={tradeGoods} onChange={setTradeGoods} />
          <Field label="Liabilities (debts)" value={liabilities} onChange={setLiabilities} />
          <div>
            <label className="label-text">Nisab standard</label>
            <select
              value={nisabStandard}
              onChange={(e) => setNisabStandard(e.target.value as "gold" | "silver")}
              className="input-field"
            >
              <option value="silver">Silver (595g reference)</option>
              <option value="gold">Gold (85g reference)</option>
            </select>
          </div>
          <Field label="Gold price per gram" value={goldPrice} onChange={setGoldPrice} />
          <Field label="Silver price per gram" value={silverPrice} onChange={setSilverPrice} />
          <div className="sm:col-span-2">
            <button type="submit" disabled={calculating} className="btn-primary w-full">
              {calculating ? "Calculating..." : "Calculate Zakat"}
            </button>
          </div>
        </form>

        {error && <div className="mt-4"><ErrorBanner message={error} /></div>}

        {result && (
          <div className="mt-6 bg-charcoal rounded-lg p-4 space-y-2">
            <p className="text-white">
              Zakatable wealth: <span className="font-medium">{result.zakatable_wealth}</span>
            </p>
            <p className="text-white">
              Nisab threshold: <span className="font-medium">{result.nisab_threshold}</span> — meets nisab:{" "}
              <span className={result.meets_nisab ? "text-emerald-400" : "text-amber-400"}>
                {result.meets_nisab ? "Yes" : "No"}
              </span>
            </p>
            <p className="text-xl text-gold font-semibold">Zakat due: {result.zakat_due}</p>
            <div className="text-white/40 text-xs pt-2 border-t border-white/10">
              <p className="font-medium mb-1">Assumptions:</p>
              <ul className="list-disc list-inside space-y-0.5">
                {result.assumptions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
              <p className="mt-2 italic">{result.disclaimer}</p>
            </div>
          </div>
        )}
      </section>

      <WaqfInfo />
      <BudgetSimulator />
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="label-text">{label}</label>
      <input
        type="number"
        step="any"
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field"
        placeholder="0"
      />
    </div>
  );
}

function WaqfInfo() {
  const [info, setInfo] = useState<{ title: string; summary: string; description: string; disclaimer: string } | null>(null);
  useEffect(() => {
    api.get<typeof info>("/economics/waqf-info").then(setInfo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (!info) return null;
  return (
    <section className="card">
      <h2 className="text-gold font-medium mb-2">{info.title}</h2>
      <p className="text-white/70 text-sm mb-3">{info.description}</p>
      <p className="text-white/40 text-xs italic">{info.disclaimer}</p>
    </section>
  );
}

function BudgetSimulator() {
  const [kharaj, setKharaj] = useState("600");
  const [zakatRevenue, setZakatRevenue] = useState("400");
  const [stipends, setStipends] = useState("500");
  const [infrastructure, setInfrastructure] = useState("300");
  const [result, setResult] = useState<{
    total_revenue: number;
    total_allocated: number;
    unallocated: number;
    disclaimer: string;
  } | null>(null);

  async function handleSimulate(e: React.FormEvent) {
    e.preventDefault();
    const res = await api.post<typeof result>("/economics/budget-simulation", {
      revenue_sources: { kharaj: parseFloat(kharaj) || 0, zakat: parseFloat(zakatRevenue) || 0 },
      allocations: { stipends: parseFloat(stipends) || 0, infrastructure: parseFloat(infrastructure) || 0 },
    });
    setResult(res);
  }

  return (
    <section className="card">
      <h2 className="text-gold font-medium mb-4">Budget Simulation (Illustrative)</h2>
      <form onSubmit={handleSimulate} className="grid sm:grid-cols-2 gap-4">
        <Field label="Revenue: Kharaj (land tax)" value={kharaj} onChange={setKharaj} />
        <Field label="Revenue: Zakat" value={zakatRevenue} onChange={setZakatRevenue} />
        <Field label="Allocation: Stipends" value={stipends} onChange={setStipends} />
        <Field label="Allocation: Infrastructure" value={infrastructure} onChange={setInfrastructure} />
        <div className="sm:col-span-2">
          <button type="submit" className="btn-primary w-full">Simulate</button>
        </div>
      </form>
      {result && (
        <div className="mt-4 bg-charcoal rounded-lg p-4">
          <p className="text-white">Total revenue: {result.total_revenue}</p>
          <p className="text-white">Total allocated: {result.total_allocated}</p>
          <p className="text-white">Unallocated: {result.unallocated}</p>
          <p className="text-white/40 text-xs italic mt-2">{result.disclaimer}</p>
        </div>
      )}
    </section>
  );
}
