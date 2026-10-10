"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { addToProfileUrl, FOLD, MAX_CHARS, reviewPost, shareUrl } from "@/lib/linkedin";
import { templatePost } from "@/lib/template";
import type { EmojiLevel, GenerateRequest, Lang, Tone } from "@/lib/types";

type Fields = {
  name: string;
  issuer: string;
  date: string;
  url: string;
  certId: string;
  skills: string;
  why: string;
  learned: string;
  thanks: string;
};

const EXAMPLE: Fields = {
  name: "Google Data Analytics Professional Certificate",
  issuer: "Google · Coursera",
  date: "2026-09",
  url: "https://coursera.org/verify/professional-cert/EXAMPLE123",
  certId: "EXAMPLE123",
  skills: "SQL, Tableau, R, Veri temizleme",
  why: "Pazarlama ekibinde raporları hep başkasından bekliyordum, kendi sorularımı kendim cevaplamak istedim.",
  learned:
    "Bitirme projesinde 1,2 milyon satırlık bisiklet paylaşım verisini temizleyip üyeler ile tek seferlik kullanıcıların farkını gösteren bir Tableau panosu hazırladım.",
  thanks: "Haftalık çalışma arkadaşım Elif",
};

const TONES: [Tone, string][] = [
  ["pro", "Profesyonel"],
  ["warm", "Samimi"],
  ["story", "Hikâye"],
  ["short", "Kısa ve öz"],
];
const LANGS: [Lang, string][] = [
  ["tr", "Türkçe"],
  ["en", "English"],
];
const EMOJIS: [EmojiLevel, string][] = [
  ["some", "Ölçülü"],
  ["none", "Hiç"],
];

const ACCEPT = "image/png,image/jpeg,image/webp,application/pdf";

function Chips<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: [T, string][];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="chips" role="group" aria-label={label}>
      {options.map(([v, text]) => (
        <button key={v} className="chip" type="button" aria-pressed={v === value} onClick={() => onChange(v)}>
          {text}
        </button>
      ))}
    </div>
  );
}

