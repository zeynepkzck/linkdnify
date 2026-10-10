import Anthropic from "@anthropic-ai/sdk";

export const MODEL = process.env.CLAUDE_MODEL || "claude-opus-5-5";

/** Server-side fallback when the model declines; routed by refusal category. */
export function withFallback() {
  return {
    betas: ["server-side-fallback-2026-07-01"] as Anthropic.Beta.AnthropicBeta[],
    fallbacks: "default" as const,
  };
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
