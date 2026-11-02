import {
  FileArchive,
  FileAudio,
  FileCode2,
  FileImage,
  FileText,
  FileVideo,
  Presentation,
} from "lucide-react";
import { FileIcon, defaultStyles } from "react-file-icon";
import { cn } from "@/lib/utils";

export type FileTypeKind =
  | "spreadsheet"
  | "document"
  | "pdf"
  | "presentation"
  | "image"
  | "video"
  | "audio"
  | "archive"
  | "code";

const KINDS: Record<string, FileTypeKind> = {
  xlsx: "spreadsheet",
  xls: "spreadsheet",
  csv: "spreadsheet",
  tsv: "spreadsheet",
  ods: "spreadsheet",
  ppt: "presentation",
  pptx: "presentation",
  key: "presentation",
  odf: "presentation",
  odp: "presentation",
  pdf: "pdf",
  doc: "document",
  docx: "document",
  txt: "document",
  md: "document",
  rtf: "document",
  odt: "document",
  pages: "document",
  png: "image",
  jpg: "image",
  jpeg: "image",
  gif: "image",
  webp: "image",
  svg: "image",
  mp4: "video",
  mov: "video",
  webm: "video",
  avi: "video",
  mkv: "video",
  mp3: "audio",
  wav: "audio",
  m4a: "audio",
  ogg: "audio",
  zip: "archive",
  rar: "archive",
  "7z": "archive",
  tar: "archive",
  gz: "archive",
  js: "code",
  jsx: "code",
  ts: "code",
  tsx: "code",
  py: "code",
  java: "code",
  c: "code",
  cpp: "code",
  h: "code",
  hpp: "code",
  cs: "code",
  go: "code",
  rs: "code",
  rb: "code",
  php: "code",
  sql: "code",
  json: "code",
  html: "code",
  css: "code",
};

const ICONS = {
  spreadsheet: FileText,
  document: FileText,
  pdf: FileText,
  presentation: Presentation,
  image: FileImage,
  video: FileVideo,
  audio: FileAudio,
  archive: FileArchive,
  code: FileCode2,
} as const;

const TONES: Record<FileTypeKind, string> = {
  spreadsheet: "border-[#D9E4CF] bg-[#F1F5EC] text-[#4F6B3A]",
  document: "border-[var(--brand-line)] bg-[var(--brand-soft)] text-[var(--brand-ink)]",
  pdf: "border-[#E8CDD2] bg-[#FAEEF0] text-[#9D3F50]",
  presentation: "border-[#E8DCCB] bg-[#F8F2E8] text-[#8A5A2B]",
  image: "border-[#D5E5DC] bg-[#EFF6F2] text-[#3F6B5A]",
  video: "border-[#E3D8E8] bg-[#F6F0F8] text-[#6B4A78]",
  audio: "border-[#E8D5D9] bg-[#F9EFF1] text-[#7A3F4A]",
  archive: "border-[#E5DFD3] bg-[#F6F2EA] text-[#6B5A3A]",
  code: "border-[#D8DEE6] bg-[#F1F4F7] text-[#3F4F63]",
};

export function fileExtension(fileName: string): string {
  const clean = fileName.split(/[?#]/)[0] ?? fileName;
  const dot = clean.lastIndexOf(".");
  return dot >= 0 ? clean.slice(dot + 1).toLowerCase() : "";
}

export function fileTypeKind(fileName: string): FileTypeKind {
  return KINDS[fileExtension(fileName)] ?? "document";
}

export function fileTypeTone(fileName: string): string {
  return TONES[fileTypeKind(fileName)];
}

export function FileTypeIcon({
  fileName,
  className,
}: {
  fileName: string;
  className?: string;
}) {
  const extension = fileExtension(fileName);
  const kind = fileTypeKind(fileName);
  const libraryStyle = defaultStyles[extension];
  const usesLibrary =
    Boolean(libraryStyle) &&
    (kind === "document" || kind === "spreadsheet" || kind === "pdf");

  if (usesLibrary) {
    return (
      <span
        aria-hidden="true"
        data-file-kind={kind}
        className={cn(
          "inline-flex h-4 w-4 shrink-0 items-center justify-center [&>svg]:h-full [&>svg]:w-full",
          className,
        )}
      >
        <FileIcon extension={extension} {...libraryStyle} />
      </span>
    );
  }

  const Icon = ICONS[kind];
  return <Icon aria-hidden="true" className={cn("h-4 w-4 shrink-0", className)} />;
}
