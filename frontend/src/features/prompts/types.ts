export interface PromptVariable {
  name: string;
  label?: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
}

export interface Prompt {
  id: number;
  userId: number;
  title: string;
  content: string;
  tags: { id?: number; name: string }[];
  variables: PromptVariable[];
}

export interface PromptPayload {
  title: string;
  content: string;
  tags?: string[];
  variables?: PromptVariable[];
}

