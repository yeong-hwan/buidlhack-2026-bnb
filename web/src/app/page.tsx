import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">
      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs text-green-400">
          <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
          Live on BNB Chain
        </div>

        <h1 className="mb-6 max-w-3xl text-5xl font-bold leading-tight tracking-tight text-white">
          Build your own trading agent.
          <br />
          <span className="text-green-400">No code required.</span>
        </h1>

        <p className="mb-10 max-w-xl text-lg text-white/50">
          Design on-chain trading strategies with a visual block editor.
          Deploy autonomous agents that execute on BSC and opBNB automatically.
        </p>

        <div className="flex gap-3">
          <Link
            href="/strategy"
            className="rounded-md bg-green-500 px-6 py-2.5 text-sm font-medium text-black transition-colors hover:bg-green-400"
          >
            Start Building
          </Link>
          <Link
            href="/market"
            className="rounded-md border border-white/20 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:border-white/40"
          >
            Browse Strategies
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-white/10 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-2xl font-semibold text-white">
            Three layers. One platform.
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-white/10 bg-white/5 p-6"
              >
                <div className="mb-3 text-2xl">{f.icon}</div>
                <h3 className="mb-2 font-semibold text-white">{f.title}</h3>
                <p className="text-sm leading-relaxed text-white/50">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-t border-white/10 px-6 py-16">
        <div className="mx-auto grid max-w-3xl grid-cols-3 gap-8 text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-bold text-green-400">{s.value}</div>
              <div className="mt-1 text-sm text-white/40">{s.label}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const FEATURES = [
  {
    icon: "🧩",
    title: "Visual Block Editor",
    desc: "Drag and drop signal, condition, action, and risk blocks to compose your strategy as a graph — no code needed.",
  },
  {
    icon: "🤖",
    title: "Multi-Agent Execution",
    desc: "Alpha, Execution, and Risk agents collaborate to run your strategy autonomously with built-in safeguards.",
  },
  {
    icon: "⛓",
    title: "On-Chain & Transparent",
    desc: "Strategies are registered on BSC. Every agent action is logged on opBNB — fully verifiable and auditable.",
  },
];

const STATS = [
  { value: "< $0.001", label: "Avg execution fee (opBNB)" },
  { value: "~1s", label: "Block time" },
  { value: "100%", label: "On-chain verifiable" },
];
