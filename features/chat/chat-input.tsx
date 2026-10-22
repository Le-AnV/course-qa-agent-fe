import * as React from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button'; // Assuming the project uses shadcn ui button

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  chatLayout?: boolean;
}

export function ChatInput({ onSend, disabled, chatLayout = false }: ChatInputProps) {
  const [content, setContent] = React.useState('');
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Automatically adjust textarea height for multiline input
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  const handleSend = () => {
    const trimmed = content.trim();
    if (!trimmed || disabled) return;
    
    onSend(trimmed);
    setContent('');
    
    // Reset height to default after sending, and keep the caret in the box so
    // the next turn can be typed straight away (Enter or click on Send).
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.focus();
    }
  };

  // Step 3.1: Handle Enter and Shift+Enter events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Case 1: Press Enter (without Shift) -> Send message
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent browser from inserting a new line
      handleSend();       // Execute message submission
    }
    // Case 2: Press Enter + Shift (e.key === 'Enter' && e.shiftKey)
    // -> Do not call preventDefault() to keep default behavior (insert \n)
  };

  return (
    <div className={`p-4 ${chatLayout ? 'bg-[#F7F7F7]' : 'border-t border-[#F0F0F0] bg-white'}`}>
      <div className={`${chatLayout ? 'w-full bg-[#F0F0F0]' : 'max-w-4xl mx-auto bg-[#F7F7F7]'} relative flex items-end gap-2 rounded-2xl border border-[#DADADA] p-2 focus-within:ring-2 focus-within:ring-[#CFCFCF] focus-within:ring-offset-2 transition-all`}>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          aria-disabled={disabled}
          placeholder="Ask about this course... (Shift + Enter for a new line)"
          className="flex-1 max-h-[200px] min-h-[44px] w-full resize-none bg-transparent px-3 py-3 text-sm text-[#111111] focus:outline-none placeholder:text-[#6F6F6F] disabled:cursor-not-allowed"
          rows={1}
        />
        <Button 
          onClick={handleSend} 
          disabled={disabled || !content.trim()}
          size="icon"
          className="h-10 w-10 shrink-0 rounded-full border border-[#CFCFCF] bg-white text-[#111111] hover:bg-[#F7F7F7] shadow-xs"
        >
          <Send className="h-4 w-4" />
          <span className="sr-only">Send</span>
        </Button>
      </div>
    </div>
  );
}
