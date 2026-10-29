'use client';

import * as React from 'react';

export interface SuggestedQuestionsProps {
  questions: string[];
  isLoading?: boolean;
  disabled?: boolean;
  onSelect: (question: string) => void;
  label?: string;
  className?: string;
}

export function SuggestedQuestions({
  questions,
  isLoading = false,
  disabled = false,
  onSelect,
  label,
  className = '',
}: SuggestedQuestionsProps) {
  if (isLoading) {
    return (
      <div className={`flex flex-col gap-1.5 mt-2 ${className}`}>
        {label && (
          <span className="text-[11.5px] font-medium text-[#6F6F6F]">{label}</span>
        )}
        <div className="flex flex-wrap gap-2" aria-label="Loading suggestions">
          <div className="h-[31px] w-48 rounded-full border border-[#DADADA] bg-[#F7F7F7] skeleton-shimmer" />
          <div className="h-[31px] w-56 rounded-full border border-[#DADADA] bg-[#F7F7F7] skeleton-shimmer" />
          <div className="h-[31px] w-40 rounded-full border border-[#DADADA] bg-[#F7F7F7] skeleton-shimmer" />
        </div>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-col gap-1.5 mt-2 ${className}`}>
      {label && (
        <span className="text-[11.5px] font-medium text-[#6F6F6F]">{label}</span>
      )}
      <div className="flex flex-wrap gap-2" aria-label={label || 'Suggested questions'}>
        {questions.map((question) => (
          <button
            key={question}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(question)}
            className="rounded-full border border-[#DADADA] bg-white px-3 py-1.5 text-[12.5px] font-medium text-[#5A5A5A] hover:border-[#CFCFCF] hover:text-[#111111] transition-colors disabled:opacity-50 text-left cursor-pointer"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
}

