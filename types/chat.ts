// frontend/app/types/chat.ts
export type AIModel =
  | "gpt-4"
  | "claude-3"
  | "grok-2"
  | "llama-3"
  | "galuxium-hybrid";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  model?: AIModel;
}

export interface ChatState {
  messages: ChatMessage[];
  currentModel: AIModel;
  isStreaming: boolean;
}
