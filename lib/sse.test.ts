import { describe, expect, it, vi } from "vitest";

import { consumeSseStream } from "./sse";

function streamChunks(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
}

describe("consumeSseStream", () => {
  it("delivers token, citation, and done events across fragmented chunks", async () => {
    const onToken = vi.fn();
    const onCitation = vi.fn();
    const onDone = vi.fn();

    await consumeSseStream(
      streamChunks([
        'event: token\ndata: {"text":"Hel',
        'lo"}\n\nevent: citation\ndata: {"marker":"[1]","document_id":"doc-1",',
        '"file_name":"lesson.pdf","heading":"Unit 1","page":4,"url":"/api/documents/doc-1/content?page=4"}\n\n',
        "event: done\ndata: {}\n\n",
      ]),
      { onToken, onCitation, onDone },
    );

    expect(onToken).toHaveBeenCalledWith("Hello");
    expect(onCitation).toHaveBeenCalledWith({
      marker: "[1]",
      document_id: "doc-1",
      file_name: "lesson.pdf",
      heading: "Unit 1",
      page: 4,
      url: "/api/documents/doc-1/content?page=4",
    });
    expect(onDone).toHaveBeenCalledOnce();
  });

  it("decodes UTF-8 content split between byte chunks", async () => {
    const bytes = new TextEncoder().encode('event: token\ndata: {"text":"Xin chào"}\n\n');
    const onToken = vi.fn();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(bytes.slice(0, bytes.length - 5));
        controller.enqueue(bytes.slice(bytes.length - 5));
        controller.close();
      },
    });

    await consumeSseStream(stream, { onToken, onCitation: vi.fn() });

    expect(onToken).toHaveBeenCalledWith("Xin chào");
  });

  it("throws the JSON message from an error event", async () => {
    await expect(
      consumeSseStream(
        streamChunks(['event: error\ndata: {"message":"The request timed out."}\n\n']),
        { onToken: vi.fn(), onCitation: vi.fn() },
      ),
    ).rejects.toThrow("The request timed out.");
  });
});
