import * as Blockly from "blockly";

// ─── Alpha Agent Blocks ───────────────────────────────────────────

function registerAlphaBlocks() {
  Blockly.Blocks["alpha_when_momentum"] = {
    init() {
      this.appendDummyInput()
        .appendField("when momentum")
        .appendField(
          new Blockly.FieldDropdown([["rises above", "above"], ["falls below", "below"]]),
          "DIRECTION"
        )
        .appendField("threshold over")
        .appendField(new Blockly.FieldNumber(7, 1, 365), "PERIOD")
        .appendField("days");
      this.setNextStatement(true, "alpha");
      this.setColour(210);
      this.setTooltip("Trigger when price momentum crosses threshold.");
    },
  };

  Blockly.Blocks["alpha_when_price"] = {
    init() {
      this.appendDummyInput()
        .appendField("when price of")
        .appendField(
          new Blockly.FieldDropdown([["BNB", "BNB"], ["ETH", "ETH"], ["BTC", "BTC"]]),
          "TOKEN"
        )
        .appendField(
          new Blockly.FieldDropdown([["is above", ">="], ["is below", "<="]]),
          "OPERATOR"
        )
        .appendField(new Blockly.FieldNumber(300, 0), "VALUE")
        .appendField("USDT");
      this.setNextStatement(true, "alpha");
      this.setColour(210);
    },
  };

  Blockly.Blocks["alpha_when_volume"] = {
    init() {
      this.appendDummyInput()
        .appendField("when 24h volume exceeds")
        .appendField(new Blockly.FieldNumber(2, 1, 100), "MULTIPLIER")
        .appendField("x average");
      this.setNextStatement(true, "alpha");
      this.setColour(210);
    },
  };

  Blockly.Blocks["alpha_if"] = {
    init() {
      this.appendValueInput("CONDITION")
        .setCheck("Boolean")
        .appendField("if");
      this.appendStatementInput("DO").appendField("then");
      this.setPreviousStatement(true, "alpha");
      this.setNextStatement(true, "alpha");
      this.setColour(210);
    },
  };

  Blockly.Blocks["alpha_emit_signal"] = {
    init() {
      this.appendDummyInput()
        .appendField("emit signal")
        .appendField(
          new Blockly.FieldDropdown([
            ["BUY", "BUY"],
            ["SELL", "SELL"],
            ["HOLD", "HOLD"],
          ]),
          "SIGNAL"
        )
        .appendField("with strength")
        .appendField(new Blockly.FieldNumber(80, 1, 100), "STRENGTH")
        .appendField("%");
      this.setPreviousStatement(true, "alpha");
      this.setNextStatement(true, "alpha");
      this.setColour(210);
    },
  };
}

// ─── News Agent Blocks ────────────────────────────────────────────

function registerNewsBlocks() {
  Blockly.Blocks["news_when_sentiment"] = {
    init() {
      this.appendDummyInput()
        .appendField("when sentiment score")
        .appendField(
          new Blockly.FieldDropdown([["is positive (>= 0.6)", "positive"], ["is negative (<= 0.4)", "negative"], ["is neutral", "neutral"]]),
          "SENTIMENT"
        );
      this.setNextStatement(true, "news");
      this.setColour(160);
    },
  };

  Blockly.Blocks["news_when_keyword"] = {
    init() {
      this.appendDummyInput()
        .appendField("when keyword")
        .appendField(new Blockly.FieldTextInput("BNB upgrade"), "KEYWORD")
        .appendField("appears in")
        .appendField(
          new Blockly.FieldDropdown([["crypto news", "news"], ["Twitter", "twitter"], ["Reddit", "reddit"]]),
          "SOURCE"
        );
      this.setNextStatement(true, "news");
      this.setColour(160);
    },
  };

  Blockly.Blocks["news_if"] = {
    init() {
      this.appendValueInput("CONDITION")
        .setCheck("Boolean")
        .appendField("if");
      this.appendStatementInput("DO").appendField("then");
      this.setPreviousStatement(true, "news");
      this.setNextStatement(true, "news");
      this.setColour(160);
    },
  };

  Blockly.Blocks["news_emit_signal"] = {
    init() {
      this.appendDummyInput()
        .appendField("emit news signal")
        .appendField(
          new Blockly.FieldDropdown([["BULLISH", "BULLISH"], ["BEARISH", "BEARISH"], ["NEUTRAL", "NEUTRAL"]]),
          "SIGNAL"
        );
      this.setPreviousStatement(true, "news");
      this.setNextStatement(true, "news");
      this.setColour(160);
    },
  };
}

