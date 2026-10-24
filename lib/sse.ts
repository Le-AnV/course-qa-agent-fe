export type ChatCitation = {
  index: number;
  kind: "curriculum" | "internet";
  title: string;
  url: string | null;
  snippet: string;
  documentId: string | null;
  page: number | null;
};

export type ChatProgressStage = "searching" | "reading" | "drafting";

export type ChatStreamEvent =
  | { type: "progress"; stage: ChatProgressStage }
  | { type: "token"; text: string }
  | { type: "citation"; citation: ChatCitation }
  | {
      type: "done";
      source: string;
      usedWebSearch: boolean;
      threshold: number;
      topScore: number | null;
      sessionId: string | null;
      userMessageId: string | null;
      assistantMessageId: string | null;
    }
  | { type: "error"; message: string };

export type ChatDoneEvent = Extract<ChatStreamEvent, { type: "done" }>;

type EventHandler = (event: ChatStreamEvent) => void;

function invalidData(): never {
  throw new Error("Invalid SSE data received from the chat API.");
}

function decodeEvent(eventName: string, rawData: string): ChatStreamEvent | null {
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(rawData) as Record<string, unknown>;
  } catch {
    return invalidData();
  }

  if (eventName === "progress") {
    if (data.stage !== "searching" && data.stage !== "reading" && data.stage !== "drafting") {
      return invalidData();
    }
    return { type: "progress", stage: data.stage };
  }

  if (eventName === "token") {
    if (typeof data.text !== "string") return invalidData();
    return { type: "token", text: data.text };
  }

  if (eventName === "citation") {
    if (
      typeof data.index !== "number" ||
      (data.kind !== "curriculum" && data.kind !== "internet") ||
      typeof data.title !== "string" ||
      typeof data.snippet !== "string"
    ) {
      return invalidData();
    }
    return {
      type: "citation",
      citation: {
        index: data.index,
        kind: data.kind,
        title: data.title,
        url: typeof data.url === "string" ? data.url : null,
        snippet: data.snippet,
        documentId:
          typeof data.document_id === "string" ? data.document_id : null,
        page: typeof data.page === "number" ? data.page : null,
      },
    };
  }

  if (eventName === "done") {
    if (
      typeof data.source !== "string" ||
      typeof data.used_web_search !== "boolean" ||
      typeof data.threshold !== "number" ||
      (data.top_score !== null && typeof data.top_score !== "number")
    ) {
      return invalidData();
    }
    return {
      type: "done",
      source: data.source,
      usedWebSearch: data.used_web_search,
      threshold: data.threshold,
      topScore: data.top_score,
      sessionId: typeof data.session_id === "string" ? data.session_id : null,
      userMessageId:
        typeof data.user_message_id === "string" ? data.user_message_id : null,
      assistantMessageId:
        typeof data.assistant_message_id === "string"
          ? data.assistant_message_id
          : null,
    };
  }

  if (eventName === "error") {
    if (typeof data.message !== "string") return invalidData();
    return { type: "error", message: data.message };
  }

  return null;
}

function parseBlock(block: string): ChatStreamEvent | null {
  let eventName = "message";
  const dataLines: string[] = [];

  for (const line of block.split("\n")) {
    if (line.startsWith("event:")) {
      eventName = line.slice("event:".length).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice("data:".length).trimStart());
    }
  }

  if (dataLines.length === 0) return null;
  return decodeEvent(eventName, dataLines.join("\n"));
}

export function createSseParser(onEvent: EventHandler) {
  let buffer = "";

  function drainCompleteEvents() {
    buffer = buffer.replace(/\r\n/g, "\n");
    let boundary = buffer.indexOf("\n\n");

    while (boundary !== -1) {
      const block = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      const event = parseBlock(block);
      if (event) onEvent(event);
      boundary = buffer.indexOf("\n\n");
    }
  }

  return {
    push(chunk: string) {
      buffer += chunk;
      drainCompleteEvents();
    },
    finish() {
      if (!buffer.trim()) return;
      const event = parseBlock(buffer.replace(/\r\n/g, "\n"));
      buffer = "";
      if (event) onEvent(event);
    },
  };
}
