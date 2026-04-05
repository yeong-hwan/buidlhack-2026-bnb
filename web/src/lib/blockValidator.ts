import { getBlockDef } from "./blockRegistry";
import type { StrategyBlock, AgentBlocks } from "@/app/api/strategy/route";

export type Severity = "error" | "warning";

export interface BlockError {
  agent: string;
  blockIndex?: number;
  severity: Severity;
  message: string;
}

export function validateStrategy(agents: AgentBlocks): BlockError[] {
  const errors: BlockError[] = [];

  for (const [agentKey, blocks] of Object.entries(agents)) {
    if (!blocks || blocks.length === 0) continue;
    validateAgentBlocks(agentKey, blocks as StrategyBlock[], errors);
  }

  // Cross-agent validations
  validateCrossAgent(agents, errors);

  return errors;
}

function validateAgentBlocks(agentKey: string, blocks: StrategyBlock[], errors: BlockError[]) {
  blocks.forEach((block, idx) => {
    const def = getBlockDef(block.type);
    if (!def) {
      errors.push({ agent: agentKey, blockIndex: idx, severity: "error", message: `Unknown block type: ${block.type}` });
      return;
    }

    // Hat blocks should be first
    if (def.shape === "hat" && idx !== 0) {
      errors.push({ agent: agentKey, blockIndex: idx, severity: "warning", message: `"${def.label}" is a trigger block — should be at the top` });
    }

    // Cap blocks should be last
    if (def.shape === "cap" && idx !== blocks.length - 1) {
      errors.push({ agent: agentKey, blockIndex: idx, severity: "warning", message: `"${def.label}" is an output block — should be at the bottom` });
    }

    // Non-hat block at position 0
    if (idx === 0 && def.shape !== "hat" && def.shape !== "cblock") {
      errors.push({ agent: agentKey, blockIndex: idx, severity: "warning", message: `Strategy should start with a trigger block (WHEN/ON/FEED)` });
    }
  });

  // Agent-specific rules
  const hasEmit = blocks.some((b) => b.type.includes("emit"));
  const hasAction = blocks.some((b) => {
    const d = getBlockDef(b.type);
    return d?.shape === "stack";
  });

  if (["data", "alpha", "news"].includes(agentKey)) {
    if (blocks.length > 0 && !hasEmit) {
      errors.push({ agent: agentKey, severity: "warning", message: `No output block — signals won't reach downstream agents` });
    }
  }

  if (agentKey === "manager") {
    const hasOnSignal = blocks.some((b) => b.type === "mgr_on_signal");
    if (hasAction && !hasOnSignal) {
      errors.push({ agent: agentKey, severity: "warning", message: `No signal receiver (ON) — actions won't be triggered` });
    }
  }
}

function validateCrossAgent(agents: AgentBlocks, errors: BlockError[]) {
  const hasAlpha   = (agents.alpha?.length ?? 0) > 0;
  const hasNews    = (agents.news?.length ?? 0) > 0;
  const hasManager = (agents.manager?.length ?? 0) > 0;
  const hasRisk    = (agents.risk?.length ?? 0) > 0;

  if (hasManager && !hasAlpha && !hasNews) {
    errors.push({ agent: "manager", severity: "warning", message: `No signal source — add Alpha or News agent blocks` });
  }

  if (hasManager && !hasRisk) {
    errors.push({ agent: "risk", severity: "error", message: `Risk agent is empty — add at least stop loss for safety` });
  }
}