// ─── Manager (Execution) Agent Blocks ────────────────────────────

function registerManagerBlocks() {
  Blockly.Blocks["mgr_on_signal"] = {
    init() {
      this.appendDummyInput()
        .appendField("on signal")
        .appendField(
          new Blockly.FieldDropdown([
            ["BUY", "BUY"],
            ["SELL", "SELL"],
            ["BULLISH", "BULLISH"],
            ["BEARISH", "BEARISH"],
          ]),
          "SIGNAL"
        );
      this.setNextStatement(true, "manager");
      this.setColour(120);
    },
  };

  Blockly.Blocks["mgr_buy"] = {
    init() {
      this.appendDummyInput()
        .appendField("buy")
        .appendField(new Blockly.FieldNumber(100, 1), "AMOUNT")
        .appendField("USDT of")
        .appendField(
          new Blockly.FieldDropdown([["BNB", "BNB"], ["ETH", "ETH"], ["BTC", "BTC"], ["CAKE", "CAKE"]]),
          "TOKEN"
        )
        .appendField("via")
        .appendField(
          new Blockly.FieldDropdown([["PancakeSwap", "pancake"], ["market order", "market"]]),
          "DEX"
        );
      this.setPreviousStatement(true, "manager");
      this.setNextStatement(true, "manager");
      this.setColour(120);
    },
  };

  Blockly.Blocks["mgr_sell"] = {
    init() {
      this.appendDummyInput()
        .appendField("sell")
        .appendField(new Blockly.FieldNumber(50, 1, 100), "AMOUNT_PCT")
        .appendField("% of")
        .appendField(
          new Blockly.FieldDropdown([["BNB", "BNB"], ["ETH", "ETH"], ["BTC", "BTC"], ["CAKE", "CAKE"]]),
          "TOKEN"
        );
      this.setPreviousStatement(true, "manager");
      this.setNextStatement(true, "manager");
      this.setColour(120);
    },
  };

  Blockly.Blocks["mgr_dca"] = {
    init() {
      this.appendDummyInput()
        .appendField("DCA: buy")
        .appendField(new Blockly.FieldNumber(100, 1), "AMOUNT")
        .appendField("USDT of")
        .appendField(
          new Blockly.FieldDropdown([["BNB", "BNB"], ["ETH", "ETH"], ["BTC", "BTC"]]),
          "TOKEN"
        )
        .appendField("every")
        .appendField(
          new Blockly.FieldDropdown([["week", "weekly"], ["day", "daily"], ["month", "monthly"]]),
          "INTERVAL"
        );
      this.setPreviousStatement(true, "manager");
      this.setNextStatement(true, "manager");
      this.setColour(120);
    },
  };

  Blockly.Blocks["mgr_rebalance"] = {
    init() {
      this.appendDummyInput()
        .appendField("rebalance")
        .appendField(
          new Blockly.FieldDropdown([["BNB", "BNB"], ["ETH", "ETH"], ["BTC", "BTC"]]),
          "TOKEN"
        )
        .appendField("to")
        .appendField(new Blockly.FieldNumber(50, 1, 99), "TARGET_PCT")
        .appendField("% of portfolio");
      this.setPreviousStatement(true, "manager");
      this.setNextStatement(true, "manager");
      this.setColour(120);
    },
  };

  Blockly.Blocks["mgr_repeat"] = {
    init() {
      this.appendDummyInput()
        .appendField("repeat every")
        .appendField(new Blockly.FieldNumber(1, 1), "N")
        .appendField(
          new Blockly.FieldDropdown([["hours", "hours"], ["days", "days"], ["weeks", "weeks"]]),
          "UNIT"
        );
      this.appendStatementInput("DO").appendField("do");
      this.setPreviousStatement(true, "manager");
      this.setNextStatement(true, "manager");
      this.setColour(120);
    },
  };

  Blockly.Blocks["mgr_if"] = {
    init() {
      this.appendValueInput("CONDITION")
        .setCheck("Boolean")
        .appendField("if");
      this.appendStatementInput("DO").appendField("then");
      this.appendStatementInput("ELSE").appendField("else");
      this.setPreviousStatement(true, "manager");
      this.setNextStatement(true, "manager");
      this.setColour(120);
    },
  };
}

