"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount, useConnect, useDisconnect } from "wagmi";

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Strategy", href: "/strategy" },
  { label: "Market", href: "/market" },
  { label: "Pricing", href: "/pricing" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const abbreviate = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="text-sm font-semibold tracking-tight text-white">
          AgentBlock
        </Link>

        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-white/50 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {isConnected && address ? (
          <button
            onClick={() => disconnect()}
            className="rounded-md bg-green-500 px-4 py-1.5 text-sm font-medium text-black transition-colors hover:bg-green-400"
          >
            {abbreviate(address)}
          </button>
        ) : (
          <button
            onClick={() => connect({ connector: connectors[0] })}
            className="rounded-md bg-green-500 px-4 py-1.5 text-sm font-medium text-black transition-colors hover:bg-green-400"
          >
            Connect Wallet
          </button>
        )}
      </div>
    </header>
  );
}
