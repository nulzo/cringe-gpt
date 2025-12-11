export type ProviderType = 'Ollama' | 'OpenAi' | 'Anthropic' | 'OpenRouter' | 'Google';

export interface Tag {
    id: number;
    name: string;
}

export interface Citation {
    chunk_id: string;
    knowledge_id: string;
    text: string;
    metadata?: {
        source?: string;
        page?: number;
        row?: number;
        citation?: string;
    };
}

export interface ToolCall {
    id: string;
    type: string;
    function: {
        name: string;
        arguments: string;
    };
    result?: any;
}

export interface MessageError {
    error_code?: string;
    error_title: string;
    error_description: string;
}

export interface MessageImage {
    type: string;
    image_url: {
        url: string;
    };
    index: number;
}

export interface ProcessedMessageImage {
    id: number;
    name: string;
    url: string;
    mimeType: string;
}

export interface Message {
    id: number | string;
    message_id?: string;
    messageId?: string; // Backend sends camelCase
    parent_message_id?: string;
    parentMessageId?: string; // Backend sends camelCase
    conversation_uuid: string;
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
    createdAt?: string; // Support for both formats
    name?: string;

    // Provider and model info
    provider?: ProviderType;
    model?: string;

    // Metadata
    tokens_used?: number;
    generation_time?: number;
    total_cost?: number;
    finish_reason?: string;

    // User interaction
    is_liked?: boolean;
    isLiked?: boolean; // Backend sends camelCase
    is_hidden?: boolean;
    is_error?: boolean;
    is_interrupted?: boolean;
    isGeneratingImage?: boolean;

    // Rich content
    has_images?: boolean;
    image_ids?: (string | number)[];
    images?: MessageImage[];
    processedImages?: ProcessedMessageImage[]; // Images with proper API URLs from backend
    has_citations?: boolean;
    citations?: Citation[];
    has_tool_calls?: boolean;
    tool_calls?: ToolCall[];
    attachments?: {
        file_name: string;
        file_path: string;
        file_type: string;
    }[];

    // Error handling
    error?: MessageError;
}

export interface ConversationSummary {
    id: number;
    conversation_id: string;
    title: string;
    created_at: string;
    updated_at: string;
    is_pinned?: boolean;
    isPinned?: boolean;
    is_hidden?: boolean;
    isHidden?: boolean;
    provider?: ProviderType;
    tags?: Tag[];
}

export interface Conversation extends ConversationSummary {
    messages: Message[];
    user_id?: number;
    project_id?: number;
    is_fallback?: boolean; // Indicates this is a fallback conversation created client-side
}

// Streaming types
export interface StreamingMessage extends Omit<Message, 'id'> {
    id?: string | number;
    isStreaming?: boolean;
}

// Chat request types
export interface ChatRequest {
    conversationId?: number | string | null;
    message: string;
    model?: string;
    provider?: ProviderType;
    stream?: boolean;
    isTemporary?: boolean;
    temperature?: number;
    topP?: number;
    topK?: number;
    maxTokens?: number;
    systemPrompt?: string;
    personaId?: number;
    promptId?: number;
    promptVariables?: Record<string, string>;
}

// API Response types
export interface MessagesResponse {
    data: Message[];
    has_next_page: boolean;
    next_cursor?: string;
}

export interface ConversationResponse {
    data: Conversation;
}

export interface ConversationsResponse {
    data: ConversationSummary[];
} 