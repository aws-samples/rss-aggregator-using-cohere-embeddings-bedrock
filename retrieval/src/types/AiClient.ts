export type Embedding = Array<number>;
export interface AiClient {
  getEmbeddings(
    text: string,
    embed: "search_document" | "search_query" | "classification" | "clustering",
  ): Promise<Embedding>;
  summarizeText(text: string): Promise<string>;
  tokenLimit: number;
  embeddingLimit: number;
}
