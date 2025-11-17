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
  viewChild,
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
import { debounceTime } from 'rxjs';
import { UtilsService } from '../public-api';
import {
  BaseBlock
} from './types/dark-text-editor.type';

interface HistoryState {
  content: any[];
}

export interface DarkEditorFormGroup {
  jsonText: FormControl<string>;
  jsonBlocks: FormControl<BaseBlock[]>;
  jsonPreview: FormControl<string>;
  renderedHtml: FormControl<SafeHtml>;
}

@Component({
  selector: 'dark-text-editor',
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

  private history: HistoryState[] = [];
  private historyIndex = -1;

  private readonly nnfb = inject(FormBuilder).nonNullable;
  private readonly utilsService = inject(UtilsService);
  private readonly sanitizer = inject(DomSanitizer);
  form = this.nnfb.group<DarkEditorFormGroup>({
    jsonText: this.nnfb.control(''),
    jsonBlocks: this.nnfb.control([]),
    jsonPreview: this.nnfb.control('[]'),
    renderedHtml: this.nnfb.control(''),
  });

  ngOnInit() {
    this.form
      .get('jsonText')
      ?.valueChanges.pipe(debounceTime(2000))
      .subscribe((value) => {
        // Attempt to parse and update model (tolerant)
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) {
            this.form.controls.jsonBlocks.setValue(parsed);
            this.updateRenderedHtml();
          }
        } catch (e) {
          // ignore parse errors until valid JSON
        }
      });
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
        //this.download();
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
      //this.jsonPreview = JSON.stringify(json, null, 2);
    }
  }

  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      const json = this.history[this.historyIndex].content;
      this.fromJSON(json);
      //this.jsonPreview = JSON.stringify(json, null, 2);
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

  protected get JsonPreview() {
    return this.form.controls.jsonPreview;
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
    //this.jsonPreview = JSON.stringify(this.toJSON(), null, 2);
  }

  clear() {
    this.editor().nativeElement.innerHTML = '';
    this.updateJSONPreview();
    this.saveHistory();
  }

  toJSON(): any[] {
    const elements = Array.from(this.editor().nativeElement.childNodes);
    console.log(elements);
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

  parseBlock(baseblock: ChildNode) {}

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

    return this.form.controls.jsonBlocks.value
      .map((block) => {
        return this.utilsService.parseJsonBlocks(block);
      }).join('\n');
  }

  updateRenderedHtml() {
    const html = this.generateHtmlString();
    if (html) {
      const safeString = this.sanitizer.sanitize(SecurityContext.HTML, html);

      if (safeString)
        this.form.controls.renderedHtml.setValue(
          this.sanitizer.bypassSecurityTrustHtml(safeString)
        );
    }
  }

  /*
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
    */
}
