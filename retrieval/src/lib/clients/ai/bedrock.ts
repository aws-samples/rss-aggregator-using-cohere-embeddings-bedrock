import { AiClient, Embedding } from "../../../types/AiClient";
import { SUMMARISE_PROMPT } from "./prompt";
import { BedrockRuntime } from "@aws-sdk/client-bedrock-runtime";

const bedrock = new BedrockRuntime();

export class BedrockClient implements AiClient {
  tokenLimit = 100_000;
  embeddingLimit = 8000;

  _wrapPrompt(prompt: string): string {
    return `\nHuman: ${prompt}\nAssistant:`;
  }

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

  async summarizeText(text: string): Promise<string> {
    const bedrockInvoke = await bedrock.invokeModel({
      modelId: "anthropic.claude-v2",
      body: JSON.stringify({
        max_tokens_to_sample: 8192,
        temperature: 1,
        top_k: 250,
        top_p: 0.999,
        stop_sequences: ["\\n\\Human:"],
        anthropic_version: "bedrock-2023-05-31",
        prompt: this._wrapPrompt(SUMMARISE_PROMPT(text)),
      }),
      contentType: "application/json",
    });

    const response = new TextDecoder().decode(bedrockInvoke.body);

    return JSON.parse(response).completion;
  }
}
