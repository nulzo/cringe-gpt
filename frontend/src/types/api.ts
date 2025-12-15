export type AuthResponse = {
  username: string;
  email: string;
  token: string;
};

export type ModelPricingDto = {
  // Core pricing fields
  promptCostPerMillionTokens: number;
  completionCostPerMillionTokens: number;

  // Optional enhanced pricing fields
  cachedInputCostPerMillionTokens?: number;
  imageInputCostPerMillionTokens?: number;
  imageOutputCostPerMillionTokens?: number;
  audioInputCostPerMillionTokens?: number;
  audioOutputCostPerMillionTokens?: number;
  embeddingCostPerThousandTokens?: number;
  trainingCostPerMillionTokens?: number;
  trainingCostPerHour?: number;
  requestCost?: number;
  webSearchCost?: number;

  // Metadata fields
  lastUpdated?: string;
  notes?: string;
  isDynamic?: boolean;
  currency?: string;
};

export type ModelToolingDto = {
  supportsChat: boolean;
  supportsImages: boolean;
  supportsEmbeddings: boolean;
  supportsAudio: boolean;
  supportsVision: boolean;
  supportsVideo?: boolean;
  supportsTools?: boolean;
  supportsFunctionCalling?: boolean;
  supportsStructuredOutputs?: boolean;
  supportsStreaming?: boolean;
  supportsFineTuning?: boolean;
  supportsBatchProcessing?: boolean;
  supportsModeration?: boolean;
  supportsRealtime?: boolean;
  supportsWebSearch?: boolean;
  supportsCodeExecution?: boolean;

  // Advanced capabilities
  supportedModalities?: string[];
  supportedParameters?: string[];
  instructionFormat?: string;
  tokenizerType?: string;

  // Performance characteristics
  isOptimizedForSpeed?: boolean;
  isOptimizedForQuality?: boolean;
  isExperimental?: boolean;
  isDeprecated?: boolean;

  // Additional computed properties
  performanceTier?: string;
  useCase?: string;
};

export type ModelResponse = {
  id: string;
  name: string;
  provider: string;
  description?: string;
  contextLength: number;
  modifiedAt: string; // or Date, depending on how you parse it
  createdAt: string; // or Date
  size: number;
  sizeDisplay?: string; // Human-readable size (e.g., "4.2 GB")
  architecture?: string;
  family?: string;
  parameterSize?: string;
  quantizationLevel?: string;
  maxCompletionTokens?: number;
  version?: string;
  baseModel?: string;
  isAvailable?: boolean;
  isDefault?: boolean;
  isExperimental?: boolean;
  isDeprecated?: boolean;
  deprecationMessage?: string;
  recommendedAlternative?: string;
  tooling: ModelToolingDto;
  pricing: ModelPricingDto;

  // Computed properties
  displayName?: string;
  fullName?: string;
  hasPricing?: boolean;
  isFree?: boolean;

  // Performance indicators
  performanceTier?: string;
  useCase?: string;
  tags?: string[];
};
