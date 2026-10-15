import { KIND_SPECS } from "./kinds";
import { monthLabel } from "./prompt";
import type { GenerateRequest } from "./types";

function toTag(s: string): string {
  const words = s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ı/g, "i")
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean);
  return "#" + words.map((w) => w[0].toUpperCase() + w.slice(1)).join("");
}

/** Offline fallback used when the AI service is unavailable. */
export function templatePost({ achievement: a, story: s, style }: GenerateRequest): string {
  const spec = KIND_SPECS[a.kind];
  const en = style.lang === "en";
  const em = style.emoji === "some";
  const tags = [...a.skills, a.org.split("·")[0].trim()]
    .filter(Boolean)
    .slice(0, style.hashtags)
    .map(toTag)
    .join(" ");
  const bullets = a.skills.slice(0, 3).map((x) => (em ? "▸ " : "– ") + x);
  const opening = spec.template[en ? "en" : "tr"](a.title, a.org);
  const when = monthLabel(a.date, style.lang);
  const L: string[] = [];

  L.push(style.tone === "story" && s.why ? s.why : opening);
  if (style.tone !== "short") {
    if (style.tone === "story") L.push("", opening + (when ? ` (${when})` : ""));
    else if (s.why) L.push("", s.why);
    if (s.learned) L.push("", s.learned);
    if (bullets.length) L.push("", en ? "What's next for me:" : "Önümüzdeki dönemde odağım:", ...bullets);
    if (s.thanks) L.push("", (en ? "Thank you, " : "Teşekkürler: ") + s.thanks + (em ? " 🙏" : en ? "." : ""));
  }
  L.push("", spec.question[en ? "en" : "tr"]);
  if (tags) L.push("", tags);
  return L.join("\n");
}