// ─── Risk Agent Blocks ────────────────────────────────────────────

function registerRiskBlocks() {
  Blockly.Blocks["risk_set_stop_loss"] = {
    init() {
      this.appendDummyInput()
        .appendField("set stop loss at")
        .appendField(new Blockly.FieldNumber(10, 0.1, 99), "PCT")
        .appendField("% below entry");
      this.setPreviousStatement(true, "risk");
      this.setNextStatement(true, "risk");
      this.setColour(0);
    },
  };

  Blockly.Blocks["risk_set_take_profit"] = {
    init() {
      this.appendDummyInput()
        .appendField("set take profit at")
        .appendField(new Blockly.FieldNumber(20, 0.1, 1000), "PCT")
        .appendField("% above entry");
      this.setPreviousStatement(true, "risk");
      this.setNextStatement(true, "risk");
      this.setColour(0);
    },
  };

  Blockly.Blocks["risk_max_position"] = {
    init() {
      this.appendDummyInput()
        .appendField("max position size")
        .appendField(new Blockly.FieldNumber(500, 1), "MAX_USDT")
        .appendField("USDT");
      this.setPreviousStatement(true, "risk");
      this.setNextStatement(true, "risk");
      this.setColour(0);
    },
  };

  Blockly.Blocks["risk_max_drawdown"] = {
    init() {
      this.appendDummyInput()
        .appendField("if drawdown exceeds")
        .appendField(new Blockly.FieldNumber(20, 1, 100), "PCT")
        .appendField("% pause all agents");
      this.setPreviousStatement(true, "risk");
      this.setNextStatement(true, "risk");
      this.setColour(0);
    },
  };

  Blockly.Blocks["risk_daily_loss_limit"] = {
    init() {
      this.appendDummyInput()
        .appendField("daily loss limit")
        .appendField(new Blockly.FieldNumber(100, 1), "LIMIT_USDT")
        .appendField("USDT — halt if exceeded");
      this.setPreviousStatement(true, "risk");
      this.setNextStatement(true, "risk");
      this.setColour(0);
    },
  };

  Blockly.Blocks["risk_if"] = {
    init() {
      this.appendValueInput("CONDITION")
        .setCheck("Boolean")
        .appendField("if");
      this.appendStatementInput("DO").appendField("then");
      this.setPreviousStatement(true, "risk");
      this.setNextStatement(true, "risk");
      this.setColour(0);
    },
  };
}

// ─── Shared Value/Condition Blocks ────────────────────────────────

