import { readdir } from "node:fs/promises";

export type Token =
  | { type: "text"; value: string }
  | { type: "expr"; value: string } // \E...\ — character image
  | { type: "info"; value: string } // \S...\ — character info/stat
  | { type: "page" }; // \P     — new page
export type Option = { label: string; target: string };
export type Section = { tokens: Token[]; options: Option[] };

export var dialogue = new Map<string, Dict<Section>>();

function tokenize(content: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < content.length) {
    if (content[i] === "\\" && content[i + 1] === "E") {
      const end = content.indexOf("\\", i + 2);
      if (end === -1) break;
      tokens.push({ type: "expr", value: content.slice(i + 2, end).trim() });
      i = end + 1;
    } else if (content[i] === "\\" && content[i + 1] === "S") {
      const end = content.indexOf("\\", i + 2);
      if (end === -1) break;
      tokens.push({ type: "info", value: content.slice(i + 2, end).trim() });
      i = end + 1;
    } else if (content[i] === "\\" && content[i + 1] === "P") {
      tokens.push({ type: "page" });
      i += 2;
    } else {
      const rel = content.slice(i).search(/\\[ESP]/);
      const end = rel === -1 ? content.length : i + rel;
      const chunk = content.slice(i, end);
      if (chunk) tokens.push({ type: "text", value: chunk });
      i = end;
    }
  }

  return tokens;
}

function parse_section(body: string, next_sections: string[]): Section {
  const lines = body.split("\n");
  const option_start = lines.findLastIndex((l) => !l.startsWith("- ")) + 1;

  const text = lines.slice(0, option_start).join("\n");
  const options: Option[] = lines
    .slice(option_start)
    .filter((l) => l.startsWith("- "))
    .map((l, i) => ({
      label: l.slice(2).trim(),
      target: next_sections[i] ?? "",
    }));

  return { tokens: tokenize(text), options };
}

export async function parse_dialogue() {
  for (const file of await readdir(import.meta.dir + "/dialogue", {
    recursive: true,
  })) {
    const content = await Bun.file(
      import.meta.dir + "/dialogue/" + file,
    ).text();
    const sections: Dict<Section> = {};

    const parts = content.split(/^#\s*/m).filter((p) => p.trim());
    const names = parts.map((p) => {
      const nl = p.indexOf("\n");
      return (nl === -1 ? p : p.slice(0, nl)).trim();
    });

    for (let i = 0; i < parts.length; i++) {
      const nl = parts[i]!.indexOf("\n");
      const body = nl === -1 ? "" : parts[i]!.slice(nl + 1);
      sections[names[i]!] = parse_section(body, names.slice(i + 1));
    }

    dialogue.set(
      file
        .split(/[/\\]/)
        .pop()
        ?.replace(/\.[^/.]+$/, "") || "",
      sections,
    );
  }
}

export function render_dialogue(section: Section) {}
