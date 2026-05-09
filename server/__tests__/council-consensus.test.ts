import { describe, it, expect } from "vitest";
import { tally, parseStructured } from "../services/council/consensus.js";

describe("council/consensus", () => {
  describe("parseStructured", () => {
    it("parses a clean JSON response", () => {
      const r = parseStructured('{"vote":"approve","confidence":0.85,"reasoning":"Strong fit"}');
      expect(r.vote).toBe("approve");
      expect(r.confidence).toBe(0.85);
      expect(r.reasoning).toBe("Strong fit");
    });

    it("parses JSON wrapped in markdown", () => {
      const text = '```json\n{"vote":"reject","confidence":0.4,"reasoning":"Margin too thin"}\n```';
      const r = parseStructured(text);
      expect(r.vote).toBe("reject");
      expect(r.confidence).toBe(0.4);
    });

    it("parses JSON with preamble prose", () => {
      const text = 'Here is my analysis: {"vote":"defer","confidence":0.5,"reasoning":"Need more data"}';
      const r = parseStructured(text);
      expect(r.vote).toBe("defer");
    });

    it("clamps confidence to [0, 1]", () => {
      expect(parseStructured('{"vote":"approve","confidence":1.5,"reasoning":"x"}').confidence).toBe(1);
      expect(parseStructured('{"vote":"approve","confidence":-0.2,"reasoning":"x"}').confidence).toBe(0);
    });

    it("returns vote=unknown on garbage input", () => {
      expect(parseStructured("").vote).toBe("unknown");
      expect(parseStructured("not json at all").vote).toBe("unknown");
      expect(parseStructured("{ malformed json").vote).toBe("unknown");
    });

    it("normalises invalid vote values to unknown", () => {
      expect(parseStructured('{"vote":"maybe","confidence":0.5,"reasoning":"x"}').vote).toBe("unknown");
    });

    it("extracts optional score field", () => {
      const r = parseStructured('{"vote":"approve","confidence":0.8,"reasoning":"x","score":75}');
      expect(r.score).toBe(75);
    });
  });

  describe("tally", () => {
    const mk = (participant: string, vote: any, reasoning = "x") => ({
      participant, vote, confidence: 0.8, reasoning, raw: "",
    });

    it("returns the majority vote", () => {
      const out = tally([
        mk("a", "approve"), mk("b", "approve"), mk("c", "reject"),
      ]);
      expect(out.majority).toBe("approve");
      expect(out.confidence).toBeCloseTo(2 / 3, 3);
    });

    it("records dissenters with their reasoning", () => {
      const out = tally([
        mk("a", "approve"), mk("b", "approve"), mk("c", "reject", "Margin"),
      ]);
      expect(out.dissent).toHaveLength(1);
      expect(out.dissent[0]).toMatchObject({ participant: "c", position: "reject", why: "Margin" });
    });

    it("ignores unknown votes when computing confidence denominator", () => {
      const out = tally([
        mk("a", "approve"), mk("b", "approve"), mk("c", "unknown"),
      ]);
      // 2 approves out of 2 non-unknown = 100% confidence
      expect(out.confidence).toBe(1);
      expect(out.dissent).toHaveLength(0);
    });

    it("handles all-unknown gracefully", () => {
      const out = tally([mk("a", "unknown"), mk("b", "unknown")]);
      expect(out.confidence).toBe(0);
      expect(out.dissent).toHaveLength(0);
    });
  });
});
