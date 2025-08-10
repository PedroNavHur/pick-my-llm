import { UIMessage } from "ai";

// Define your custom message type with data part schemas
export type RouterUIMessage = UIMessage<
  never, // metadata type
  {
    llmmodel: {
      name: string;
      provider: string;
    };
  } // data parts type
>;
