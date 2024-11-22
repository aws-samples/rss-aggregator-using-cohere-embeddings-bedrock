import { BedrockRuntime } from "@aws-sdk/client-bedrock-runtime";
import { Embedding } from "../types/Embedding";

const bedrock = new BedrockRuntime();

export class BedrockClient {
  async getEmbeddings(
    text: string,
    embeddingType: "search_document" | "search_query",
  ): Promise<Embedding> {
    const bedrockInvoke = await bedrock.invokeModel({
      modelId: "cohere.embed-english-v3",
      body: JSON.stringify({ texts: [text], input_type: embeddingType }),
      contentType: "application/json",
    });

    const response = new TextDecoder().decode(bedrockInvoke.body);

    return JSON.parse(response).embeddings![0];
  }
}

export const bedrockClient = new BedrockClient();
