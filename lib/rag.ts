import rawChunks from "./knowledge/chunks.json";

export type Chunk = { source: string; idx: number; text: string };

const chunks = rawChunks as Chunk[];

// Common Hebrew prefixes we strip so "המע\"מ" also matches "מע\"מ" etc.
const PREFIXES_1 = ["ש", "ה", "ו", "ב", "ל", "כ", "מ"];
const PREFIXES_2 = [
  "וה",
  "בה",
  "לה",
  "כה",
  "שה",
  "מה",
  "וב",
  "ול",
  "ומ",
  "וכ",
  "וש",
  "כש",
  "שכ",
];

// Character classification via code point ranges — avoids any bundler regex mangling.
function isHebrew(cp: number): boolean {
  return cp >= 0x0590 && cp <= 0x05ff;
}
function isDigit(cp: number): boolean {
  return cp >= 0x30 && cp <= 0x39;
}
function isAsciiLetter(cp: number): boolean {
  return (cp >= 0x41 && cp <= 0x5a) || (cp >= 0x61 && cp <= 0x7a);
}
function isTokenChar(cp: number): boolean {
  // Hebrew letters, ASCII letters, digits, and the quote characters used in Hebrew acronyms
  return (
    isHebrew(cp) ||
    isAsciiLetter(cp) ||
    isDigit(cp) ||
    cp === 0x22 /* " */ ||
    cp === 0x27 /* ' */ ||
    cp === 0x05f4 /* gershayim ״ */ ||
    cp === 0x05f3 /* geresh ׳ */
  );
}

function tokenize(text: string): string[] {
  const s = text.toLowerCase();
  const rawTokens: string[] = [];
  let buf = "";
  for (const ch of s) {
    const cp = ch.codePointAt(0)!;
    if (isTokenChar(cp)) {
      // Normalize gershayim/geresh to ASCII " and '
      if (cp === 0x05f4) buf += '"';
      else if (cp === 0x05f3) buf += "'";
      else buf += ch;
    } else {
      if (buf) {
        rawTokens.push(buf);
        buf = "";
      }
    }
  }
  if (buf) rawTokens.push(buf);

  const tokens: string[] = [];
  for (let tok of rawTokens) {
    // Strip leading/trailing quotes
    tok = tok.replace(/^["']+|["']+$/g, "");
    if (tok.length < 2) continue;
    tokens.push(tok);
    // Prefix-strip Hebrew tokens
    const firstCp = tok.codePointAt(0);
    if (firstCp !== undefined && isHebrew(firstCp)) {
      for (const p of PREFIXES_2) {
        if (tok.startsWith(p) && tok.length - p.length >= 3) {
          tokens.push(tok.slice(p.length));
          break;
        }
      }
      for (const p of PREFIXES_1) {
        if (tok.startsWith(p) && tok.length - 1 >= 3) {
          tokens.push(tok.slice(1));
          break;
        }
      }
    }
  }
  return tokens;
}

// BM25 index — built once at module load
const K1 = 1.5;
const B_PARAM = 0.75;

const docTFs: Map<string, number>[] = [];
const docLengths: number[] = [];
const df: Map<string, number> = new Map();
const N = chunks.length;

for (const c of chunks) {
  const toks = tokenize(c.text);
  const tf = new Map<string, number>();
  for (const t of toks) tf.set(t, (tf.get(t) ?? 0) + 1);
  docTFs.push(tf);
  docLengths.push(toks.length);
}
const avgDocLen = docLengths.reduce((a, b) => a + b, 0) / Math.max(N, 1);
for (const tf of docTFs) {
  for (const t of tf.keys()) df.set(t, (df.get(t) ?? 0) + 1);
}

function scoreDoc(docIdx: number, queryTokens: Set<string>): number {
  const tf = docTFs[docIdx];
  const dl = docLengths[docIdx];
  let score = 0;
  for (const t of queryTokens) {
    const dfT = df.get(t);
    if (!dfT) continue;
    const tfT = tf.get(t);
    if (!tfT) continue;
    const idf = Math.log((N - dfT + 0.5) / (dfT + 0.5) + 1);
    const norm =
      (tfT * (K1 + 1)) / (tfT + K1 * (1 - B_PARAM + (B_PARAM * dl) / avgDocLen));
    score += idf * norm;
  }
  return score;
}

export function retrieveContext(
  query: string,
  topK = 6,
): { chunks: Chunk[]; context: string } {
  const qToks = new Set(tokenize(query));
  if (qToks.size === 0) return { chunks: [], context: "" };

  const scored: { chunk: Chunk; score: number }[] = [];
  for (let i = 0; i < N; i++) {
    const s = scoreDoc(i, qToks);
    if (s > 0) scored.push({ chunk: chunks[i], score: s });
  }
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, topK).map((s) => s.chunk);

  const context = top
    .map(
      (c, i) =>
        `[מקור ${i + 1} — ${c.source}, קטע ${c.idx + 1}]\n${c.text.trim()}`,
    )
    .join("\n\n---\n\n");

  return { chunks: top, context };
}
