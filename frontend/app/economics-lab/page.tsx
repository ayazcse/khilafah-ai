"use client";

import { useEffect, useState } from "react";
import { api, ApiError, ZakatResponse } from "@/lib/api";
import { ErrorBanner } from "@/components/StateViews";

const money = (value: number) => new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(value);

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
  const [soundEnabled, setSoundEnabled] = useState(false);

  const [kharaj, setKharaj] = useState("600");
  const [zakatRevenue, setZakatRevenue] = useState("400");
  const [stipends, setStipends] = useState("500");
  const [infrastructure, setInfrastructure] = useState("300");
  const [simulation, setSimulation] = useState<{ total_revenue: number; total_allocated: number; unallocated: number; disclaimer: string } | null>(null);
  const [simulating, setSimulating] = useState(false);

  function playCoinChime() {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const context = new AudioContextClass();
      [880, 1174].forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = "sine";
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0.0001, context.currentTime + index * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.055, context.currentTime + index * 0.09 + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + index * 0.09 + 0.22);
        oscillator.connect(gain); gain.connect(context.destination);
        oscillator.start(context.currentTime + index * 0.09);
        oscillator.stop(context.currentTime + index * 0.09 + 0.24);
      });
      window.setTimeout(() => void context.close(), 600);
    } catch { /* Audio is an optional enhancement; calculations never depend on it. */ }
  }

  async function handleCalculate(e: React.FormEvent) {
    e.preventDefault(); setCalculating(true); setError(null);
    try {
      const res = await api.post<ZakatResponse>("/economics/zakat", {
        cash: parseFloat(cash) || 0, gold_grams: parseFloat(goldGrams) || 0,
        silver_grams: parseFloat(silverGrams) || 0, trade_goods_value: parseFloat(tradeGoods) || 0,
        liabilities: parseFloat(liabilities) || 0, nisab_standard: nisabStandard,
        gold_price_per_gram: parseFloat(goldPrice) || 1, silver_price_per_gram: parseFloat(silverPrice) || 1,
      });
      setResult(res); playCoinChime();
    } catch (err) { setError(err instanceof ApiError ? String(err.detail) : "Calculation failed. Please try again."); }
    finally { setCalculating(false); }
  }

  async function handleSimulate(e: React.FormEvent) {
    e.preventDefault(); setSimulating(true); setError(null);
    try {
      const res = await api.post<typeof simulation>("/economics/budget-simulation", {
        revenue_sources: { kharaj: parseFloat(kharaj) || 0, zakat: parseFloat(zakatRevenue) || 0 },
        allocations: { stipends: parseFloat(stipends) || 0, infrastructure: parseFloat(infrastructure) || 0 },
      });
      setSimulation(res); playCoinChime();
    } catch (err) { setError(err instanceof ApiError ? String(err.detail) : "Simulation failed. Please try again."); }
    finally { setSimulating(false); }
  }

  const revenue = simulation?.total_revenue ?? ((parseFloat(kharaj) || 0) + (parseFloat(zakatRevenue) || 0));
  const allocated = simulation?.total_allocated ?? ((parseFloat(stipends) || 0) + (parseFloat(infrastructure) || 0));
  const safeRevenue = Math.max(0, revenue);
  const revenueWidth = safeRevenue > 0 ? Math.min(100, (Math.max(0, parseFloat(kharaj) || 0) / safeRevenue) * 100) : 0;
  const allocationWidth = allocated > 0 ? Math.min(100, ((parseFloat(stipends) || 0) / allocated) * 100) : 0;

  return (
    <main className="economics-page">
      <div className="economics-shell">
        <header className="economics-hero">
          <div className="economics-hero-art" aria-hidden="true"><span className="coin coin-one">◉</span><span className="coin coin-two">◉</span><span className="coin coin-three">◉</span><span className="coin coin-four">◉</span><div className="coin-orbit" /></div>
          <div className="economics-hero-content">
            <div className="lab-kicker"><span className="lab-kicker-dot" /> KHILAFAH AI · RESEARCH DOMAIN 02</div>
            <h1>Islamic <span>Economics</span> Lab</h1>
            <p>Explore zakat principles, waqf institutions and historical public-finance ideas through interactive, clearly labelled educational tools.</p>
            <div className="economics-hero-tags"><span>01 · Zakat calculator</span><span>02 · Public finance</span><span>03 · Waqf research</span></div>
          </div>
        </header>

        <div className="economics-section-heading"><div><span className="lab-kicker">INTERACTIVE RESEARCH TOOLS</span><h2>Wealth, responsibility & public good</h2><p>Enter your own values to explore the calculations. Nothing here replaces qualified scholarly or financial advice.</p></div><button className={`sound-toggle ${soundEnabled ? "is-on" : ""}`} onClick={() => setSoundEnabled((v) => !v)} aria-pressed={soundEnabled}><span>{soundEnabled ? "♫" : "♪"}</span> Sound {soundEnabled ? "On" : "Off"}</button></div>
        {error && <div className="mb-5"><ErrorBanner message={error} /></div>}


        <section className="wealth-research-panel">
          <div className="lab-kicker">WEALTH, INHERITANCE & SOCIAL RESPONSIBILITY</div><h2>Build an economy where prosperity is broadly shared</h2>
          <p>These guides explain core concepts, practical policy ideas and historical context. They are educational material, not personalised fatwas, legal advice or investment advice.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
            <article className="rounded-2xl border border-emerald-900/20 bg-slate-950/50 p-5"><span className="text-emerald-300 text-sm font-semibold">01 · DISTRIBUTION OF WEALTH</span><h3 className="text-xl font-semibold mt-2">Keep wealth moving through society</h3><p className="mt-3 text-slate-300">Islamic economic thought discusses zakat as an obligation for qualifying wealth, alongside voluntary sadaqah, charitable giving, waqf endowments, fair trade and responsible public finance. The aim is not to make everyone’s income identical; it is to reduce hardship, meet needs and prevent unjust exploitation and extreme concentration.</p><h4 className="font-semibold mt-4">Practical policy ideas</h4><ul className="list-disc pl-5 mt-2 space-y-1 text-slate-300"><li>Make zakat administration transparent, with clear eligibility and audited distribution.</li><li>Fund targeted support for people in poverty, debt distress and other eligible categories.</li><li>Build sustainable waqf for schools, clinics, water, research and community services.</li><li>Protect workers, enforce honest contracts and prevent fraud, monopoly abuse and corruption.</li><li>Use public budgets for essential services and publish who benefits from spending.</li></ul><p className="mt-3 text-sm text-slate-400">Qur’an 59:7 is often discussed in relation to wealth not circulating only among the rich. Zakat categories are set out in 9:60; legal details and eligible assets require qualified guidance.</p></article>
            <article className="rounded-2xl border border-emerald-900/20 bg-slate-950/50 p-5"><span className="text-emerald-300 text-sm font-semibold">02 · INHERITANCE & SUCCESSION</span><h3 className="text-xl font-semibold mt-2">Distribute an estate fairly and lawfully</h3><p className="mt-3 text-slate-300">Fara’id refers to the detailed Islamic inheritance framework. The Qur’an specifies shares for several classes of heirs, including women and men. The actual distribution depends on which relatives survive, the estate’s net value and applicable jurisprudence and law.</p><h4 className="font-semibold mt-4">A careful process</h4><ol className="list-decimal pl-5 mt-2 space-y-1 text-slate-300"><li>Identify and document all assets, ownership and legitimate liabilities.</li><li>Settle funeral expenses and debts from the estate according to applicable rules.</li><li>Review any valid bequest (wasiyyah); commonly it is limited to one-third and is subject to rules concerning heirs.</li><li>Identify all eligible heirs at the date of death before calculating shares.</li><li>Calculate shares using a qualified fara’id specialist and applicable local law; document and transfer each share transparently.</li></ol><p className="mt-3 text-sm text-slate-400">Do not use a generic online example to divide a real estate. A missing heir, debt, joint ownership, bequest or school-specific issue can change the calculation. Never exclude a rightful heir or pressure someone to surrender a share.</p></article>
            <article className="rounded-2xl border border-emerald-900/20 bg-slate-950/50 p-5"><span className="text-emerald-300 text-sm font-semibold">03 · PROSPERITY & PUBLIC GOOD</span><h3 className="text-xl font-semibold mt-2">Invest in people and productive institutions</h3><p className="mt-3 text-slate-300">Long-term prosperity depends on knowledge, health, infrastructure, trust and productive opportunity. Historical waqf institutions in many Muslim societies supported services such as education, water facilities, hospitals and other public benefits, though their reach and performance varied.</p><h4 className="font-semibold mt-4">A balanced development plan</h4><ul className="list-disc pl-5 mt-2 space-y-1 text-slate-300"><li>Prioritise quality education, scientific research, vocational skills and libraries.</li><li>Expand primary healthcare, clean water, sanitation and safe public spaces.</li><li>Support small businesses, fair access to finance and responsible entrepreneurship.</li><li>Maintain roads, energy and digital infrastructure with transparent procurement.</li><li>Measure outcomes: poverty reduction, learning, health, jobs and regional inclusion.</li></ul></article>
          </div>
          <div className="rounded-2xl border border-amber-700/30 bg-amber-950/20 p-5 mt-5"><h3 className="font-semibold text-amber-200">How the pieces work together</h3><p className="text-slate-300 mt-2">Zakat and targeted assistance address immediate eligible needs; inheritance distributes private wealth across rightful heirs; waqf can support long-term services; ethical markets and accountable public finance support livelihoods and shared infrastructure. These tools have different rules and should not be treated as interchangeable.</p></div>
        </section>

        <section className="economics-feature-grid">
          <article className="economics-feature-card"><span className="economics-feature-icon">✧</span><strong>2.5%</strong><h3>Common zakat rate</h3><p>Often applied to qualifying zakatable wealth after relevant conditions are met. Individual cases can differ.</p></article>
          <article className="economics-feature-card"><span className="economics-feature-icon">◈</span><strong>85g</strong><h3>Gold nisab reference</h3><p>A commonly used gold-weight reference. The selected standard and valuation method matter.</p></article>
          <article className="economics-feature-card"><span className="economics-feature-icon">◎</span><strong>595g</strong><h3>Silver nisab reference</h3><p>A commonly used silver-weight reference. Consult a trusted scholar for your circumstances.</p></article>
        </section>

        <section className="economics-tool-grid">
          <article className="economics-panel">
            <div className="economics-panel-heading"><div><span className="lab-kicker">PERSONAL WEALTH TOOL</span><h2>Zakat calculator</h2><p>Enter amounts in one consistent currency.</p></div><span className="economics-panel-symbol">ز</span></div>
            <form onSubmit={handleCalculate} className="economics-form-grid">
              <Field label="Cash & bank balance" value={cash} onChange={setCash} />
              <Field label="Gold owned (grams)" value={goldGrams} onChange={setGoldGrams} />
              <Field label="Silver owned (grams)" value={silverGrams} onChange={setSilverGrams} />
              <Field label="Trade inventory value" value={tradeGoods} onChange={setTradeGoods} />
              <Field label="Eligible short-term liabilities" value={liabilities} onChange={setLiabilities} />
              <div><label className="label-text">Nisab reference</label><select value={nisabStandard} onChange={(e) => setNisabStandard(e.target.value as "gold" | "silver")} className="input-field"><option value="silver">Silver · 595g reference</option><option value="gold">Gold · 85g reference</option></select></div>
              <Field label="Gold price / gram" value={goldPrice} onChange={setGoldPrice} />
              <Field label="Silver price / gram" value={silverPrice} onChange={setSilverPrice} />
              <button type="submit" disabled={calculating} className="btn-primary economics-submit">{calculating ? "Calculating…" : "Calculate zakat →"}</button>
            </form>
            {result && <div className="zakat-result"><div className="zakat-result-top"><span>ESTIMATED ZAKAT DUE</span><strong>{money(result.zakat_due)}</strong></div><div className="zakat-result-stats"><div><span>Zakatable wealth</span><b>{money(result.zakatable_wealth)}</b></div><div><span>Nisab threshold</span><b>{money(result.nisab_threshold)}</b></div><div><span>Nisab status</span><b className={result.meets_nisab ? "status-positive" : "status-caution"}>{result.meets_nisab ? "Threshold met" : "Below threshold"}</b></div></div><details className="economics-assumptions"><summary>Calculation assumptions & notes</summary><ul>{result.assumptions.map((a, i) => <li key={i}>{a}</li>)}</ul><p>{result.disclaimer}</p></details></div>}
          </article>

          <WaqfInfo />
        </section>

        <section className="economics-panel budget-panel">
          <div className="economics-panel-heading"><div><span className="lab-kicker">HISTORICAL PUBLIC FINANCE · ILLUSTRATIVE</span><h2>Public budget simulator</h2><p>Model how sample revenue could be distributed across public needs.</p></div><span className="economics-panel-symbol">▥</span></div>
          <form onSubmit={handleSimulate} className="economics-form-grid budget-form">
            <Field label="Kharaj · land-tax revenue" value={kharaj} onChange={setKharaj} />
            <Field label="Zakat · revenue" value={zakatRevenue} onChange={setZakatRevenue} />
            <Field label="Stipends · allocation" value={stipends} onChange={setStipends} />
            <Field label="Infrastructure · allocation" value={infrastructure} onChange={setInfrastructure} />
            <button type="submit" disabled={simulating} className="btn-primary economics-submit">{simulating ? "Running simulation…" : "Run budget simulation →"}</button>
          </form>
          <div className="budget-visual">
            <div className="budget-summary"><div><span>TOTAL REVENUE</span><strong>{money(revenue)}</strong></div><div><span>ALLOCATED</span><strong>{money(allocated)}</strong></div><div><span>UNALLOCATED</span><strong>{money(simulation?.unallocated ?? revenue - allocated)}</strong></div></div>
            <div className="budget-flow-row"><div className="budget-flow-label"><span>Revenue mix</span><b>{money(safeRevenue)}</b></div><div className="budget-track"><span className="budget-bar revenue-bar" style={{ width: `${revenueWidth}%` }} /></div><div className="budget-legend"><span><i className="legend-dot kharaj-dot" /> Kharaj {money(parseFloat(kharaj) || 0)}</span><span><i className="legend-dot zakat-dot" /> Zakat {money(parseFloat(zakatRevenue) || 0)}</span></div></div>
            <div className="budget-flow-row"><div className="budget-flow-label"><span>Allocation mix</span><b>{money(allocated)}</b></div><div className="budget-track"><span className="budget-bar allocation-bar" style={{ width: `${allocationWidth}%` }} /></div><div className="budget-legend"><span><i className="legend-dot stipend-dot" /> Stipends {money(parseFloat(stipends) || 0)}</span><span><i className="legend-dot infra-dot" /> Infrastructure {money(parseFloat(infrastructure) || 0)}</span></div></div>
            {simulation && <p className="simulation-disclaimer">{simulation.disclaimer}</p>}
          </div>
        </section>
        <p className="economics-disclaimer">Educational research only. Zakat rulings can vary by school, asset type, ownership period, debt treatment and local scholarly guidance. Verify current precious-metal prices yourself; the calculator does not fetch live market rates. Budget figures are illustrative and are not a reconstruction of any specific historical treasury.</p>
      </div>
    </main>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return <div className="economics-field"><label className="label-text">{label}</label><input type="number" step="any" min="0" value={value} onChange={(e) => onChange(e.target.value)} className="input-field" placeholder="0" /></div>;
}

function WaqfInfo() {
  const [info, setInfo] = useState<{ title: string; summary: string; description: string; disclaimer: string; sources?: string[] } | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    api.get<typeof info>("/economics/waqf-info").then(setInfo).catch(() => setFailed(true));
  }, []);
  if (!info) return <article className="economics-panel waqf-panel"><span className="lab-kicker">INSTITUTIONAL HISTORY</span><h2>Waqf & enduring public benefit</h2><p>{failed ? "Waqf reference information is temporarily unavailable." : "Loading waqf research…"}</p></article>;
  return <article className="economics-panel waqf-panel"><div className="waqf-illustration" aria-hidden="true">۞</div><span className="lab-kicker">INSTITUTIONAL HISTORY</span><h2>{info.title}</h2><p className="waqf-summary">{info.summary}</p><p>{info.description}</p>{info.sources?.length ? <div className="waqf-note"><strong>Further reading</strong><ul>{info.sources.map((source, i) => <li key={i}>{source}</li>)}</ul></div> : null}<div className="waqf-note">{info.disclaimer}</div></article>;
}
