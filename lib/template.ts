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
export function templatePost({ certificate: c, story: s, style }: GenerateRequest): string {
  const en = style.lang === "en";
  const em = style.emoji === "some";
  const tags = [...c.skills, c.issuer.split("·")[0].trim()]
    .filter(Boolean)
    .slice(0, style.hashtags)
    .map(toTag)
    .join(" ");
  const bullets = c.skills.slice(0, 3).map((x) => (em ? "▸ " : "– ") + x);
  const L: string[] = [];

  if (en) {
    L.push(style.tone === "story" && s.why ? s.why : `I just completed the ${c.name}${c.issuer ? ` (${c.issuer})` : ""}.`);
    if (style.tone !== "short") {
      if (style.tone !== "story" && s.why) L.push("", "Why: " + s.why);
      if (s.learned) L.push("", s.learned);
      if (bullets.length) L.push("", "What I'll keep using:", ...bullets);
      if (s.thanks) L.push("", "Thanks to " + s.thanks + (em ? " 🙏" : "."));
    }
    L.push("", "What's one skill you picked up this year that changed how you work?");
  } else {
    L.push(
      style.tone === "story" && s.why
        ? s.why
        : `${c.name} programını tamamladım${c.issuer ? ` (${c.issuer})` : ""}${em ? " 🎓" : "."}`,
    );
    if (style.tone !== "short") {
      if (style.tone !== "story" && s.why) L.push("", "Neden? " + s.why);
      if (style.tone === "story") L.push("", `Bu yüzden ${c.name} programına başladım ve ${monthLabel(c.date, "tr") || "bu ay"} tamamladım.`);
      if (s.learned) L.push("", s.learned);
      if (bullets.length) L.push("", "Bundan sonra işimde kullanacaklarım:", ...bullets);
      if (s.thanks) L.push("", "Teşekkürler: " + s.thanks + (em ? " 🙏" : ""));
    }
    L.push("", "Senin bu yıl öğrendiğin ve çalışma şeklini değiştiren bir beceri var mı?");
  }
  if (tags) L.push("", tags);
  return L.join("\n");
}
