import { type ProviderType } from "@/features/chat/types";

export interface AttachmentDto {
  fileName: string;
  contentType: string;
  base64Data: string;
}

export interface ImageGenerationRequestDto {
  provider: ProviderType;
  prompt: string;
  model?: string;
  n?: number;
  quality?: "standard" | "hd";
  response_format?: "url" | "b64_json";
  size?: "1024x1024" | "1792x1024" | "1024x1792";
  style?: "vivid" | "natural";
  attachments?: AttachmentDto[]; // Add this for image editing
}

export interface ImageDto {
  id: number;
  url: string;
  prompt: string;
  userId: number;
}

export interface ImageGenerationResponseDto {
  assistantMessageContent?: string;
  conversationId?: string;
  images: ImageDto[];
}
