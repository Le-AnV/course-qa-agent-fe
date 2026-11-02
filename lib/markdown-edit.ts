export type MarkdownFormat = "bold" | "italic" | "heading" | "bullet" | "ordered" | "link";

type EditInput = {
  value: string;
  start: number;
  end: number;
};

type EditResult = {
  value: string;
  start: number;
  end: number;
};

function wrapSelection(
  input: EditInput,
  prefix: string,
  suffix: string,
  placeholder: string,
): EditResult {
  const selected = input.value.slice(input.start, input.end);
  const inner = selected || placeholder;
  const value =
    input.value.slice(0, input.start) +
    prefix +
    inner +
    suffix +
    input.value.slice(input.end);
  const start = input.start + prefix.length;
  return { value, start, end: start + inner.length };
}

function prefixCurrentLine(input: EditInput, prefix: string): EditResult {
  const lineStart = input.value.lastIndexOf("\n", input.start - 1) + 1;
  const value = input.value.slice(0, lineStart) + prefix + input.value.slice(lineStart);
  return {
    value,
    start: input.start + prefix.length,
    end: input.end + prefix.length,
  };
}

function prefixSelectedLines(input: EditInput, prefix: string): EditResult {
  const lineStart = input.value.lastIndexOf("\n", input.start - 1) + 1;
  const nextBreak = input.value.indexOf("\n", input.end);
  const blockEnd = nextBreak === -1 ? input.value.length : nextBreak;
  const lines = input.value.slice(lineStart, blockEnd).split("\n");
  let added = 0;
  const nextLines = lines.map((line) => {
    if (!line.trim()) return line;
    added += prefix.length;
    return prefix + line;
  });
  return {
    value:
      input.value.slice(0, lineStart) +
      nextLines.join("\n") +
      input.value.slice(blockEnd),
    start: input.start + prefix.length,
    end: input.end + added,
  };
}

function insertLink(input: EditInput): EditResult {
  const selected = input.value.slice(input.start, input.end);
  const label = selected || "link text";
  const url = "https://";
  const value =
    input.value.slice(0, input.start) +
    `[${label}](${url})` +
    input.value.slice(input.end);
  const start = input.start + label.length + 3;
  return { value, start, end: start + url.length };
}

export function applyMarkdownFormat(
  input: EditInput,
  format: MarkdownFormat,
): EditResult {
  switch (format) {
    case "bold":
      return wrapSelection(input, "**", "**", "bold text");
    case "italic":
      return wrapSelection(input, "*", "*", "italic text");
    case "heading":
      return prefixCurrentLine(input, "## ");
    case "bullet":
      return prefixSelectedLines(input, "- ");
    case "ordered":
      return prefixSelectedLines(input, "1. ");
    case "link":
      return insertLink(input);
    default:
      return input;
  }
}
