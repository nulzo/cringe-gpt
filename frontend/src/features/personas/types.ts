import type { ProviderType } from "@/features/chat/types";

export interface PersonaParameters {
  temperature?: number | null;
  topP?: number | null;
  topK?: number | null;
  maxTokens?: number | null;
  isTemporary?: boolean | null;
}

export interface Persona {
  id: number;
  name: string;
  description?: string | null;
  instructions: string;
  avatar?: string | null;
  provider: ProviderType;
  model: string;
  parameters: PersonaParameters;
}

export interface PersonaPayload {
  name: string;
  description?: string;
  instructions: string;
  avatar?: string | null;
  provider?: ProviderType;
  model?: string;
  parameters?: PersonaParameters;
}
