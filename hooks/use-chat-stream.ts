import { useState, useCallback } from 'react';
import { AUTH_TOKEN_KEY } from '@/components/ui/nav-config';

interface UseChatStreamProps {
  /** Class scope — BE dùng để lọc syllabus/tài liệu của đúng lớp, tránh lẫn dữ liệu giữa các lớp. */
  classId: string;
  onChunk: (chunk: string) => void;
  onFinish?: () => void;
  onError?: (error: Error) => void;
}

export function useChatStream({ classId, onChunk, onFinish, onError }: UseChatStreamProps) {
  const [isStreaming, setIsStreaming] = useState(false);

  const sendMessage = useCallback(async (message: string) => {
    setIsStreaming(true);

    try {
      // 1. Khởi tạo hàm fetch gọi đến endpoint API (giả định là /api/chat)
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Đính kèm token ảo của Developer từ localStorage
          'Authorization': `Bearer ${localStorage.getItem(AUTH_TOKEN_KEY) || ''}`
        },
        body: JSON.stringify({ message, class_id: classId }),
      });

      if (!response.ok) {
        throw new Error(`Lỗi API: ${response.statusText}`);
      }

      // Đảm bảo body là luồng (stream)
      if (!response.body) {
        throw new Error('API không trả về stream data');
      }

      // 2. Khởi tạo bộ đọc stream và bộ giải mã byte sang chữ (UTF-8)
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      // 3. Dùng vòng lặp while (true) để liên tục "hứng" các mảng byte rớt xuống
      while (true) {
        const { done, value } = await reader.read();
        
        // Nếu Server báo đã gửi hết, thoát khỏi vòng lặp
        if (done) {
          break; 
        }

        // 4. Giải mã mảng byte (Uint8Array) thành chuỗi chữ cái con người đọc được
        const chunkText = decoder.decode(value, { stream: true });
        
        // Bắn chữ vừa nhận được ra ngoài Component Cha thông qua hàm onChunk
        if (chunkText) {
          onChunk(chunkText);
        }
      }

      // Gọi hàm onFinish khi luồng stream kết thúc thành công
      if (onFinish) onFinish();

    } catch (err) {
      console.error('Lỗi khi đọc luồng SSE:', err);
      if (onError) onError(err as Error);
    } finally {
      setIsStreaming(false);
    }
  }, [classId, onChunk, onFinish, onError]);

  return {
    sendMessage,
    isStreaming
  };
}
