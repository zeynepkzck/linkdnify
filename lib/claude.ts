import Anthropic from "@anthropic-ai/sdk";

/** Haiku 5.5 is the cheapest current model and handles reading certificates and short posts well. */
export const MODEL = process.env.CLAUDE_MODEL || "claude-haiku-5-5";

/** Models that accept the server-side `fallbacks: "default"` re-run when they decline a request. */
const FALLBACK_MODELS = ["claude-opus-5-5", "claude-opus-5", "claude-fable-5-1", "claude-sonnet-5-5"];

export function withFallback(): { betas?: Anthropic.Beta.AnthropicBeta[]; fallbacks?: "default" } {
  if (!FALLBACK_MODELS.includes(MODEL)) return {};
  return { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" };
}

let client: Anthropic | null = null;

export function getClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) return null;
  client ??= new Anthropic();
  return client;
}

/** Maps SDK errors to a status code and a message the visitor can act on. */
export function describeError(error: unknown): { status: number; message: string } {
  if (error instanceof Anthropic.RateLimitError) {
    return { status: 429, message: "Şu an çok yoğunuz. Bir dakika sonra tekrar dene." };
  }
  if (error instanceof Anthropic.BadRequestError) {
    return { status: 400, message: "Bu dosya işlenemedi. Daha net bir görsel ya da PDF dene." };
  }
  if (error instanceof Anthropic.AuthenticationError) {
    return { status: 503, message: "Yapay zekâ servisi yapılandırılmamış." };
  }
  if (error instanceof Anthropic.APIError) {
    return { status: 502, message: "Yapay zekâ servisine ulaşılamadı. Tekrar dene." };
  }
  return { status: 500, message: "Beklenmeyen bir hata oldu. Tekrar dene." };
}
