import { z } from "zod";

export const TONES = ["pro", "warm", "story", "short"] as const;
export const LANGS = ["tr", "en"] as const;
export const EMOJI = ["some", "none"] as const;

export type Tone = (typeof TONES)[number];
export type Lang = (typeof LANGS)[number];
export type EmojiLevel = (typeof EMOJI)[number];

/** What the visitor typed or what we read off the certificate. */
export const CertificateSchema = z.object({
  name: z.string().trim().min(1).max(200),
  issuer: z.string().trim().max(200).default(""),
  date: z.string().regex(/^(\d{4}-\d{2})?$/).default(""),
  skills: z.array(z.string().trim().max(60)).max(8).default([]),
});

export const StorySchema = z.object({
  why: z.string().trim().max(600).default(""),
  learned: z.string().trim().max(800).default(""),
  thanks: z.string().trim().max(200).default(""),
});

export const StyleSchema = z.object({
  tone: z.enum(TONES).default("pro"),
  lang: z.enum(LANGS).default("tr"),
  emoji: z.enum(EMOJI).default("some"),
  hashtags: z.number().int().min(0).max(5).default(3),
});

export const GenerateRequestSchema = z.object({
  certificate: CertificateSchema,
  story: StorySchema,
  style: StyleSchema,
});
export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;

/** Shape Claude returns when it reads a certificate. */
export const ExtractedSchema = z.object({
  name: z.string(),
  issuer: z.string(),
  issueYear: z.number().int().nullable(),
  issueMonth: z.number().int().nullable(),
  credentialId: z.string().nullable(),
  credentialUrl: z.string().nullable(),
  skills: z.array(z.string()),
  isCertificate: z.boolean(),
});
export type Extracted = z.infer<typeof ExtractedSchema>;
