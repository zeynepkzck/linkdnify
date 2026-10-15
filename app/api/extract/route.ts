import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { NextResponse } from "next/server";
import { describeError, getClient, withFallback, EXTRACT_MODEL } from "@/lib/claude";
import { EXTRACT_PROMPT } from "@/lib/prompt";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { ExtractedSchema } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 8 * 1024 * 1024;
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"] as const;
type ImageType = (typeof IMAGE_TYPES)[number];

export async function POST(req: Request) {
  const client = getClient();
  if (!client) {
    return NextResponse.json({ error: "Yapay zekâ servisi yapılandırılmamış." }, { status: 503 });
  }
  if (!rateLimit(`extract:${clientIp(req)}`, 10, 10 * 60_000)) {
    return NextResponse.json({ error: "Çok fazla deneme yaptın. Birkaç dakika sonra tekrar dene." }, { status: 429 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Dosya 8 MB'tan büyük olamaz." }, { status: 413 });
  }
  const isPdf = file.type === "application/pdf";
  if (!isPdf && !IMAGE_TYPES.includes(file.type as ImageType)) {
    return NextResponse.json({ error: "PNG, JPG, WebP ya da PDF yükle." }, { status: 415 });
  }

  const data = Buffer.from(await file.arrayBuffer()).toString("base64");
  const source = isPdf
    ? ({ type: "document", source: { type: "base64", media_type: "application/pdf", data } } as const)
    : ({ type: "image", source: { type: "base64", media_type: file.type as ImageType, data } } as const);

  try {
    const response = await client.beta.messages.parse({
      model: EXTRACT_MODEL,
      max_tokens: 4000,
      ...withFallback(EXTRACT_MODEL),
      output_config: { effort: "low", format: betaZodOutputFormat(ExtractedSchema) },
      messages: [{ role: "user", content: [source, { type: "text", text: EXTRACT_PROMPT }] }],
    });

    if (response.stop_reason === "refusal" || !response.parsed_output) {
      return NextResponse.json({ error: "Bu dosyadan bilgi okunamadı. Alanları elle doldurabilirsin." }, { status: 422 });
    }
    const out = response.parsed_output;
    if (!out.isAchievementDocument) {
      return NextResponse.json({ error: "Bu bir sertifika ya da başarı belgesi gibi görünmüyor." }, { status: 422 });
    }
    return NextResponse.json({
      kind: out.kind,
      title: out.title,
      org: out.org,
      date: out.issueYear ? `${out.issueYear}-${String(out.issueMonth ?? 1).padStart(2, "0")}` : "",
      certId: out.credentialId ?? "",
      url: out.credentialUrl && /^https?:\/\//i.test(out.credentialUrl) ? out.credentialUrl : "",
      skills: out.skills.slice(0, 4),
    });
  } catch (error) {
    const { status, message } = describeError(error);
    console.error("extract failed", error);
    return NextResponse.json({ error: message }, { status });
  }
}
