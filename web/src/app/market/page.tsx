export default function MarketPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Strategy Market</h1>
        <p className="mt-1 text-sm text-white/40">Browse, buy, and deploy strategies built by the community.</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        {["All", "DCA", "Momentum", "Rebalance", "Arbitrage"].map((f) => (
          <button
            key={f}
            className={`rounded-full px-3 py-1 text-xs transition-colors ${
              f === "All"
                ? "bg-green-500 text-black"
                : "border border-white/10 text-white/50 hover:text-white"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Strategy Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {STRATEGIES.map((s) => (
          <div
            key={s.name}
            className="rounded-xl border border-white/10 bg-white/5 p-5 transition-colors hover:border-white/20"
          >
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-white">{s.name}</h3>
                <p className="text-xs text-white/40">{s.author}</p>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  s.returnPct >= 0
                    ? "bg-green-500/10 text-green-400"
                    : "bg-red-500/10 text-red-400"
                }`}
              >
                {s.returnPct >= 0 ? "+" : ""}{s.returnPct}%
              </span>
            </div>

            <p className="mb-4 text-xs leading-relaxed text-white/50">{s.desc}</p>

            <div className="mb-4 flex gap-4 text-xs text-white/30">
              <span>Used by {s.users}</span>
              <span>{s.chain}</span>
            </div>

            <button className="w-full rounded-md border border-white/10 py-1.5 text-xs text-white/70 transition-colors hover:border-green-500/50 hover:text-green-400">
              Deploy this strategy
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const STRATEGIES = [
  {
    name: "BNB DCA Weekly",
    author: "0x1a2b...3c4d",
    returnPct: 24.5,
    desc: "Buy BNB every Monday at 9am UTC regardless of price. Simple and effective long-term accumulation.",
    users: "1.2k",
    chain: "BSC",
  },
  {
    name: "Momentum Rider",
    author: "0xdefi...1337",
    returnPct: 61.2,
    desc: "Enters when 7d momentum crosses above threshold. Exits on reversal signal or stop-loss trigger.",
    users: "843",
    chain: "BSC",
  },
  {
    name: "Stable Rebalancer",
    author: "0xalph...a999",
    returnPct: 8.3,
    desc: "Maintains 50/50 USDT-BNB ratio. Rebalances whenever drift exceeds 5%. Low risk, steady yield.",
    users: "2.1k",
    chain: "opBNB",
  },
  {
    name: "News Alpha",
    author: "0xsig...b000",
    returnPct: -3.1,
    desc: "Trades on sentiment signals from crypto news feeds. High risk, experimental. Use with caution.",
    users: "312",
    chain: "BSC",
  },
  {
    name: "Ladder Buy",
    author: "0x7e8f...c111",
    returnPct: 18.7,
    desc: "Places limit orders at 5% intervals below current price. Accumulates on dips automatically.",
    users: "678",
    chain: "opBNB",
  },
  {
    name: "Portfolio Shield",
    author: "0xrisk...d222",
    returnPct: 5.9,
    desc: "Monitors portfolio risk score. Converts to stables when risk exceeds threshold. Capital preservation first.",
    users: "934",
    chain: "BSC",
  },
];
