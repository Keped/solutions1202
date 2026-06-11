export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface LLMProvider {
  generateResponse(messages: ChatMessage[], systemPrompt?: string): Promise<string>;
}

export interface EmbeddingProvider {
  getEmbedding(text: string): Promise<number[]>;
}
