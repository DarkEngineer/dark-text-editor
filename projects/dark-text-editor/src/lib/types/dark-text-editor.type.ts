export const BlockTypeList = [
  'heading',
  'paragraph',
  'break',
  'div',
  'list',
  'image',
  'code',
  'table',
] as const;

// JSON block export interfaces
export type HtmlBlockType = (typeof BlockTypeList)[number];

export type BlockContent = string | BaseBlock;

export interface BaseBlock {
  id?: string;
  type: HtmlBlockType;
}

export interface HeadingBlock extends BaseBlock {
  type: 'heading';
  content: string;
  level?: number;
}

export interface ParagraphBlock extends BaseBlock {
  type: 'paragraph';
  content: string | BaseBlock[];
}

export interface ListBlock extends BaseBlock {
  type: 'list';
  ordered?: boolean;
  items: string[];
}
export interface ImageBlock extends BaseBlock {
  type: 'image';
  src: string;
  alt?: string;
  caption?: string;
}
export interface CodeBlock extends BaseBlock {
  type: 'code';
  language?: string;
  code: string;
}
export interface TableBlock extends BaseBlock {
  type: 'table';
  headers: string[];
  rows: string[][];
}
