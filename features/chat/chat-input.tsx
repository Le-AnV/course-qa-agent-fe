import * as React from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button'; // Assuming the project uses shadcn ui button

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
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
    
    // Reset height to default after sending
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
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
    <div className="p-4 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-4xl mx-auto relative flex items-end gap-2 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 focus-within:ring-2 focus-within:ring-slate-400 focus-within:ring-offset-2 transition-all">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Ask the AI assistant anything about the course... (Shift + Enter for new line)"
          className="flex-1 max-h-[200px] min-h-[44px] w-full resize-none bg-transparent px-3 py-3 text-sm focus:outline-none dark:text-slate-100 placeholder:text-slate-500"
          rows={1}
        />
        <Button 
          onClick={handleSend} 
          disabled={disabled || !content.trim()}
          size="icon"
          className="h-10 w-10 shrink-0 rounded-full bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
        >
          <Send className="h-4 w-4" />
          <span className="sr-only">Send</span>
        </Button>
      </div>
    </div>
  );
}