export default function Studio() {
  const [f, setF] = useState<Fields>(EXAMPLE);
  const [tone, setTone] = useState<Tone>("pro");
  const [lang, setLang] = useState<Lang>("tr");
  const [emoji, setEmoji] = useState<EmojiLevel>("some");
  const [hashtags, setHashtags] = useState(3);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const [reading, setReading] = useState(false);
  const [readMsg, setReadMsg] = useState<{ text: string; err?: boolean } | null>(null);

  const [post, setPost] = useState(() => templatePost(toRequest(EXAMPLE, "pro", "tr", "some", 3)));
  const [isExample, setIsExample] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [writing, setWriting] = useState(false);
  const [genMsg, setGenMsg] = useState<{ text: string; err?: boolean } | null>(null);
  const [copyMsg, setCopyMsg] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const outRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF((prev) => ({ ...prev, [k]: e.target.value }));

  const review = useMemo(() => reviewPost(post, Boolean(f.why.trim() || f.learned.trim())), [post, f.why, f.learned]);

  async function chooseFile(next: File | undefined) {
    if (!next) return;
    if (!ACCEPT.split(",").includes(next.type)) {
      setReadMsg({ text: "PNG, JPG, WebP ya da PDF yükle.", err: true });
      return;
    }
    if (next.size > 8 * 1024 * 1024) {
      setReadMsg({ text: "Dosya 8 MB'tan büyük olamaz.", err: true });
      return;
    }
    setFile(next);
    setPreview(next.type.startsWith("image/") ? URL.createObjectURL(next) : null);
    await readCertificate(next);
  }

  async function readCertificate(target: File) {
    setReading(true);
    setReadMsg({ text: "Sertifika okunuyor…" });
    try {
      const body = new FormData();
      body.append("file", target);
      const res = await fetch("/api/extract", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Sertifika okunamadı.");
      setF((prev) => ({
        ...prev,
        name: data.name || "",
        issuer: data.issuer || "",
        date: data.date || "",
        url: data.url || "",
        certId: data.certId || "",
        skills: (data.skills || []).join(", "),
        ...(prev.why === EXAMPLE.why ? { why: "", learned: "", thanks: "" } : {}),
      }));
      setReadMsg({ text: "Alanlar dolduruldu. Kontrol et, sonra kendi hikâyeni ekle." });
    } catch (e) {
      setReadMsg({ text: `${(e as Error).message} Alanları elle doldurabilirsin.`, err: true });
    } finally {
      setReading(false);
    }
  }

  async function generate() {
    if (!f.name.trim()) {
      setGenMsg({ text: "Önce sertifika adını yaz.", err: true });
      return;
    }
    const req = toRequest(f, tone, lang, emoji, hashtags);
    setIsExample(false);
    setExpanded(false);
    setWriting(true);
    setGenMsg({ text: "Yazıyor…" });
    const ctl = new AbortController();
    abortRef.current = ctl;
    let text = "";
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
        signal: ctl.signal,
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 503) {
          setPost(templatePost(req));
          setGenMsg({ text: "Yapay zekâ şu an kullanılamıyor; hazır şablonla oluşturuldu." });
          return;
        }
        throw new Error(data.error || "Metin oluşturulamadı.");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setPost(text);
      }
      setPost(text.trim());
      setGenMsg({ text: "Hazır. İstersen düzenle ya da tekrar oluştur." });
    } catch (e) {
      if (ctl.signal.aborted) setGenMsg({ text: "Durduruldu." });
      else setGenMsg({ text: text ? "Bağlantı yarıda kesildi; metin eksik olabilir. Tekrar dene." : (e as Error).message, err: true });
    } finally {
      setWriting(false);
      abortRef.current = null;
    }
  }

  async function copy(text: string, ok: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyMsg(ok);
    } catch {
      outRef.current?.focus();
      outRef.current?.select();
      setCopyMsg("Kopyalanamadı; metin seçildi, Ctrl/Cmd+C ile kopyala.");
    }
  }

  const firstComment = (lang === "en" ? "Credential: " : "Sertifika doğrulama: ") + f.url.trim();
  const folded = !expanded && post.length > FOLD;

  return (
    <div className="grid">
      <section className="panel" aria-labelledby="h-in">
        <h2 id="h-in">1 · Sertifika</h2>
        <div className="step">
          <label
            className={`drop${over ? " over" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(true);
            }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setOver(false);
              chooseFile(e.dataTransfer.files[0]);
            }}
          >
            <div className="thumb">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="Yüklenen sertifika" src={preview} />
              ) : file ? (
                <div className="file-pill">PDF</div>
              ) : (
                <div className="seal">✓</div>
              )}
            </div>
            <div className="drop-text">
              <b>{file ? file.name : "Sertifikanı sürükle ya da seç"}</b>
              <small>PNG, JPG, WebP ya da PDF, en fazla 8 MB. Bilgiler otomatik okunur.</small>
            </div>
            <input type="file" accept={ACCEPT} onChange={(e) => chooseFile(e.target.files?.[0])} disabled={reading} />
          </label>
          {readMsg && <p className={`status${readMsg.err ? " err" : ""}`}>{readMsg.text}</p>}
          <div className="fields">
            <label className="f full">
              Sertifika adı
              <input type="text" value={f.name} onChange={set("name")} maxLength={200} />
            </label>
            <label className="f">
              Veren kurum
              <input type="text" value={f.issuer} onChange={set("issuer")} maxLength={200} />
            </label>
            <label className="f">
              Tarih
              <input type="month" value={f.date} onChange={set("date")} />
            </label>
            <label className="f">
              Doğrulama linki
              <input type="url" value={f.url} onChange={set("url")} placeholder="https://" />
            </label>
            <label className="f">
              Sertifika no
              <input type="text" value={f.certId} onChange={set("certId")} />
            </label>
            <label className="f full">
              Öne çıkan beceriler (virgülle)
              <input type="text" value={f.skills} onChange={set("skills")} />
            </label>
          </div>
        </div>

        <div className="step">
          <h2>2 · Senin hikâyen</h2>
          <p className="hint">Metni şablondan ayıran kısım burası. Bir iki samimi cümle yeter.</p>
          <label className="f">
            Neden aldın, seni ne motive etti?
            <textarea rows={3} value={f.why} onChange={set("why")} maxLength={600} />
          </label>
          <label className="f">
            Ne öğrendin ya da ne yaptın? (proje, zor bir an, somut bir sonuç)
            <textarea rows={3} value={f.learned} onChange={set("learned")} maxLength={800} />
          </label>
          <label className="f">
            Teşekkür etmek istediğin biri var mı?
            <input type="text" value={f.thanks} onChange={set("thanks")} maxLength={200} />
          </label>
        </div>

        <div className="step">
          <h2>3 · Üslup</h2>
          <div className="row">
            <span className="lbl">Ton</span>
            <Chips label="Ton" options={TONES} value={tone} onChange={setTone} />
          </div>
          <div className="row">
            <span className="lbl">Dil</span>
            <Chips label="Dil" options={LANGS} value={lang} onChange={setLang} />
          </div>
          <div className="row">
            <span className="lbl">Emoji</span>
            <Chips label="Emoji" options={EMOJIS} value={emoji} onChange={setEmoji} />
            <span className="lbl">Hashtag</span>
            <input
              type="range"
              min={0}
              max={5}
              value={hashtags}
              onChange={(e) => setHashtags(Number(e.target.value))}
              aria-label="Hashtag sayısı"
            />
            <span className="mono">{hashtags}</span>
          </div>
          <div className="row">
            <button className="btn primary" type="button" onClick={generate} disabled={writing}>
              {isExample ? "Metni oluştur" : "Yeniden oluştur"}
            </button>
            {writing && (
              <button className="btn" type="button" onClick={() => abortRef.current?.abort()}>
                Durdur
              </button>
            )}
            {genMsg && <p className={`status${genMsg.err ? " err" : ""}`}>{genMsg.text}</p>}
          </div>
        </div>
      </section>

      <section className="panel" aria-labelledby="h-out">
        <h2 id="h-out">LinkedIn önizlemesi</h2>
        <article className="post" aria-label="Gönderi önizlemesi">
          <div className="post-head">
            <div className="avatar">Sen</div>
            <div className="who">
              <b>Adın Soyadın</b>
              <small>Unvanın · şimdi · 🌐</small>
            </div>
            {isExample && <span className="badge">ÖRNEK</span>}
          </div>
          <div className="post-body">
            {folded ? (
              <>
                <span className="fold">{post.slice(0, FOLD).trimEnd()}</span>…{" "}
                <button className="more" type="button" onClick={() => setExpanded(true)}>
                  {lang === "en" ? "more" : "daha fazla"}
                </button>
              </>
            ) : (
              <>
                <span className="fold">{post.slice(0, FOLD)}</span>
                {post.slice(FOLD)}
              </>
            )}
          </div>
          <div className="post-img">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="Sertifika görseli" src={preview} />
            ) : (
              <div className="ph">
                <div className="seal">✓</div>
                {file ? "PDF sertifikanı paylaşırken ekle" : "Sertifika görselin burada görünecek"}
              </div>
            )}
          </div>
          <div className="post-foot">
            <span>Beğen</span>
            <span>Yorum yap</span>
            <span>Paylaş</span>
          </div>
        </article>

        <div className="editor">
          <label className="f" htmlFor="out">
            Metni düzenle
          </label>
          <textarea
            id="out"
            ref={outRef}
            value={post}
            onChange={(e) => {
              setPost(e.target.value);
              setIsExample(false);
            }}
          />
          <div className="meter">
            <span className="mono" style={post.length > MAX_CHARS ? { color: "var(--bad)" } : undefined}>
              {post.length.toLocaleString("tr-TR")} / {MAX_CHARS.toLocaleString("tr-TR")}
            </span>
            <span>Giriş: {review.hookLength} karakter (vurgulu kısım &quot;daha fazla&quot;dan önce görünür)</span>
          </div>
        </div>

        <ul className="checks" aria-label="Kontrol listesi">
          {review.checks.map((c) => (
            <li key={c.text} className={c.level}>
              <span className="dot" />
              <span>{c.text}</span>
            </li>
          ))}
        </ul>

        <div className="actions">
          <button className="btn" type="button" onClick={() => copy(post, "Metin kopyalandı.")}>
            Metni kopyala
          </button>
          <a className="btn primary" href={shareUrl(post)} target="_blank" rel="noopener noreferrer">
            LinkedIn&apos;de paylaş
          </a>
          <a
            className="btn"
            href={addToProfileUrl({ name: f.name, issuer: f.issuer, date: f.date, url: f.url.trim(), certId: f.certId })}
            target="_blank"
            rel="noopener noreferrer"
          >
            Profilime ekle
          </a>
        </div>
        {copyMsg && <p className="status">{copyMsg}</p>}

        <div className="callout">
          <div>
            <b>Paylaşmadan önce:</b> LinkedIn metni hazır açar ama görseli ekleyemez. Açılan pencerede sertifikanı
            kendin ekle, teşekkür ettiğin kişileri @ ile etiketle.
          </div>
          {f.url.trim() && (
            <div>
              <b>İlk yorum için:</b> Gövdedeki dış link erişimi düşürür; doğrulama linkini ilk yoruma yaz.
              <div className="first-comment">
                <code>{firstComment}</code>
                <button className="small-btn" type="button" onClick={() => copy(firstComment, "İlk yorum metni kopyalandı.")}>
                  Kopyala
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function toRequest(f: Fields, tone: Tone, lang: Lang, emoji: EmojiLevel, hashtags: number): GenerateRequest {
  return {
    certificate: {
      name: f.name.trim(),
      issuer: f.issuer.trim(),
      date: f.date,
      skills: f.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 8),
    },
    story: { why: f.why.trim(), learned: f.learned.trim(), thanks: f.thanks.trim() },
    style: { tone, lang, emoji, hashtags },
  };
}
