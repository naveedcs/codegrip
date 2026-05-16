export const llmReviewProviders = ["local", "remote"] as const;

export type LlmReviewProvider = (typeof llmReviewProviders)[number];

export type LlmReviewSettings = {
  readonly enabled: boolean;
  readonly provider: LlmReviewProvider;
  readonly endpoint: string;
  readonly model: string;
};

export function isLlmReviewProvider(
  value: unknown
): value is LlmReviewProvider {
  return llmReviewProviders.some((provider) => provider === value);
}
