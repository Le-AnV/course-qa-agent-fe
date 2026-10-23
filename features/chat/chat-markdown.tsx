import * as React from 'react';

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={`${keyPrefix}-${index}`}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={`${keyPrefix}-${index}`}>{part.slice(1, -1)}</em>;
    }

    return part;
  });
}

function isBlockStart(line: string): boolean {
  return /^#{1,3}\s|^\s*[-*+]\s+|^\s*\d+\.\s+/.test(line);
}

export function ChatMarkdown({ content }: { content: string }) {
  const lines = content.split('\n');
  const blocks: React.ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line) {
      index += 1;
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      blocks.push(
        <h3 key={`heading-${index}`} className="font-semibold">
          {renderInline(heading[2], `heading-${index}`)}
        </h3>,
      );
      index += 1;
      continue;
    }

    if (/^[-*+]\s+/.test(line)) {
      const items: React.ReactNode[] = [];
      while (index < lines.length && /^\s*[-*+]\s+/.test(lines[index])) {
        const item = lines[index].trim().replace(/^[-*+]\s+/, '');
        const itemIdx = index;
        index += 1;

        const subItems: React.ReactNode[] = [];
        while (index < lines.length && /^\s{2,}[-*+]\s+/.test(lines[index])) {
          const subItem = lines[index].trim().replace(/^[-*+]\s+/, '');
          subItems.push(<li key={`subitem-${index}`}>{renderInline(subItem, `subitem-${index}`)}</li>);
          index += 1;
        }

        items.push(
          <li key={`item-${itemIdx}`}>
            {renderInline(item, `item-${itemIdx}`)}
            {subItems.length > 0 && (
              <ul className="mt-1 list-[circle] space-y-1 pl-5">{subItems}</ul>
            )}
          </li>,
        );
      }
      blocks.push(
        <ul key={`list-${index}`} className="list-disc space-y-1 pl-5">
          {items}
        </ul>,
      );
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: React.ReactNode[] = [];
      while (index < lines.length && /^\s*\d+\.\s+/.test(lines[index])) {
        const item = lines[index].trim().replace(/^\d+\.\s+/, '');
        items.push(<li key={`ordered-item-${index}`}>{renderInline(item, `ordered-item-${index}`)}</li>);
        index += 1;
      }
      blocks.push(
        <ol key={`ordered-list-${index}`} className="list-decimal space-y-1 pl-5">
          {items}
        </ol>,
      );
      continue;
    }

    const paragraph: string[] = [];
    while (index < lines.length && lines[index].trim() && !isBlockStart(lines[index].trim())) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    blocks.push(
      <p key={`paragraph-${index}`}>
        {renderInline(paragraph.join(' '), `paragraph-${index}`)}
      </p>,
    );
  }

  return <div className="space-y-2">{blocks}</div>;
}
