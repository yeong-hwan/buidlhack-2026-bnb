import { getBlockDef } from "./blockRegistry";
import type { StrategyBlock, AgentBlocks } from "@/app/api/strategy/route";

export type Severity = "error" | "warning";

export interface BlockError {
  agent: string;
  blockIndex?: number;
  severity: Severity;
  message: string;
}

// Manager trigger block types — C-BLOCKs that wrap their own actions
const MANAGER_TRIGGERS = new Set([
  "mgr_on_alpha",
  "mgr_on_news",
  "mgr_on_data",
  "mgr_schedule",
  "mgr_combine",
]);

export function validateStrategy(agents: AgentBlocks): BlockError[] {
  const errors: BlockError[] = [];

  for (const [agentKey, blocks] of Object.entries(agents)) {
    if (!blocks || blocks.length === 0) continue;
    validateAgentBlocks(agentKey, blocks as StrategyBlock[], errors);
  }

  validateCrossAgent(agents, errors);
  return errors;
}

function validateAgentBlocks(agentKey: string, blocks: StrategyBlock[], errors: BlockError[]) {
  // Risk agent is always-on stateful guardrails — no trigger required.
  // Skip trigger/order checks for risk.
  if (agentKey === "risk") {
    validateRiskBlocks(blocks, errors);
    return;
  }

  blocks.forEach((block, idx) => {
    const def = getBlockDef(block.type);
    if (!def) {
      errors.push({ agent: agentKey, blockIndex: idx, severity: "error", message: `Unknown block type: ${block.type}` });
      return;
    }

    // Hat blocks should be first
    if (def.shape === "hat" && idx !== 0) {
      errors.push({ agent: agentKey, blockIndex: idx, severity: "warning", message: `"${def.label}" is a trigger — should be at the top` });
    }

    // Cap blocks should be last
    if (def.shape === "cap" && idx !== blocks.length - 1) {
      errors.push({ agent: agentKey, blockIndex: idx, severity: "warning", message: `"${def.label}" is an output block — should be at the bottom` });
    }

    // First block must be a trigger (hat or cblock)
    if (idx === 0 && def.shape !== "hat" && def.shape !== "cblock") {
      errors.push({ agent: agentKey, blockIndex: idx, severity: "warning", message: `Strategy should start with a trigger block` });
    }
  });

  const hasEmit   = blocks.some((b) => b.type.endsWith("_emit") || b.type.endsWith("_emit_signal"));
  const hasAction = blocks.some((b) => { const d = getBlockDef(b.type); return d?.shape === "stack"; });

  // Upstream agents need an emit block to pass signals downstream
  if (["data", "alpha", "news"].includes(agentKey)) {
    if (blocks.length > 0 && !hasEmit) {
      errors.push({ agent: agentKey, severity: "warning", message: `No output block — signals won't reach downstream agents` });
    }
  }

  // Manager must have at least one signal trigger to react to anything
  if (agentKey === "manager") {
    const hasTrigger = blocks.some((b) => MANAGER_TRIGGERS.has(b.type));
    if (hasAction && !hasTrigger) {
      errors.push({ agent: agentKey, severity: "warning", message: `No signal trigger — add "on alpha", "on news", "on data", or "schedule" to start execution` });
    }
  }
}

function validateRiskBlocks(blocks: StrategyBlock[], errors: BlockError[]) {
  // Unknown block types
  blocks.forEach((block, idx) => {
    if (!getBlockDef(block.type)) {
      errors.push({ agent: "risk", blockIndex: idx, severity: "error", message: `Unknown block type: ${block.type}` });
    }
  });

  // Must have stop loss
  const hasStopLoss = blocks.some((b) => b.type === "risk_set_stop_loss");
  if (!hasStopLoss) {
    errors.push({ agent: "risk", severity: "error", message: `Missing stop loss — required for all strategies` });
  }

  // Must have take profit
  const hasTakeProfit = blocks.some((b) => b.type === "risk_set_take_profit");
  if (!hasTakeProfit) {
    errors.push({ agent: "risk", severity: "warning", message: `Missing take profit — recommended to define an exit target` });
  }
}

function validateCrossAgent(agents: AgentBlocks, errors: BlockError[]) {
  const hasAlpha   = (agents.alpha?.length   ?? 0) > 0;
  const hasNews    = (agents.news?.length    ?? 0) > 0;
  const hasData    = (agents.data?.length    ?? 0) > 0;
  const hasManager = (agents.manager?.length ?? 0) > 0;
  const hasRisk    = (agents.risk?.length    ?? 0) > 0;

  // Manager without any signal source
  if (hasManager && !hasAlpha && !hasNews && !hasData) {
    errors.push({ agent: "manager", severity: "warning", message: `No signal source — add Alpha, News, or Data Feed agent blocks` });
  }

  // Manager without risk guardrails
  if (hasManager && !hasRisk) {
    errors.push({ agent: "risk", severity: "error", message: `Risk agent is empty — add at least a stop loss` });
  }

  // Alpha emits but manager has no alpha trigger
  if (hasAlpha && hasManager) {
    const managerBlocks = agents.manager ?? [];
    const hasAlphaTrigger = managerBlocks.some((b) => b.type === "mgr_on_alpha");
    if (!hasAlphaTrigger) {
      errors.push({ agent: "manager", severity: "warning", message: `Alpha agent is active but Manager has no "on alpha" trigger — signals will be ignored` });
    }
  }

  // News emits but manager has no news trigger
  if (hasNews && hasManager) {
    const managerBlocks = agents.manager ?? [];
    const hasNewsTrigger = managerBlocks.some((b) => b.type === "mgr_on_news");
    if (!hasNewsTrigger) {
      errors.push({ agent: "manager", severity: "warning", message: `News agent is active but Manager has no "on news" trigger — signals will be ignored` });
    }
  }
}
