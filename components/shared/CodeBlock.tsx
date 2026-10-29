'use client';

import * as React from 'react';
import { Check, Copy } from 'lucide-react';

type TokenType = 'plain' | 'comment' | 'string' | 'keyword' | 'number' | 'function' | 'tag';

type Token = { text: string; type: TokenType };

const TOKEN_COLORS: Record<TokenType, string> = {
  plain: 'text-[#D4D4D4]',
  comment: 'text-[#6A9955] italic',
  string: 'text-[#CE9178]',
  keyword: 'text-[#C586C0]',
  number: 'text-[#B5CEA8]',
  function: 'text-[#DCDCAA]',
  tag: 'text-[#569CD6]',
};

const JS_KEYWORDS = `const let var function return if else for while do switch case break continue class extends new import from export default async await try catch finally throw typeof instanceof in of this super yield static interface type enum implements public private protected readonly declare abstract as satisfies`.split(' ');
const PY_KEYWORDS = `def class return if elif else for while import from as with try except finally raise lambda pass break continue yield global nonlocal assert del in is not and or None True False async await print`.split(' ');
const C_KEYWORDS = `int void char bool float double long short unsigned signed struct class public private protected static const return if else for while switch case break continue new delete this namespace using template typename virtual override try catch throw import package extends implements final abstract interface boolean string auto`.split(' ');
const GO_KEYWORDS = `func package import var const type struct interface map chan go defer return if else for range switch case break continue select`.split(' ');
const RUST_KEYWORDS = `fn let mut pub struct enum impl trait use mod match if else for while loop return self Self as const static async await move ref where crate super`.split(' ');
const BASH_KEYWORDS = `if then else elif fi for do done while case esac function echo export local set unset source return in`.split(' ');
const SQL_KEYWORDS = `select from where join left right inner outer group by order having limit offset insert into update delete create table alter drop values set and or not null as distinct count sum avg min max union all`.split(' ');
const JSON_KEYWORDS = `true false null`.split(' ');

const KEYWORDS: Record<string, Set<string>> = {
  js: new Set(JS_KEYWORDS),
  python: new Set(PY_KEYWORDS),
  c: new Set(C_KEYWORDS),
  go: new Set(GO_KEYWORDS),
  rust: new Set(RUST_KEYWORDS),
  bash: new Set(BASH_KEYWORDS),
  sql: new Set(SQL_KEYWORDS),
  json: new Set(JSON_KEYWORDS),
};

const LANG_ALIASES: Record<string, string> = {
  javascript: 'js',
  jsx: 'js',
  typescript: 'js',
  ts: 'js',
  tsx: 'js',
  js: 'js',
  py: 'python',
  python: 'python',
  c: 'c',
  h: 'c',
  cpp: 'c',
  'c++': 'c',
  cs: 'c',
  csharp: 'c',
  java: 'c',
  kotlin: 'c',
  swift: 'c',
  go: 'go',
  rust: 'rust',
  rs: 'rust',
  sh: 'bash',
  shell: 'bash',
  bash: 'bash',
  zsh: 'bash',
  sql: 'sql',
  json: 'json',
  yaml: 'bash',
  yml: 'bash',
  toml: 'bash',
  ini: 'bash',
};

const HASH_COMMENT_LANGS = new Set(['python', 'bash']);

function normalizeLanguage(language?: string): string {
  const raw = (language ?? '').trim().toLowerCase();
  return LANG_ALIASES[raw] ?? raw;
}

function tokenize(code: string, language?: string): Token[] {
  const lang = normalizeLanguage(language);
  const keywords = KEYWORDS[lang];
  const isMarkup = lang === 'html' || lang === 'xml' || lang === 'svg';

  const comment = HASH_COMMENT_LANGS.has(lang)
    ? '#[^\\n]*'
    : '\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/|<!--[\\s\\S]*?-->';
  const tag = isMarkup ? '|<\\/?[A-Za-z][\\w:-]*' : '';
  const pattern = new RegExp(
    `(${comment}|"(?:\\\\.|[^"\\\\])*"|'(?:\\\\.|[^'\\\\])*'|\`(?:\\\\.|[^\`\\\\])*\`|\\b\\d+(?:\\.\\d+)?\\b${tag}|[A-Za-z_$][\\w$]*)`,
    'g',
  );

  const tokens: Token[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(code)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ text: code.slice(lastIndex, match.index), type: 'plain' });
    }

    const text = match[0];
    let type: TokenType = 'plain';

    if (text.startsWith('//') || text.startsWith('/*') || text.startsWith('#') || text.startsWith('<!--')) {
      type = 'comment';
    } else if (/^["'`]/.test(text)) {
      type = 'string';
    } else if (/^\d/.test(text)) {
      type = 'number';
    } else if (isMarkup && /^<\/?[A-Za-z]/.test(text)) {
      type = 'tag';
    } else if (keywords?.has(text.toLowerCase())) {
      type = 'keyword';
    } else {
      const rest = code.slice(match.index + text.length);
      if (/^\s*\(/.test(rest)) type = 'function';
    }

    tokens.push({ text, type });
    lastIndex = match.index + text.length;
  }

  if (lastIndex < code.length) {
    tokens.push({ text: code.slice(lastIndex), type: 'plain' });
  }

  return tokens;
}

/**
 * Dark code card used by chat answers: language label, one-click copy and a
 * small syntax palette. Highlighting is token-based React nodes, never
 * dangerouslySetInnerHTML, so model output cannot inject markup.
 */
export function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = React.useState(false);
  const tokens = React.useMemo(() => tokenize(code, language), [code, language]);

  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard can be blocked; the code stays selectable.
    }
  }, [code]);

  return (
    <div className="group/code mt-3 overflow-hidden rounded-xl border border-[#2A2A2A] bg-[#1B1B1B]">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-white/[0.04] px-3 py-1.5">
        <span className="truncate font-mono text-[10.5px] uppercase tracking-wider text-[#9A9A9A]">
          {language?.trim() || 'code'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? 'Copied' : 'Copy code'}
          className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium text-[#B0B0B0] transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-[#4B9E76]" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 text-[11px] leading-relaxed text-[#D4D4D4]">
        <code className="font-mono">
          {tokens.map((token, index) =>
            token.type === 'plain' ? (
              token.text
            ) : (
              <span key={index} className={TOKEN_COLORS[token.type]}>
                {token.text}
              </span>
            ),
          )}
        </code>
      </pre>
    </div>
  );
}
