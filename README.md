# Linkdnify

Sertifikanı yükle, birkaç cümleyle hikâyeni anlat; LinkedIn'e hazır bir paylaşım metni al.

- Sertifika görseli ya da PDF'i Claude ile okunur (ad, kurum, tarih, doğrulama linki, beceriler).
- Kullanıcının kendi cümleleriyle, seçtiği ton ve dilde gönderi yazılır; LinkedIn akışındaki görünümü ve bir kontrol listesi gösterilir.
- "LinkedIn'de paylaş" LinkedIn'i metin hazır açar (görseli kullanıcı ekler). "Profilime ekle" sertifikayı resmî Add to Profile linkiyle profile ekletir.
- Yapay zekâ servisi yoksa metin hazır bir şablonla üretilir.

## Çalıştırma

```bash
npm install
cp .env.example .env.local   # ANTHROPIC_API_KEY değerini doldur
npm run dev                  # http://localhost:3000
```

## Yapı

| Yol | Ne yapar |
|---|---|
| `app/Studio.tsx` | Arayüz: yükleme, form, önizleme, paylaşım butonları |
| `app/api/extract/route.ts` | Sertifikayı okur (görsel/PDF, en fazla 8 MB), yapılandırılmış JSON döner |
| `app/api/generate/route.ts` | Gönderi metnini akış (stream) olarak üretir |
| `lib/prompt.ts` | Yazım kuralları ve istemler |
| `lib/linkedin.ts` | Paylaşım / profile ekleme linkleri, gönderi kontrolleri |
| `lib/rateLimit.ts` | IP başına basit istek sınırı (tek sunucu için; trafik artınca Redis'e taşı) |

## Yayına alma (Vercel)

1. Repoyu Vercel'e bağla (Framework: Next.js, ek ayar gerekmez).
2. Environment Variables: `ANTHROPIC_API_KEY` (zorunlu), isteğe bağlı `CLAUDE_EXTRACT_MODEL` (sertifika okuma, varsayılan `claude-haiku-5-5`) ve `CLAUDE_WRITER_MODEL` (metin yazma, varsayılan `claude-sonnet-5-5`).
3. Deploy.

Yüklenen dosyalar saklanmaz; yalnızca okuma isteğinde Claude'a gönderilir.
