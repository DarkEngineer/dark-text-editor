import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  HostListener,
  inject,
  OnInit,
  SecurityContext,
  viewChild
} from '@angular/core';
import { FormBuilder, FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
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

interface HistoryState {
  content: any[];
}
interface TextRun {
  text: string;
  marks?: string[];
}
interface ListItem {
  content: TextRun[];
  children?: any[];
}
interface JSONNode {
  type: string;
  content?: TextRun[];
  items?: ListItem[];
  ordered?: boolean;
  title?: string;
  children?: JSONNode[];
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatListModule,
    DragDropModule,
  ],
  templateUrl: './dark-text-editor.html',
  styleUrls: ['./dark-text-editor.scss'],
})
export class DarkTextEditor implements OnInit {
  protected readonly editor = viewChild.required<ElementRef<HTMLDivElement>>('editor');
  protected readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');

  jsonData: JSONNode[] = [];
  jsonPreview: string = '[]';

  private history: HistoryState[] = [];
  private historyIndex = -1;

  private readonly nnfb = inject(FormBuilder).nonNullable;
  private readonly sanitizer = inject(DomSanitizer);
  form = this.nnfb.group<{ jsonText: FormControl<string> }>({
    jsonText: this.nnfb.control(''),
  });
  documentJson: AnyBlock[] = [];
  renderedHtml!: SafeHtml;

  ngOnInit() {
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

    const saved = localStorage.getItem('json-editor-content');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.fromJSON(parsed);
        this.jsonData = parsed;
        this.jsonPreview = JSON.stringify(parsed, null, 2);
      } catch {}
    }
    this.saveHistory();
    setInterval(() => {
      const json = this.toJSON();
      localStorage.setItem('json-editor-content', JSON.stringify(json));
      this.jsonPreview = JSON.stringify(json, null, 2);
      this.jsonData = json;
    }, 2000);
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent) {
    if (!event.ctrlKey) return;

    switch (event.key.toLowerCase()) {
      case 'b':
        event.preventDefault();
        this.applyStyle('bold');
        break;
      case 'i':
        event.preventDefault();
        this.applyStyle('italic');
        break;
      case 'u':
        event.preventDefault();
        this.applyStyle('underline');
        break;
      case 'z':
        event.preventDefault();
        this.undo();
        break;
      case 'y':
        event.preventDefault();
        this.redo();
        break;
      case 's':
        event.preventDefault();
        this.download();
        break;
    }
  }

  applyStyle(style: string, value?: string) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (range.collapsed) return;

    const span = document.createElement('span');
    switch (style) {
      case 'bold':
        span.style.fontWeight = 'bold';
        break;
      case 'italic':
        span.style.fontStyle = 'italic';
        break;
      case 'underline':
        span.style.textDecoration = 'underline';
        break;
      case 'color':
        span.style.color = value || 'black';
        break;
      case 'h2':
        const h2 = document.createElement('h2');
        h2.textContent = range.toString();
        range.deleteContents();
        range.insertNode(h2);
        this.updateJSONPreview();
        this.saveHistory();
        return;
      case 'align-left':
        this.editor().nativeElement.style.textAlign = 'left';
        break;
      case 'align-center':
        this.editor().nativeElement.style.textAlign = 'center';
        break;
      case 'align-right':
        this.editor().nativeElement.style.textAlign = 'right';
        break;
    }

    if (['color', 'bold', 'italic', 'underline'].includes(style)) {
      span.textContent = range.toString();
      range.deleteContents();
      range.insertNode(span);
    }

    this.updateJSONPreview();
    this.saveHistory();
  }

  onEditorInput() {
    this.updateJSONPreview();
    this.saveHistoryDebounced();
  }
  private saveHistoryTimer: any = null;
  private saveHistoryDebounced() {
    if (this.saveHistoryTimer) clearTimeout(this.saveHistoryTimer);
    this.saveHistoryTimer = setTimeout(() => {
      this.saveHistory();
      this.saveHistoryTimer = null;
    }, 800);
  }

  openFile() {
    this.fileInput().nativeElement.click();
  }

  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      const json = this.history[this.historyIndex].content;
      this.fromJSON(json);
      this.jsonPreview = JSON.stringify(json, null, 2);
    }
  }

  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      const json = this.history[this.historyIndex].content;
      this.fromJSON(json);
      this.jsonPreview = JSON.stringify(json, null, 2);
    }
  }

  drop(event: CdkDragDrop<any[]>) {
    if (event.previousContainer === event.container)
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    else
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    this.updateJSONPreview();
    this.saveHistory();
  }

  protected get JsonText() {
    return this.form.controls.jsonText;
  }

  private saveHistory() {
    const json = this.toJSON();
    if (
      this.history.length === 0 ||
      JSON.stringify(this.history[this.historyIndex]?.content) !== JSON.stringify(json)
    ) {
      this.history = this.history.slice(0, this.historyIndex + 1);
      this.history.push({ content: json });
      this.historyIndex++;
    }
  }

  private updateJSONPreview() {
    this.jsonPreview = JSON.stringify(this.toJSON(), null, 2);
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

  clear() {
    this.editor().nativeElement.innerHTML = '';
    this.updateJSONPreview();
    this.saveHistory();
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

  toJSON(): any[] {
    const elements = Array.from(this.editor().nativeElement.childNodes);
    return elements.map((node) => {
      if (node.nodeType === Node.TEXT_NODE) return { type: 'text', content: node.textContent };
      if (node.nodeName === 'H2') return { type: 'heading', level: 2, content: node.textContent };
      const el = node as HTMLElement;
      const style = {
        bold: el.style.fontWeight === 'bold',
        italic: el.style.fontStyle === 'italic',
        underline: el.style.textDecoration === 'underline',
        color: el.style.color || null,
      };
      return { type: 'paragraph', content: el.innerText, style };
    });
  }

  fromJSON(data: any[]) {
    this.editor().nativeElement.innerHTML = data
      .map((item) => {
        switch (item.type) {
          case 'heading':
            return `<h2>${item.content}</h2>`;
          case 'paragraph': {
            let style = '';
            if (item.style?.bold) style += 'font-weight:bold;';
            if (item.style?.italic) style += 'font-style:italic;';
            if (item.style?.underline) style += 'text-decoration:underline;';
            if (item.style?.color) style += `color:${item.style.color};`;
            return `<p style="${style}">${item.content}</p>`;
          }
          default:
            return `<p>${item.content}</p>`;
        }
      })
      .join('');
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
    if (html) {
      const safeString = this.sanitizer.sanitize(SecurityContext.HTML, html);

      if (safeString) this.renderedHtml = this.sanitizer.bypassSecurityTrustHtml(safeString);
    }
  }

  onFileChange(ev: Event) {
    const input = ev.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(String(reader.result || '[]'));
        this.fromJSON(json);
        this.jsonPreview = JSON.stringify(json, null, 2);
        this.saveHistory();
      } catch {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
    input.value = '';
  }

  // Download full HTML document
  download() {
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
