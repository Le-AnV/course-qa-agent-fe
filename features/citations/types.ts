export type SourceType = 'curriculum' | 'internet';

export interface CitationLocation {
  page_number?: number | null;
  slide_number?: number | null;
  paragraph_index?: number | null;
  chapter?: string | null;
  class_code?: string | null;
}

export interface CitationItem {
  citation_id: number;
  source_type: SourceType;
  document_name: string;
  document_type: 'pdf' | 'pptx' | 'docx' | 'web';
  file_url?: string | null;
  location: CitationLocation;
  highlight_quote: string;
  jump_url?: string | null;
}
