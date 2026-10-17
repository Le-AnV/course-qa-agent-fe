export type ChatCitation = {
  marker: string;
  document_id: string;
  file_name: string;
  heading: string | null;
  page: number | null;
  url: string;
};

type ChatStreamHandlers = {
  onToken: (text: string) => void;
  onCitation: (citation: ChatCitation) => void;
  onDone?: () => void;
};

/** Read the JSON SSE contract returned by POST /api/chat. */
export async function consumeSseStream(
  stream: ReadableStream<Uint8Array>,
  handlers: ChatStreamHandlers,
): Promise<void> {
  const reader = stream.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  const dispatch = (frame: string) => {
    let event = "message";
    const data: string[] = [];

    for (const line of frame.split("\n")) {
      if (line.startsWith(":")) continue;
      const separator = line.indexOf(":");
      const field = separator === -1 ? line : line.slice(0, separator);
      const value = separator === -1 ? "" : line.slice(separator + 1).replace(/^ /, "");
      if (field === "event") event = value;
      if (field === "data") data.push(value);
    }

    if (data.length === 0) return;
    const payload = JSON.parse(data.join("\n")) as Record<string, unknown>;
    if (event === "token" && typeof payload.text === "string") {
      handlers.onToken(payload.text);
    } else if (event === "citation") {
      handlers.onCitation(payload as ChatCitation);
    } else if (event === "done") {
      handlers.onDone?.();
    } else if (event === "error") {
      const message = typeof payload.message === "string"
        ? payload.message
        : "The answer could not be generated.";
      throw new Error(message);
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
      buffer = buffer.replace(/\r\n/g, "\n");

      let boundary = buffer.indexOf("\n\n");
      while (boundary !== -1) {
        dispatch(buffer.slice(0, boundary));
        buffer = buffer.slice(boundary + 2);
        boundary = buffer.indexOf("\n\n");
      }

      if (done) {
        if (buffer.trim()) dispatch(buffer);
        return;
      }
    }
  } finally {
    reader.releaseLock();
  }
}
