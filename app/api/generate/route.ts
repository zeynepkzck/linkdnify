import { NextResponse } from "next/server";
import { describeError, getClient, withFallback, MODEL } from "@/lib/claude";
import { buildWriterPrompt, WRITER_SYSTEM } from "@/lib/prompt";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { GenerateRequestSchema } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: Request) {
  const client = getClient();
  if (!client) {
    return NextResponse.json({ error: "Yapay zekâ servisi yapılandırılmamış." }, { status: 503 });
  }
  if (!rateLimit(`generate:${clientIp(req)}`, 20, 10 * 60_000)) {
    return NextResponse.json({ error: "Çok fazla deneme yaptın. Birkaç dakika sonra tekrar dene." }, { status: 429 });
  }

  const parsed = GenerateRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Eksik ya da hatalı bilgi var. Sertifika adını kontrol et." }, { status: 400 });
  }

  const stream = client.beta.messages.stream(
    {
      model: MODEL,
      max_tokens: 8000,
      ...withFallback(),
      output_config: { effort: "medium" },
      system: WRITER_SYSTEM,
      messages: [{ role: "user", content: buildWriterPrompt(parsed.data) }],
    },
    { signal: req.signal },
  );

  // Wait for the first event so connection, auth and rate-limit errors still
  // get a proper status code instead of a broken 200 stream.
  const events = stream[Symbol.asyncIterator]();
  let first: IteratorResult<unknown>;
  try {
    first = await events.next();
  } catch (error) {
    const { status, message } = describeError(error);
    console.error("generate failed", error);
    return NextResponse.json({ error: message }, { status });
  }

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for (let r = first; !r.done; r = await events.next()) {
          const event = r.value as { type: string; delta?: { type: string; text?: string } };
          if (event.type === "content_block_delta" && event.delta?.type === "text_delta" && event.delta.text) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") {
          controller.error(new Error("refusal"));
          return;
        }
        controller.close();
      } catch (error) {
        if (!req.signal.aborted) console.error("generate stream failed", error);
        controller.error(error);
      }
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