function registerSharedBlocks() {
  Blockly.Blocks["val_compare"] = {
    init() {
      this.appendValueInput("A").setCheck("Number");
      this.appendDummyInput()
        .appendField(
          new Blockly.FieldDropdown([["=", "EQ"], [">", "GT"], ["<", "LT"], [">=", "GTE"], ["<=", "LTE"]]),
          "OP"
        );
      this.appendValueInput("B").setCheck("Number");
      this.setInputsInline(true);
      this.setOutput(true, "Boolean");
      this.setColour(60);
    },
  };

  Blockly.Blocks["val_and"] = {
    init() {
      this.appendValueInput("A").setCheck("Boolean");
      this.appendDummyInput().appendField("and");
      this.appendValueInput("B").setCheck("Boolean");
      this.setInputsInline(true);
      this.setOutput(true, "Boolean");
      this.setColour(60);
    },
  };

  Blockly.Blocks["val_or"] = {
    init() {
      this.appendValueInput("A").setCheck("Boolean");
      this.appendDummyInput().appendField("or");
      this.appendValueInput("B").setCheck("Boolean");
      this.setInputsInline(true);
      this.setOutput(true, "Boolean");
      this.setColour(60);
    },
  };

  Blockly.Blocks["val_number"] = {
    init() {
      this.appendDummyInput().appendField(new Blockly.FieldNumber(0), "NUM");
      this.setOutput(true, "Number");
      this.setColour(60);
    },
  };
}

export function registerBlocks() {
  registerAlphaBlocks();
  registerNewsBlocks();
  registerManagerBlocks();
  registerRiskBlocks();
  registerSharedBlocks();
}

// ─── Toolbox per agent ────────────────────────────────────────────

export const TOOLBOXES: Record<string, Blockly.utils.toolbox.ToolboxDefinition> = {
  alpha: {
    kind: "flyoutToolbox",
    contents: [
      { kind: "label", text: "Triggers" },
      { kind: "block", type: "alpha_when_momentum" },
      { kind: "block", type: "alpha_when_price" },
      { kind: "block", type: "alpha_when_volume" },
      { kind: "label", text: "Control" },
      { kind: "block", type: "alpha_if" },
      { kind: "label", text: "Output" },
      { kind: "block", type: "alpha_emit_signal" },
      { kind: "label", text: "Logic" },
      { kind: "block", type: "val_compare" },
      { kind: "block", type: "val_and" },
      { kind: "block", type: "val_or" },
    ],
  },
  news: {
    kind: "flyoutToolbox",
    contents: [
      { kind: "label", text: "Triggers" },
      { kind: "block", type: "news_when_sentiment" },
      { kind: "block", type: "news_when_keyword" },
      { kind: "label", text: "Control" },
      { kind: "block", type: "news_if" },
      { kind: "label", text: "Output" },
      { kind: "block", type: "news_emit_signal" },
      { kind: "label", text: "Logic" },
      { kind: "block", type: "val_and" },
      { kind: "block", type: "val_or" },
    ],
  },
  manager: {
    kind: "flyoutToolbox",
    contents: [
      { kind: "label", text: "Triggers" },
      { kind: "block", type: "mgr_on_signal" },
      { kind: "label", text: "Orders" },
      { kind: "block", type: "mgr_buy" },
      { kind: "block", type: "mgr_sell" },
      { kind: "block", type: "mgr_dca" },
      { kind: "block", type: "mgr_rebalance" },
      { kind: "label", text: "Control" },
      { kind: "block", type: "mgr_repeat" },
      { kind: "block", type: "mgr_if" },
      { kind: "label", text: "Logic" },
      { kind: "block", type: "val_compare" },
      { kind: "block", type: "val_and" },
      { kind: "block", type: "val_or" },
    ],
  },
  risk: {
    kind: "flyoutToolbox",
    contents: [
      { kind: "label", text: "Guards" },
      { kind: "block", type: "risk_set_stop_loss" },
      { kind: "block", type: "risk_set_take_profit" },
      { kind: "block", type: "risk_max_position" },
      { kind: "block", type: "risk_max_drawdown" },
      { kind: "block", type: "risk_daily_loss_limit" },
      { kind: "label", text: "Control" },
      { kind: "block", type: "risk_if" },
      { kind: "label", text: "Logic" },
      { kind: "block", type: "val_compare" },
      { kind: "block", type: "val_and" },
    ],
  },
};
