/** The kinds of achievement a visitor can write about, and how each one is asked and written. */
export const KINDS = ["cert", "job", "promotion", "graduation", "award", "project", "talk", "other"] as const;
export type Kind = (typeof KINDS)[number];

type KindSpec = {
  label: string;
  /** Whether a document (certificate, diploma, award) can be uploaded and read. */
  document: boolean;
  title: { label: string; placeholder: string };
  org: { label: string; placeholder: string };
  skills: { label: string; placeholder: string };
  why: string;
  learned: string;
  thanks: string;
  /** Extra writing guidance for this kind, in the writer prompt. */
  guidance: string;
  /** Opening line for the offline template. */
  template: { tr: (title: string, org: string) => string; en: (title: string, org: string) => string };
  question: { tr: string; en: string };
};

const at = (org: string, tr: boolean) => (org ? (tr ? ` (${org})` : ` at ${org}`) : "");

export const KIND_SPECS: Record<Kind, KindSpec> = {
  cert: {
    label: "Sertifika",
    document: true,
    title: { label: "Sertifika adı", placeholder: "Google Data Analytics Professional Certificate" },
    org: { label: "Veren kurum", placeholder: "Google · Coursera" },
    skills: { label: "Öne çıkan beceriler (virgülle)", placeholder: "SQL, Tableau, R" },
    why: "Neden aldın, seni ne motive etti?",
    learned: "Ne öğrendin ya da ne yaptın? (proje, zor bir an, somut bir sonuç)",
    thanks: "Teşekkür etmek istediğin biri var mı?",
    guidance: "Kursu tanıtma; kişinin ne öğrendiğini ve bunu nerede kullanacağını anlat.",
    template: {
      tr: (t, o) => `${t} programını tamamladım${at(o, true)}.`,
      en: (t, o) => `I just completed the ${t}${o ? ` (${o})` : ""}.`,
    },
    question: {
      tr: "Senin bu yıl öğrendiğin ve çalışma şeklini değiştiren bir beceri var mı?",
      en: "What's one skill you picked up this year that changed how you work?",
    },
  },
  job: {
    label: "Yeni iş",
    document: false,
    title: { label: "Pozisyon", placeholder: "Junior Data Analyst" },
    org: { label: "Şirket", placeholder: "Trendyol" },
    skills: { label: "Odaklanacağın alanlar (virgülle)", placeholder: "Veri analizi, A/B testleri" },
    why: "Bu işi neden seçtin, seni ne heyecanlandırıyor?",
    learned: "Buraya gelene kadarki yolculuğun nasıldı? (zorluk, dönüm noktası, önceki deneyim)",
    thanks: "Bu süreçte yanında olan biri var mı? (mentor, eski ekip, işe alım süreci)",
    guidance:
      "Yeni işe başlama duyurusu. Eski işvereni ya da süreci kötüleme. Kişinin bu rolde ne yapacağını ve neyi merak ettiğini anlat; abartılı 'hayalimdeki iş' klişelerinden kaçın.",
    template: {
      tr: (t, o) => `${o ? `${o} ekibine ` : "Yeni bir role "}${t} olarak katıldım.`,
      en: (t, o) => `I'm starting a new position as ${t}${at(o, false)}.`,
    },
    question: {
      tr: "Yeni bir işe başlarken ilk ay için en iyi tavsiyen ne olurdu?",
      en: "What's your best advice for the first month in a new role?",
    },
  },
  promotion: {
    label: "Terfi",
    document: false,
    title: { label: "Yeni unvan", placeholder: "Senior Product Designer" },
    org: { label: "Şirket", placeholder: "Getir" },
    skills: { label: "Yeni sorumlulukların (virgülle)", placeholder: "Ekip liderliği, tasarım sistemi" },
    why: "Bu adım senin için ne anlama geliyor?",
    learned: "Buraya getiren ne oldu? (bir proje, bir sonuç, öğrendiğin bir ders)",
    thanks: "Kime teşekkür etmek istersin? (yöneticin, ekibin)",
    guidance: "Terfi duyurusu. Övünme gibi durmasın; başarıyı ekiple paylaş ve öğrenileni öne çıkar.",
    template: {
      tr: (t, o) => `Yeni rolüm: ${t}${at(o, true)}.`,
      en: (t, o) => `I've been promoted to ${t}${at(o, false)}.`,
    },
    question: {
      tr: "Kariyerinde seni en çok büyüten şey ne oldu?",
      en: "What helped you grow the most in your career?",
    },
  },
  graduation: {
    label: "Mezuniyet",
    document: true,
    title: { label: "Bölüm / derece", placeholder: "Bilgisayar Mühendisliği, Lisans" },
    org: { label: "Okul", placeholder: "ODTÜ" },
    skills: { label: "Öne çıkan dersler ya da beceriler (virgülle)", placeholder: "Makine öğrenmesi, Veri yapıları" },
    why: "Bu dönem senin için neydi? (zorluklar, seni sen yapan anlar)",
    learned: "Neyle gurur duyuyorsun? (bitirme projesi, kulüp, staj, bir ders)",
    thanks: "Kime teşekkür etmek istersin? (aile, hoca, arkadaşlar)",
    guidance: "Mezuniyet paylaşımı. Duygusal olabilir ama somut kalsın; sonraki adımı (iş arayışı, yüksek lisans) belirtmek iyi olur.",
    template: {
      tr: (t, o) => `Mezun oldum: ${t}${at(o, true)}.`,
      en: (t, o) => `I graduated with a degree in ${t}${o ? ` from ${o}` : ""}.`,
    },
    question: {
      tr: "Mezun olduğunda keşke bilseydim dediğin bir şey var mı?",
      en: "What do you wish you had known when you graduated?",
    },
  },
  award: {
    label: "Ödül / yarışma",
    document: true,
    title: { label: "Ödül ya da derece", placeholder: "Hackathon birinciliği" },
    org: { label: "Etkinlik / kurum", placeholder: "Teknofest 2026" },
    skills: { label: "Kullandığınız teknolojiler ya da beceriler (virgülle)", placeholder: "React, Python" },
    why: "Ne yaptınız, hangi problemi çözdünüz?",
    learned: "Süreçte ne oldu? (zor bir an, öğrendiğin bir şey)",
    thanks: "Ekip arkadaşların ya da destek olanlar kim?",
    guidance: "Ödül/yarışma paylaşımı. Ekip arkadaşlarını isimleriyle an; projenin çözdüğü problemi tek cümlede anlat.",
    template: {
      tr: (t, o) => `Güzel bir haber: ${t}${at(o, true)}.`,
      en: (t, o) => `We won ${t}${o ? ` at ${o}` : ""}.`,
    },
    question: {
      tr: "Sen hiç böyle bir yarışmaya katıldın mı?",
      en: "Have you ever taken part in a competition like this?",
    },
  },
  project: {
    label: "Proje / lansman",
    document: false,
    title: { label: "Proje adı", placeholder: "Linkdnify" },
    org: { label: "Ekip / şirket (isteğe bağlı)", placeholder: "" },
    skills: { label: "Kullandığın teknolojiler (virgülle)", placeholder: "Next.js, Claude API" },
    why: "Proje ne yapıyor, hangi problemi çözüyor?",
    learned: "Yaparken ne öğrendin ya da ne zordu?",
    thanks: "Teşekkür etmek istediğin biri var mı?",
    guidance: "Proje/lansman paylaşımı. Ne yaptığını tek cümlede anlat; link ilk yoruma gidecek, okuru denemeye davet et.",
    template: {
      tr: (t) => `${t} yayında.`,
      en: (t) => `${t} is live.`,
    },
    question: {
      tr: "Denersen ilk izlenimini yorumlarda duymak isterim, sence ne eksik?",
      en: "If you try it, I'd love your first impression. What's missing?",
    },
  },
  talk: {
    label: "Konuşma / etkinlik",
    document: false,
    title: { label: "Konuşmanın başlığı", placeholder: "Veriyle hikâye anlatmak" },
    org: { label: "Etkinlik", placeholder: "DevFest İstanbul" },
    skills: { label: "Konular (virgülle)", placeholder: "Veri görselleştirme" },
    why: "Neyi anlattın, ana fikir neydi?",
    learned: "Dinleyicilerden ya da hazırlıktan ne öğrendin?",
    thanks: "Teşekkür etmek istediğin organizatör ya da kişiler var mı?",
    guidance: "Konuşma/etkinlik paylaşımı. Konuşmanın ana fikrini bir cümlede ver; salondan bir an ya da soru ilgi çeker.",
    template: {
      tr: (t, o) => `"${t}" başlıklı bir konuşma yaptım${at(o, true)}.`,
      en: (t, o) => `I gave a talk titled "${t}"${o ? ` at ${o}` : ""}.`,
    },
    question: {
      tr: "Bu konuda sen olsan neyi merak ederdin?",
      en: "What would you have asked about this topic?",
    },
  },
  other: {
    label: "Diğer",
    document: true,
    title: { label: "Başarı", placeholder: "İlk maratonumu tamamladım" },
    org: { label: "Kurum / etkinlik (isteğe bağlı)", placeholder: "" },
    skills: { label: "İlgili beceriler ya da konular (virgülle)", placeholder: "" },
    why: "Bu senin için neden önemli?",
    learned: "Ne öğrendin ya da ne yaptın?",
    thanks: "Teşekkür etmek istediğin biri var mı?",
    guidance: "Kişisel bir başarı. Profesyonel bir ders ya da bağlantı kurmaya çalış ama zorlama.",
    template: {
      tr: (t) => `${t}.`,
      en: (t) => `${t}.`,
    },
    question: {
      tr: "Senin bu yıl gurur duyduğun bir şey ne?",
      en: "What's something you're proud of this year?",
    },
  },
};
