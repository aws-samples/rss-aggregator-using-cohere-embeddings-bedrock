import { AiClient } from "../../../types/AiClient";
import { BedrockClient } from "./bedrock";

export const client: AiClient = new BedrockClient();
