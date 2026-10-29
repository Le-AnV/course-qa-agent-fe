import * as React from 'react';
import { Mic, Send, Square } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import type { ChatQuota } from './api';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  chatLayout?: boolean;
  quota?: ChatQuota | null;
}

type SpeechResultLike = {
  isFinal: boolean;
  0: { transcript: string };
};

type SpeechResultListLike = {
  length: number;
  [index: number]: SpeechResultLike;
};

type SpeechResultEventLike = {
  results: SpeechResultListLike;
};

type SpeechErrorEventLike = {
  error: string;
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: (track?: MediaStreamTrack) => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechResultEventLike) => void) | null;
  onerror: ((event: SpeechErrorEventLike) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  }
}

const subscribeNoop = () => () => {};

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

export function ChatInput({ onSend, disabled, chatLayout = false, quota }: ChatInputProps) {
  const [content, setContent] = React.useState('');
  const [isListening, setIsListening] = React.useState(false);
  const voiceSupported = React.useSyncExternalStore(
    subscribeNoop,
    () => getRecognitionCtor() !== null,
    () => false
  );
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const recognitionRef = React.useRef<SpeechRecognitionLike | null>(null);
  const mediaStreamRef = React.useRef<MediaStream | null>(null);
  const startingRef = React.useRef(false);
  const mountedRef = React.useRef(true);
  const baseTextRef = React.useRef('');

  const limit = quota?.limit ?? null;
  const remaining = quota?.remaining ?? null;
  const exhausted = limit !== null && (remaining ?? 0) <= 0;
  const blocked = Boolean(disabled) || exhausted;

  const resize = React.useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, []);

  const stopMediaStream = React.useCallback(() => {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  }, []);

  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      recognitionRef.current?.abort();
      recognitionRef.current = null;
      stopMediaStream();
    };
  }, [stopMediaStream]);

  React.useEffect(() => {
    if (disabled) recognitionRef.current?.stop();
  }, [disabled]);

  // Automatically adjust textarea height for multiline input
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    resize();
  };

  const handleSend = () => {
    const trimmed = content.trim();
    if (!trimmed || blocked) return;

    recognitionRef.current?.stop();
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

  const startListening = async () => {
    if (startingRef.current || recognitionRef.current) return;

    const Recognition = getRecognitionCtor();
    if (!Recognition) return;

    startingRef.current = true;

    let stream: MediaStream | null = null;
    try {
      // Pass the microphone track explicitly: the default input path can end
      // the recognition session without ever delivering audio on some Chrome builds.
      stream = (await navigator.mediaDevices?.getUserMedia({ audio: true })) ?? null;
    } catch (error) {
      startingRef.current = false;
      const name = error instanceof DOMException ? error.name : '';
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        toast.error('Microphone access was denied.');
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        toast.error('No microphone was found.');
      } else {
        toast.error('Voice input could not start.');
      }
      return;
    }

    if (!mountedRef.current) {
      stream?.getTracks().forEach((track) => track.stop());
      startingRef.current = false;
      return;
    }

    mediaStreamRef.current = stream;

    const recognition = new Recognition();
    recognition.lang = 'vi-VN';
    recognition.continuous = true;
    recognition.interimResults = true;
    baseTextRef.current = content.trim();

    recognition.onresult = (event) => {
      let finalText = '';
      let interimText = '';
      for (let i = 0; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcript = result[0]?.transcript ?? '';
        if (result.isFinal) finalText += transcript;
        else interimText += transcript;
      }
      const combined = [baseTextRef.current, finalText.trim(), interimText.trim()]
        .filter(Boolean)
        .join(' ');
      setContent(combined);
      window.requestAnimationFrame(resize);
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      stopMediaStream();
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        toast.error('Microphone access was denied.');
      } else if (event.error === 'audio-capture') {
        toast.error('No microphone was found.');
      } else if (event.error !== 'aborted' && event.error !== 'no-speech') {
        toast.error('Voice input failed. Please try again.');
      }
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      startingRef.current = false;
      setIsListening(false);
      stopMediaStream();
      textareaRef.current?.focus();
    };

    try {
      const track = stream?.getAudioTracks()[0];
      if (track) recognition.start(track);
      else recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch {
      stopMediaStream();
      toast.error('Voice input could not start.');
    } finally {
      startingRef.current = false;
    }
  };

  const toggleVoice = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }
    void startListening();
  };

  return (
    <div className={chatLayout ? 'pointer-events-none px-4 pt-1 pb-2' : 'border-t border-[#F0F0F0] bg-white p-4'}>
      <div className={`${chatLayout ? 'mx-auto w-full max-w-2xl pointer-events-auto' : 'max-w-4xl mx-auto'} relative flex items-end gap-2 rounded-2xl border border-[#5F5F5F] bg-white p-2 focus-within:ring-2 focus-within:ring-[#CFCFCF] focus-within:ring-offset-2 transition-all`}>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          aria-disabled={blocked}
          placeholder="Ask about this course... (Shift + Enter for a new line)"
          className="flex-1 max-h-[200px] min-h-[44px] w-full resize-none bg-transparent px-3 py-3 text-[11.5px] text-[#111111] focus:outline-none placeholder:text-[#6F6F6F] disabled:cursor-not-allowed"
          rows={1}
        />
        {voiceSupported && (
          <Button
            type="button"
            onClick={toggleVoice}
            disabled={blocked}
            size="icon"
            aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
            aria-pressed={isListening}
            className={`h-10 w-10 shrink-0 rounded-full border shadow-xs ${
              isListening
                ? 'border-[#9D4C38] bg-[#FDF2F2] text-[#9D4C38] hover:bg-[#FBEAEA]'
                : 'border-[#CFCFCF] bg-white text-[#111111] hover:bg-[#F7F7F7]'
            }`}
          >
            {isListening ? <Square className="h-3.5 w-3.5" /> : <Mic className="h-4 w-4" />}
          </Button>
        )}
        <Button
          onClick={handleSend}
          disabled={blocked || !content.trim()}
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
