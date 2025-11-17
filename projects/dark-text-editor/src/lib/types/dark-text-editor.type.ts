export const BlockTypeList = [
  'heading',
  'paragraph',
  'span',
  'text',
  'break',
  'div',
  'list',
  'image',
  'code',
  'table',
  'unknown'
] as const;

// JSON block export interfaces
export type HtmlBlockType = (typeof BlockTypeList)[number];

export type BlockContent = string | BaseBlock;

export interface BlockStyle {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  color: string | null;
}

export interface BaseBlock {
  id?: string;
  type: HtmlBlockType;
  content?: string;
  children?: BaseBlock[];
}

export interface HeadingBlock extends BaseBlock {
  type: 'heading';
  content: string;
  level?: number;
}

export interface ParagraphBlock extends BaseBlock {
  type: 'paragraph';
  style: BlockStyle;
}

export interface BreakBlock extends BaseBlock {
  type: 'break';
}

export interface SpanBlock extends BaseBlock {
  type: 'span';
}

export interface TextBlock extends BaseBlock {
  type: 'text';
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

export interface UnknownBlock extends BaseBlock {
  type: 'unknown',
  content: string;
  style?: BlockStyle;
}
