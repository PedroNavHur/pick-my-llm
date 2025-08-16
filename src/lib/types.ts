import { UIMessage } from "ai";

// Define your custom message type with data part schemas
export type RouterUIMessage = UIMessage<
  { preference?: "intelligence" | "speed" | "price" }, // metadata type
  {
    llmmodel: {
      name: string;
      provider: string;
    };
    usage: {
      inputTokens: number;
      outputTokens: number;
    };
  } // data parts type
>;
