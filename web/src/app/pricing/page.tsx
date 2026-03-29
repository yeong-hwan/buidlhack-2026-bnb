export default function PricingPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-bold text-white">Simple pricing</h1>
        <p className="mt-2 text-white/40">Start free. Scale as you grow.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-xl border p-6 ${
              plan.highlighted
                ? "border-green-500/50 bg-green-500/5"
                : "border-white/10 bg-white/5"
            }`}
          >
            {plan.highlighted && (
              <div className="mb-3 inline-block rounded-full bg-green-500/20 px-2.5 py-0.5 text-xs text-green-400">
                Most Popular
              </div>
            )}
            <h2 className="text-lg font-semibold text-white">{plan.name}</h2>
            <div className="mt-2 mb-4">
              <span className="text-3xl font-bold text-white">{plan.price}</span>
              {plan.period && (
                <span className="text-sm text-white/40"> / {plan.period}</span>
              )}
            </div>
            <p className="mb-6 text-sm text-white/40">{plan.desc}</p>

            <ul className="mb-8 space-y-2">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-white/70">
                  <span className="text-green-400">+</span>
                  {f}
                </li>
              ))}
            </ul>

            <button
              className={`w-full rounded-md py-2 text-sm font-medium transition-colors ${
                plan.highlighted
                  ? "bg-green-500 text-black hover:bg-green-400"
                  : "border border-white/10 text-white hover:border-white/30"
              }`}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>

      <p className="mt-10 text-center text-xs text-white/20">
        All plans include on-chain execution on BSC and opBNB. Gas fees paid by user.
      </p>
    </div>
  );
}

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: null,
    desc: "For curious builders getting started.",
    highlighted: false,
    cta: "Get started",
    features: [
      "1 active agent",
      "3 strategy blocks",
      "BSC testnet only",
      "Community support",
    ],
  },
  {
    name: "Pro",
    price: "$19",
    period: "mo",
    desc: "For active traders running real strategies.",
    highlighted: true,
    cta: "Start free trial",
    features: [
      "10 active agents",
      "Unlimited blocks",
      "BSC + opBNB mainnet",
      "Backtest (90 days)",
      "Strategy marketplace access",
      "Priority support",
    ],
  },
  {
    name: "Team",
    price: "$79",
    period: "mo",
    desc: "For funds and power users.",
    highlighted: false,
    cta: "Contact us",
    features: [
      "Unlimited agents",
      "Custom block development",
      "API access",
      "Full backtest history",
      "Publish to marketplace",
      "Dedicated support",
    ],
  },
];
