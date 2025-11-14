import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

// JSON block interfaces
type BlockType = 'heading' | 'paragraph' | 'list' | 'image' | 'code' | 'table';

interface BaseBlock {
  id?: string;
  type: BlockType;
}

interface HeadingBlock extends BaseBlock {
  type: 'heading';
  content: string;
  level?: number;
}
interface ParagraphBlock extends BaseBlock {
  type: 'paragraph';
  content: string;
}
interface ListBlock extends BaseBlock {
  type: 'list';
  ordered?: boolean;
  items: string[];
}
interface ImageBlock extends BaseBlock {
  type: 'image';
  src: string;
  alt?: string;
  caption?: string;
}
interface CodeBlock extends BaseBlock {
  type: 'code';
  language?: string;
  code: string;
}
interface TableBlock extends BaseBlock {
  type: 'table';
  headers: string[];
  rows: string[][];
}

type AnyBlock = HeadingBlock | ParagraphBlock | ListBlock | ImageBlock | CodeBlock | TableBlock;

@Component({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatInputModule,
    MatCardModule,
  ],
  selector: 'dark-text-editor',
  templateUrl: './dark-text-editor.html',
  styleUrls: ['./dark-text-editor.scss'],
})
export class TextEditorComponent implements OnInit {
  form: FormGroup;
  documentJson: AnyBlock[] = [];
  renderedHtml!: SafeHtml;

  constructor(private fb: FormBuilder, private sanitizer: DomSanitizer) {
    this.form = this.fb.group({
      jsonText: [''],
    });

    // default sample document
    this.documentJson = [
      { type: 'heading', content: 'Document Title', level: 2 },
      { type: 'paragraph', content: 'Intro paragraph describing the document.' },
      { type: 'list', ordered: false, items: ['First item', 'Second item'] },
      {
        type: 'image',
        src: 'https://via.placeholder.com/400x150',
        alt: 'Sample',
        caption: 'Figure 1: Placeholder',
      },
      { type: 'code', language: 'ts', code: `console.log('Hello world');` },
      {
        type: 'table',
        headers: ['Name', 'Age'],
        rows: [
          ['Alice', '30'],
          ['Bob', '27'],
        ],
      },
    ];

    this.setJsonTextFromModel();
    this.updateRenderedHtml();
  }

  ngOnInit(): void {
    this.form.get('jsonText')?.valueChanges.subscribe((value) => {
      // Attempt to parse and update model (tolerant)
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          this.documentJson = parsed;
          this.updateRenderedHtml();
        }
      } catch (e) {
        // ignore parse errors until valid JSON
      }
    });
  }

  // Helpers
  private setJsonTextFromModel() {
    this.form
      .get('jsonText')
      ?.setValue(JSON.stringify(this.documentJson, null, 2), { emitEvent: false });
  }

  addBlock(type: BlockType) {
    let block: AnyBlock;
    switch (type) {
      case 'heading':
        block = { type: 'heading', content: 'New Heading', level: 2 };
        break;
      case 'paragraph':
        block = { type: 'paragraph', content: 'New paragraph...' };
        break;
      case 'list':
        block = { type: 'list', ordered: false, items: ['New item'] };
        break;
      case 'image':
        block = { type: 'image', src: 'https://via.placeholder.com/300', alt: '', caption: '' };
        break;
      case 'code':
        block = { type: 'code', language: 'text', code: '/* code */' };
        break;
      case 'table':
        block = { type: 'table', headers: ['Col 1', 'Col 2'], rows: [['', '']] };
        break;
      default:
        block = { type: 'paragraph', content: '' };
    }
    this.documentJson.push(block);
    this.setJsonTextFromModel();
    this.updateRenderedHtml();
  }

  removeBlock(index: number) {
    this.documentJson.splice(index, 1);
    this.setJsonTextFromModel();
    this.updateRenderedHtml();
  }

  updateBlock(index: number, newBlock: AnyBlock) {
    this.documentJson[index] = newBlock;
    this.setJsonTextFromModel();
    this.updateRenderedHtml();
  }

  // Generate HTML string from JSON model
  private generateHtmlString(): string {
    const escape = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    return this.documentJson
      .map((block) => {
        switch (block.type) {
          case 'heading': {
            const level = (block as HeadingBlock).level || 2;
            const tag = `h${Math.min(6, Math.max(1, level))}`;
            return `<${tag}>${escape((block as HeadingBlock).content)}</${tag}>`;
          }

          case 'paragraph':
            return `<p>${escape((block as ParagraphBlock).content)}</p>`;

          case 'list': {
            const list = block as ListBlock;
            const tag = list.ordered ? 'ol' : 'ul';
            const items = (list.items || []).map((it) => `<li>${escape(it)}</li>`).join('');
            return `<${tag}>${items}</${tag}>`;
          }

          case 'image': {
            const img = block as ImageBlock;
            const caption = img.caption ? `<figcaption>${escape(img.caption)}</figcaption>` : '';
            return `<figure><img src="${escape(img.src)}" alt="${escape(
              img.alt || ''
            )}"/>${caption}</figure>`;
          }

          case 'code': {
            const cb = block as CodeBlock;
            return `<pre><code class="language-${escape(cb.language || 'text')}">${escape(
              cb.code
            )}</code></pre>`;
          }

          case 'table': {
            const tb = block as TableBlock;
            const thead = `<thead><tr>${(tb.headers || [])
              .map((h) => `<th>${escape(h)}</th>`)
              .join('')}</tr></thead>`;
            const tbody = `<tbody>${(tb.rows || [])
              .map((r) => `<tr>${r.map((c) => `<td>${escape(c)}</td>`).join('')}</tr>`)
              .join('')}</tbody>`;
            return `<table>${thead}${tbody}</table>`;
          }

          default:
            return '';
        }
      })
      .join('\n');
  }

  updateRenderedHtml() {
    const html = this.generateHtmlString();
    this.renderedHtml = this.sanitizer.bypassSecurityTrustHtml(html);
  }

  // Download full HTML document
  downloadHtml() {
    const html = `<!doctype html>\n<html>\n<head>\n<meta charset="utf-8"/>\n<meta name="viewport" content="width=device-width,initial-scale=1"/>\n<title>Export</title>\n<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/default.min.css">\n</head>\n<body>\n${this.generateHtmlString()}\n<script src=\"https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/highlight.min.js\"></script>\n<script>hljs.highlightAll();</script>\n</body>\n</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.html';
    a.click();
    URL.revokeObjectURL(url);
  }
}
