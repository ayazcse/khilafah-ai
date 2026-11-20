import Link from "next/link";

const PLANS = [
  {
    name: "Explorer",
    price: "$0",
    period: "/month",
    features: ["5 AI research queries/day", "Governance & Economics Labs", "Learning Academy access", "Community knowledge graph"],
  },
  {
    name: "Researcher",
    price: "$12",
    period: "/month",
    features: ["Unlimited AI research queries", "Research Studio: unlimited uploads", "Priority processing", "Full knowledge graph access"],
    highlighted: true,
  },
  {
    name: "Institution",
    price: "Contact us",
    period: "",
    features: ["Multi-user accounts", "Custom source libraries", "Admin dashboard & analytics", "Dedicated support"],
  },
];

export default function PricingPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-serif font-semibold text-white mb-3">Plans</h1>
        <p className="text-white/50 max-w-xl mx-auto">
          Illustrative plans for this project. No payment is processed — this is a demonstration pricing page.
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {PLANS.map((plan) => (
          <div key={plan.name} className={`card ${plan.highlighted ? "border-gold/50" : ""}`}>
            <h3 className="text-white font-medium text-lg mb-1">{plan.name}</h3>
            <p className="mb-4">
              <span className="text-2xl text-gold font-semibold">{plan.price}</span>
              <span className="text-white/40 text-sm">{plan.period}</span>
            </p>
            <ul className="space-y-2 mb-6">
              {plan.features.map((f) => (
                <li key={f} className="text-white/60 text-sm flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/register" className={plan.highlighted ? "btn-primary w-full block text-center" : "btn-secondary w-full block text-center"}>
              Get started
            </Link>
          </div>
        ))}
      </div>
      <p className="text-white/30 text-xs text-center mt-10">
        These plans are illustrative placeholders for this project and are not connected to a billing system.
      </p>
    </div>
  );
}
