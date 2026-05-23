// XOR made using the assistance of AI
export function xor(s: string, k = 0x5a) {
  return [...s].map((c) => String.fromCharCode(c.charCodeAt(0) ^ k)).join("");
}

export async function save(data: any, destination: string) {
  const payload =
    data.filelocation === ""
      ? { ...data, filelocation: destination }
      : { ...data };
  const xored = xor(JSON.stringify(payload));
  await Bun.write(destination, xored);
}

export async function load(source: string) {
  try {
    const xored = await Bun.file(source).text();
    const json = xor(xored);
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}
