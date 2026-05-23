import { describe, test, expect, afterAll } from "bun:test";
import { Data, new_data, types, weapon_types, stat_types } from "../src/save_manager/data";
import { xor, save, load } from "../src/save_manager/loader";
import { rmSync } from "node:fs";
import path from "node:path";

const TMP = path.join(import.meta.dir, "tmp_test.save");

afterAll(() => {
  try { rmSync(TMP); } catch {}
});

// ─── xor ─────────────────────────────────────────────────────────────────────

describe("xor", () => {
  test("is its own inverse", () => {
    const original = '{"name":"hero","level":1}';
    expect(xor(xor(original))).toBe(original);
  });

  test("actually transforms the string", () => {
    expect(xor("A")).not.toBe("A");
  });

  test("custom key works and is its own inverse", () => {
    const s = "hello";
    expect(xor(xor(s, 0x1f), 0x1f)).toBe(s);
  });
});

// ─── new_data ─────────────────────────────────────────────────────────────────

describe("new_data", () => {
  test("returns a valid Data instance", () => {
    const d = new_data("Hero");
    expect(d.valid).toBe(true);
  });

  test("name is set correctly", () => {
    const d = new_data("Alice");
    expect((d as any).name).toBe("Alice");
  });

  test("has correct default numeric fields", () => {
    const d = new_data("Hero") as any;
    expect(d.level).toBe(1);
    expect(d.xp).toBe(0);
    expect(d.hp).toBe(20);
    expect(d.max_hp).toBe(20);
  });

  test("has fists weapon by default", () => {
    const d = new_data("Hero") as any;
    expect(d.weapons?.fists).toBeDefined();
    expect(d.weapons.fists.name).toBe("fists");
    expect(d.weapons.fists.min_dmg).toBe(1);
    expect(d.weapons.fists.max_dmg).toBe(3);
  });

  test("has correct default stats", () => {
    const d = new_data("Hero") as any;
    expect(d.stats.strength).toBe(1);
    expect(d.stats.agility).toBe(1);
    expect(d.stats.defence).toBe(1);
  });

  test("filelocation defaults to empty string", () => {
    const d = new_data("Hero") as any;
    expect(d.filelocation).toBe("");
  });
});

// ─── Data constructor – valid inputs ─────────────────────────────────────────

describe("Data – valid inputs", () => {
  test("fully valid object is valid", () => {
    const d = new Data({
      name: "Hero",
      level: 1,
      xp: 0,
      hp: 20,
      max_hp: 20,
      weapons: { sword: { name: "sword", min_dmg: 5, max_dmg: 10 } },
      stats: { strength: 2, agility: 3, defence: 1 },
      filelocation: "",
    });
    expect(d.valid).toBe(true);
  });

  test("multiple weapons are all validated", () => {
    const d = new Data({
      name: "Hero",
      level: 1,
      xp: 0,
      hp: 20,
      max_hp: 20,
      weapons: {
        sword: { name: "sword", min_dmg: 5, max_dmg: 10 },
        bow:   { name: "bow",   min_dmg: 2, max_dmg: 8 },
      },
      stats: { strength: 1, agility: 1, defence: 1 },
      filelocation: "",
    });
    expect(d.valid).toBe(true);
  });
});

// ─── Data constructor – invalid inputs ───────────────────────────────────────

describe("Data – invalid inputs", () => {
  test("wrong type for name sets valid=false", () => {
    const d = new Data({
      name: 123,
      level: 1, xp: 0, hp: 20, max_hp: 20,
      weapons: {}, stats: { strength: 1, agility: 1, defence: 1 },
      filelocation: "",
    });
    expect(d.valid).toBe(false);
  });

  test("wrong type for level sets valid=false", () => {
    const d = new Data({
      name: "Hero",
      level: "one",
      xp: 0, hp: 20, max_hp: 20,
      weapons: {}, stats: { strength: 1, agility: 1, defence: 1 },
      filelocation: "",
    });
    expect(d.valid).toBe(false);
  });

  test("weapon with wrong min_dmg type sets valid=false", () => {
    const d = new Data({
      name: "Hero",
      level: 1, xp: 0, hp: 20, max_hp: 20,
      weapons: { sword: { name: "sword", min_dmg: "five", max_dmg: 10 } },
      stats: { strength: 1, agility: 1, defence: 1 },
      filelocation: "",
    });
    expect(d.valid).toBe(false);
  });

  test("weapon missing a required prop sets valid=false", () => {
    const d = new Data({
      name: "Hero",
      level: 1, xp: 0, hp: 20, max_hp: 20,
      weapons: { sword: { name: "sword", min_dmg: 5 /* max_dmg missing */ } },
      stats: { strength: 1, agility: 1, defence: 1 },
      filelocation: "",
    });
    expect(d.valid).toBe(false);
  });

  test("stat with wrong type sets valid=false", () => {
    const d = new Data({
      name: "Hero",
      level: 1, xp: 0, hp: 20, max_hp: 20,
      weapons: {},
      stats: { strength: "high", agility: 1, defence: 1 },
      filelocation: "",
    });
    expect(d.valid).toBe(false);
  });

  test("stat missing a required field sets valid=false", () => {
    const d = new Data({
      name: "Hero",
      level: 1, xp: 0, hp: 20, max_hp: 20,
      weapons: {},
      stats: { strength: 1, agility: 1 /* defence missing */ },
      filelocation: "",
    });
    expect(d.valid).toBe(false);
  });

  test("empty object {} is not valid (missing all required fields)", () => {
    const d = new Data({});
    expect(d.valid).toBe(false);
  });
});

// ─── save / load roundtrip ────────────────────────────────────────────────────

describe("save / load roundtrip", () => {
  test("load returns null for a missing file", async () => {
    expect(await load("/nonexistent/path/file.save")).toBeNull();
  });

  test("load returns null for a corrupted file", async () => {
    await Bun.write(TMP, "this is not xor encoded json !!!@@@");
    expect(await load(TMP)).toBeNull();
  });

  test("saved data can be loaded back as a valid Data object", async () => {
    const original = new_data("Hero");
    await save(original, TMP);
    const raw = await load(TMP);
    expect(raw).not.toBeNull();
    const loaded = new Data(raw);
    expect(loaded.valid).toBe(true);
  });

  test("loaded data has the same name as the original", async () => {
    const original = new_data("Roundtrip");
    await save(original, TMP);
    const raw = await load(TMP);
    const loaded = new Data(raw) as any;
    expect(loaded.name).toBe("Roundtrip");
  });

  test("filelocation is updated to destination on first save", async () => {
    const original = new_data("Hero");
    await save(original, TMP);
    const raw = await load(TMP);
    expect(raw.filelocation).toBe(TMP);
  });

  test("filelocation is preserved on subsequent saves", async () => {
    const original = new_data("Hero");
    await save(original, TMP);
    const raw = await load(TMP);
    const loaded = new Data(raw);
    const TMP2 = TMP + ".bak";
    await save(loaded, TMP2);
    const raw2 = await load(TMP2);
    expect(raw2.filelocation).toBe(TMP);
    try { rmSync(TMP2); } catch {}
  });

  test("saved file does not contain 'valid' or 'data' keys", async () => {
    const original = new_data("Hero");
    await save(original, TMP);
    const raw = await load(TMP);
    expect(raw).not.toHaveProperty("valid");
    expect(raw).not.toHaveProperty("data");
  });
});
