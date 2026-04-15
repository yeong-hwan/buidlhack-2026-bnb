---
marp: true
theme: default
paginate: true
size: 16:9
style: |
  section {
    background: #0a0a0a;
    color: #f5f5f7;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Arial, sans-serif;
    font-weight: 300;
    padding: 80px;
    justify-content: center;
  }
  h1 {
    font-size: 88px;
    font-weight: 700;
    letter-spacing: -0.03em;
    line-height: 1.05;
    margin: 0;
  }
  h2 {
    font-size: 56px;
    font-weight: 600;
    letter-spacing: -0.02em;
    line-height: 1.1;
    margin: 0 0 32px 0;
  }
  h3 {
    font-size: 32px;
    font-weight: 400;
    color: #a1a1a6;
    margin: 0 0 16px 0;
  }
  p, li {
    font-size: 34px;
    line-height: 1.35;
    font-weight: 300;
  }
  strong { font-weight: 600; color: #ffffff; }
  em { color: #f0b90b; font-style: normal; font-weight: 500; }
  ul { list-style: none; padding: 0; }
  li { margin: 24px 0; padding-left: 40px; position: relative; }
  li::before {
    content: "—";
    position: absolute;
    left: 0;
    color: #f0b90b;
  }
  blockquote {
    font-size: 40px;
    font-weight: 300;
    color: #a1a1a6;
    border: none;
    padding: 0;
    margin: 0;
    font-style: italic;
  }
  code {
    background: #1c1c1e;
    color: #f0b90b;
    padding: 4px 12px;
    border-radius: 6px;
    font-size: 0.85em;
  }
  section.title h1 { font-size: 120px; }
  section.title h3 { font-size: 36px; color: #f0b90b; margin-top: 48px; }
  section.big p { font-size: 72px; font-weight: 600; line-height: 1.15; color: #ffffff; }
  section.quote blockquote { font-size: 56px; font-weight: 400; color: #f5f5f7; }
  section::after {
    color: #48484a;
    font-size: 18px;
  }
  table {
    font-size: 24px;
    border-collapse: collapse;
    margin-top: 24px;
  }
  th, td {
    padding: 14px 20px;
    border-bottom: 1px solid #2c2c2e;
    text-align: left;
  }
  th { color: #a1a1a6; font-weight: 500; }
---

<!-- _class: title -->
<!-- _paginate: false -->

# BLOCKTRADE

### Trading agents you can actually trust.

---

<!-- _class: big -->

## The problem

People brag about **200% returns**.

You have no way to verify a thing.

---

## Two questions nobody answers

- **What does this strategy actually do?**
  Code you can't read. Descriptions that might lie.

- **Is the track record even real?**
  Screenshots can be faked. Losing trades can be hidden.

---

<!-- _class: quote -->

> So you either trust a black box,
> or envy numbers you can't verify.

---

<!-- _class: big -->

## Our answer

**Readable** strategies.
**Tamper-proof** track records.

---

## ① Readable

### No code. Just blocks.

> *"RSI < 30 **AND** volume 2× → buy BNB 30%"*

Four blocks. Anyone can read it.
The strategy **is** the documentation.

---

## ② Tamper-proof

### Every trade, hashed onchain.

`keccak256(strategyId, tokens, amounts, time)` → **BSC**

Traders can't inflate PnL.
They can't hide losing trades.
**The chain testifies.**

---

## One more thing — AI signals

Old bots see charts. Real markets move elsewhere.

- **Macro blocks** — *"Nasdaq futures drop 1%"*
- **Semantic blocks** — *"Fed turns hawkish"*

AI reads context. We turn it into a block you can read too.

---

## Built for BNB Chain

- **PancakeSwap V3** — every trade lands here
- **opBNB** — gas low enough for retail
- **Repeatable tx** — automation = high frequency, by design
- **Onchain settlement** — marketplace fees, auto-split

*Every signal our product generates becomes BNB volume.*

---

<!-- _class: title -->

# The GitHub of
# trading strategies.

### Readable. Verifiable. On BNB.
