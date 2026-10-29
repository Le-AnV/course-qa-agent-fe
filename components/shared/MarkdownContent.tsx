"use client";

import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "./CodeBlock";

const SAFE_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);

/** Keep links clickable but never emit javascript:/data: URLs. */
export function safeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("#") || trimmed.startsWith("/")) return trimmed;
  try {
    const parsed = new URL(trimmed, "https://placeholder.invalid");
    return SAFE_PROTOCOLS.has(parsed.protocol) ? trimmed : "";
  } catch {
    return "";
  }
}

const LINK_CLASS =
  "font-semibold text-[#111111] underline decoration-[#CFCFCF] underline-offset-2 hover:decoration-[#111111] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111111]";

function cleanMathDelimiters(text: string): string {
  // Convert any unparsed LaTeX $...$, $$...$$, \(...\), \[...\] to clean inline code so raw dollar signs never leak
  return text
    .split(/(```[\s\S]*?```|`[^`\n]*`)/g)
    .map((segment, index) => {
      if (index % 2 === 1) return segment;
      return segment
        .replace(/\$\$([\s\S]*?)\$\$/g, '`$1`')
        .replace(/\$([^\$\n]+)\$/g, '`$1`')
        .replace(/\\\(([\s\S]*?)\\\)/g, '`$1`')
        .replace(/\\\[([\s\S]*?)\\\]/g, '`$1`');
    })
    .join('');
}

/**
 * One Markdown renderer for every rich-text class field, so Schedule,
 * Description and More information cannot drift into different styles.
 *
 * Raw HTML is skipped (react-markdown's default), and no component uses
 * dangerouslySetInnerHTML, so teacher input can never inject markup.
 */
export function MarkdownContent({
  content,
  className,
}: {
  content: string | null | undefined;
  className?: string;
}) {
  if (!content || !content.trim()) return null;
  const sanitized = cleanMathDelimiters(content);

  return (
    <div
      className={`min-w-0 break-words [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 ${className ?? ""}`}
    >
      <ReactMarkdown
        skipHtml
        remarkPlugins={[remarkGfm, remarkBreaks]}
        urlTransform={safeUrl}
        components={{
          p: ({ children }) => (
            <p className="text-[11.5px] leading-relaxed text-[#111111] [&:not(:first-child)]:mt-2.5">
              {children}
            </p>
          ),
          h1: ({ children }) => (
            <h1 className="mt-4 text-[15px] font-bold leading-snug text-[#111111]">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-4 text-[13.5px] font-bold leading-snug text-[#111111]">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-3 text-[12.5px] font-bold leading-snug text-[#111111]">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="mt-3 text-[11.5px] font-bold leading-snug text-[#111111]">{children}</h4>
          ),
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-[11.5px] leading-relaxed text-[#111111]">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-[11.5px] leading-relaxed text-[#111111]">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="pl-0.5">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="mt-3 border-l-2 border-[#DADADA] pl-3 text-[#5A5A5A]">
              {children}
            </blockquote>
          ),
          code: ({ className, children }) => {
            const text = String(children ?? "");
            const language = className?.match(/language-([\w+-]+)/)?.[1];
            // A fenced block always carries a language class or a newline;
            // everything else is inline code and stays in the text flow.
            if (language || text.includes("\n")) {
              return <CodeBlock code={text.replace(/\n$/, "")} language={language} />;
            }
            return (
              <code className="rounded-md border border-[#E8E8E8] bg-[#F4F4F4] px-1.5 py-0.5 font-mono text-[10.5px] text-[#9D4C38]">
                {children}
              </code>
            );
          },
          pre: ({ children }) => <>{children}</>,
          hr: () => <hr className="my-4 border-[#E5E5E5]" />,
          a: ({ href, children }) => {
            if (!href) return <span className={LINK_CLASS}>{children}</span>;
            const external = /^https?:/i.test(href);
            return (
              <a
                href={href}
                className={LINK_CLASS}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                {children}
              </a>
            );
          },
          img: ({ src, alt }) =>
            src ? (
              // eslint-disable-next-line @next/next/no-img-element -- teacher-supplied URLs, no configured image domains
              <img
                src={src}
                alt={alt ?? ""}
                loading="lazy"
                className="mt-3 max-w-full rounded-lg border border-[#DADADA]"
              />
            ) : null,
          table: ({ children }) => (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full border-collapse text-left text-[10.5px] text-[#111111]">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-[#DADADA] bg-[#FAFAFA] px-2.5 py-1.5 font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-[#DADADA] px-2.5 py-1.5">{children}</td>
          ),
        }}
      >
        {sanitized}
      </ReactMarkdown>
    </div>
  );
}
