import { getClassById } from "@/lib/classes";

/**
 * MOCK LOCAL — chỉ để test UI luồng chat khi BE chưa có endpoint thật.
 * XÓA file này khi BE xong POST /api/chat (nhận { message, class_id }, trả text stream).
 */
export async function POST(req: Request) {
  let message = "";
  let classId = "";
  try {
    const body = await req.json();
    message = String(body.message ?? "");
    classId = String(body.class_id ?? "");
  } catch {
    /* body không phải JSON — giữ mock chạy được */
  }

  const cls = classId ? getClassById(classId) : undefined;
  const scope = cls ? `${cls.code} · ${cls.title}` : classId || "chưa rõ lớp";

  const reply =
    `[MOCK LOCAL — BE chưa có endpoint thật]\n` +
    `Bạn hỏi (${scope}): "${message}"\n\n` +
    `Đây là luồng test để kiểm tra UI stream, badge scope lớp và auto-scroll. ` +
    `Khi BE xong, response sẽ là câu trả lời RAG lọc theo syllabus của đúng lớp này.`;

  const encoder = new TextEncoder();
  const words = reply.split(/(\s+)/);
  const stream = new ReadableStream({
    async start(controller) {
      for (const w of words) {
        controller.enqueue(encoder.encode(w));
        await new Promise((r) => setTimeout(r, 30));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
