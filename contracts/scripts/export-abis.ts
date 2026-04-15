#!/usr/bin/env tsx
/**
 * Reads Foundry build artifacts from contracts/out and writes compact
 * ABI + bytecode JSON files to web/src/contracts/ so the frontend can
 * consume them directly without pulling the full Foundry output.
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

const CONTRACTS = ["PerUserExecutor", "TradeReceiptRegistry"] as const;

const root = resolve(__dirname, "..");
const outDir = join(root, "out");
const frontendDir = resolve(root, "..", "web", "src", "contracts");

mkdirSync(frontendDir, { recursive: true });

for (const name of CONTRACTS) {
  const artifactPath = join(outDir, `${name}.sol`, `${name}.json`);
  if (!existsSync(artifactPath)) {
    console.warn(`skip ${name}: artifact not found at ${artifactPath}`);
    continue;
  }
  const artifact = JSON.parse(readFileSync(artifactPath, "utf8")) as {
    abi: unknown;
    bytecode?: { object: string };
  };

  const outPath = join(frontendDir, `${name}.json`);
  writeFileSync(
    outPath,
    JSON.stringify(
      {
        abi: artifact.abi,
        bytecode: artifact.bytecode?.object ?? "0x",
      },
      null,
      2
    )
  );
  console.log(`wrote ${outPath}`);
}

// Also copy addresses.json for convenience.
const addresses = readFileSync(join(root, "addresses.json"), "utf8");
writeFileSync(join(frontendDir, "addresses.json"), addresses);
console.log(`wrote ${join(frontendDir, "addresses.json")}`);
