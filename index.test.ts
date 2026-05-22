import { describe, test, expect, beforeAll } from "bun:test";
import * as engine from "./src/story_engine/engine";

// --- tokenize ---

describe("tokenize", () => {
  test("plain text", () => {
    expect(engine.tokenize("Hello world")).toEqual([
      { type: "text", value: "Hello world" },
    ]);
  });

  test("\\E produces an expr token", () => {
    expect(engine.tokenize("\\Echaracter.idle\\")).toEqual([
      { type: "expr", value: "character.idle" },
    ]);
  });

  test("\\S produces an info token", () => {
    expect(engine.tokenize("\\Scharacter.hp\\")).toEqual([
      { type: "info", value: "character.hp" },
    ]);
  });

  test("\\P produces a page token", () => {
    expect(engine.tokenize("\\P")).toEqual([{ type: "page" }]);
  });

  test("mixed content preserves order", () => {
    expect(
      engine.tokenize(
        "Hi \\Echaracter.idle\\ you have \\Scharacter.hp\\ HP\\Psee ya",
      ),
    ).toEqual([
      { type: "text", value: "Hi " },
      { type: "expr", value: "character.idle" },
      { type: "text", value: " you have " },
      { type: "info", value: "character.hp" },
      { type: "text", value: " HP" },
      { type: "page" },
      { type: "text", value: "see ya" },
    ]);
  });

  test("unclosed \\E is ignored", () => {
    expect(engine.tokenize("Hello \\Echaracter.idle")).toEqual([
      { type: "text", value: "Hello " },
    ]);
  });

  test("empty string returns no tokens", () => {
    expect(engine.tokenize("")).toEqual([]);
  });
});

// --- parse_section ---

describe("parse_section", () => {
  test("body with no options", () => {
    const section = engine.parse_section("Some text.", []);
    expect(section.tokens).toEqual([{ type: "text", value: "Some text." }]);
    expect(section.options).toEqual([]);
  });

  test("options are extracted from trailing lines", () => {
    const body = "What do you do?\n- Fight\n- Run";
    const section = engine.parse_section(body, ["fight", "run", "extra"]);
    expect(section.tokens).toEqual([
      { type: "text", value: "What do you do?" },
    ]);
    expect(section.options).toEqual([
      { label: "Fight", target: "fight" },
      { label: "Run", target: "run" },
    ]);
  });

  test("options with fewer next_sections fall back to empty target", () => {
    const section = engine.parse_section("Choose.\n- Only option", []);
    expect(section.options).toEqual([{ label: "Only option", target: "" }]);
  });

  test("expr and info tokens inside body are tokenized", () => {
    const section = engine.parse_section(
      "Hello \\Echaracter.idle\\ HP: \\Scharacter.hp\\",
      [],
    );
    expect(section.tokens).toEqual([
      { type: "text", value: "Hello " },
      { type: "expr", value: "character.idle" },
      { type: "text", value: " HP: " },
      { type: "info", value: "character.hp" },
    ]);
  });

  test("page break token inside body", () => {
    const section = engine.parse_section("First page.\\PSecond page.", []);
    expect(section.tokens).toEqual([
      { type: "text", value: "First page." },
      { type: "page" },
      { type: "text", value: "Second page." },
    ]);
  });
});

// --- parse_dialogue ---

describe("parse_dialogue", () => {
  beforeAll(async () => {
    await engine.parse_dialogue();
  });

  test("loads example file", () => {
    expect(engine.dialogue.has("example")).toBe(true);
  });

  test("example has an intro section", () => {
    const sections = engine.dialogue.get("example")!;
    expect(sections["intro"]).toBeDefined();
  });

  test("intro section has options pointing to ask and ignore", () => {
    const sections = engine.dialogue.get("example")!;
    const targets = sections["intro"]!.options.map((o) => o.target);
    expect(targets).toContain("ask");
    expect(targets).toContain("ignore");
  });

  test("dead-end sections have no options", () => {
    const sections = engine.dialogue.get("example")!;
    expect(sections["order_drink"]!.options).toEqual([]);
    expect(sections["fight_beast"]!.options).toEqual([]);
  });

  test("intro tokens include expr for character name", () => {
    const sections = engine.dialogue.get("example")!;
    const tokens = sections["intro"]!.tokens;
    expect(
      tokens.some((t) => t.type === "expr" && t.value === "character.name"),
    ).toBe(true);
  });

  test("intro tokens include info for character hp", () => {
    const sections = engine.dialogue.get("example")!;
    const tokens = sections["intro"]!.tokens;
    expect(
      tokens.some((t) => t.type === "info" && t.value === "character.hp"),
    ).toBe(true);
  });

  test("intro has a page break", () => {
    const sections = engine.dialogue.get("example")!;
    const tokens = sections["intro"]!.tokens;
    expect(tokens.some((t) => t.type === "page")).toBe(true);
  });
});
