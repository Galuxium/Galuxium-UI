export type Role = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string; // uuid
  role: Role;
  content: string;
  createdAt?: string;
  tokens?: number;
}

export interface ModelProfile {
  slug: string;
  name: string;
  model:string;
  description?: string;
  system_prompt: string;
  example_messages?: Array<{ role: Role; content: string }>;
}
