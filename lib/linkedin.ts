export const FOLD = 210;
export const MAX_CHARS = 3000;

/** Opens LinkedIn's composer with the text filled in. Undocumented by LinkedIn; images can't be attached this way. */
export function shareUrl(text: string): string {
  return "https://www.linkedin.com/feed/?shareActive=true&text=" + encodeURIComponent(text);
}

/** Official "Add to profile" link for the Licenses & certifications section. */
export function addToProfileUrl(c: { name: string; issuer: string; date: string; url: string; certId: string }): string {
  const p = new URLSearchParams({ startTask: "CERTIFICATION_NAME", name: c.name });
  if (c.issuer) p.set("organizationName", c.issuer);
  const [y, m] = c.date ? c.date.split("-") : [];
  if (y) p.set("issueYear", y);
  if (m) p.set("issueMonth", String(Number(m)));
  if (c.url) p.set("certUrl", c.url);
  if (c.certId) p.set("certId", c.certId);
  return "https://www.linkedin.com/profile/add?" + p.toString();
}

export type Check = { level: "ok" | "warn" | "bad"; text: string };

export function reviewPost(text: string, hasStory: boolean): { hookLength: number; checks: Check[] } {
  const firstBreak = text.indexOf("\n\n");
  const hookLength = firstBreak === -1 ? text.length : firstBreak;
  const tagCount = (text.match(/(^|\s)#[\p{L}\p{N}_]+/gu) || []).length;
  const lastLine =
    text
      .trim()
      .split("\n")
      .filter((l) => l.trim() && !l.trim().startsWith("#"))
      .pop() || "";
  const hasLink = /https?:\/\/|www\./i.test(text);
  const cliche = /^(çok mutluyum|mutluyum|heyecanla|gururla|i'?m (thrilled|happy|excited|pleased|proud))/i.test(text.trim());
  const endsWithQuestion = /\?\s*$/.test(lastLine);

  const checks: Check[] = [
    hookLength <= FOLD
      ? { level: "ok", text: "Giriş, \"daha fazla\" kesiminden önce bitiyor." }
      : { level: "warn", text: `İlk paragraf ${hookLength} karakter; ${FOLD}'un altına indir.` },
    cliche
      ? { level: "warn", text: "Klişe bir açılış var; somut bir sonuçla başlamayı dene." }
      : { level: "ok", text: "Açılış klişe değil." },
    hasStory
      ? { level: "ok", text: "Kişisel detay var; metin şablon gibi durmaz." }
      : { level: "warn", text: "Kişisel detay yok; \"Senin hikâyen\" alanlarını doldur." },
    hasLink
      ? { level: "bad", text: "Gövdede link var; ilk yoruma taşı." }
      : { level: "ok", text: "Gövdede dış link yok." },
    tagCount <= 5
      ? { level: "ok", text: `${tagCount} hashtag.` }
      : { level: "warn", text: `${tagCount} hashtag; 3-5 yeterli.` },
    endsWithQuestion
      ? { level: "ok", text: "Bir soruyla bitiyor; yorum davet ediyor." }
      : { level: "warn", text: "Sonda bir soru yok; yorum gelmesi zorlaşır." },
    text.length <= MAX_CHARS
      ? { level: "ok", text: "LinkedIn'in 3.000 karakter sınırı içinde." }
      : { level: "bad", text: "3.000 karakter sınırını aşıyor." },
  ];
  return { hookLength, checks };
}
