import { inject, Injectable } from '@angular/core';
import {
  BaseBlock,
  HeadingBlock,
  ListBlock,
  ImageBlock,
  CodeBlock,
  TableBlock,
  ParagraphBlock,
  TextBlock,
  SpanBlock,
  BlockStyle,
  UnknownBlock,
  BreakBlock,
} from '../types/dark-text-editor.type';
import { UtilsService } from '../utils/utils-service';

@Injectable({
  providedIn: 'root',
})
export class ParserService {
  private readonly utilsService = inject(UtilsService);

  parseFromHtmlBlock(node: ChildNode) {
    if (node.hasChildNodes()) {
      const children: BaseBlock[] = [];

      for (let childNode of node.childNodes) {
        const parsedBlock = this.parseFromHtmlBlock(childNode);
        if (parsedBlock) children.push(parsedBlock);
      }

      if (node.nodeName === 'SPAN') {
        let el = node as HTMLElement;
        let style: BlockStyle = {
          bold: el.style.fontWeight === 'bold',
          italic: el.style.fontStyle === 'italic',
          underline: el.style.textDecoration === 'underline',
          color: el.style.color || null,
        };
        return { type: 'span', children: children, style } as SpanBlock;
      }

      return { type: 'paragraph', children: children } as ParagraphBlock;
    }

    if (node.nodeType === Node.TEXT_NODE)
      return { type: 'text', content: node.textContent } as TextBlock;
    if (node.nodeName === 'H2')
      return { type: 'heading', level: 2, content: node.textContent } as HeadingBlock;
    if (node.nodeName === 'BR') return { type: 'break' } as BreakBlock;

    let el = node as HTMLElement;
    const style = {
      bold: el.style.fontWeight === 'bold',
      italic: el.style.fontStyle === 'italic',
      underline: el.style.textDecoration === 'underline',
      color: el.style.color || null,
    };

    return { type: 'unknown', content: el.innerText, style } as UnknownBlock;
  }

  parseFromJsonBlocks(block: BaseBlock) {
    switch (block.type) {
      case 'heading': {
        const level = (block as HeadingBlock).level || 2;
        const tag = `h${Math.min(6, Math.max(1, level))}`;
        return `<${tag}>${encodeURI((block as HeadingBlock).content)}</${tag}>`;
      }

      case 'text': {
        if (this.utilsService.isTextBlock(block)) {
          return `<span>${block.content}</span>`;
        }
        return '';
      }

      case 'paragraph':
        if (this.utilsService.isParagraphBlock(block)) {
          if (typeof block.content === 'string') {
            return `<div>${encodeURI(block.content)}</div>`;
          }
        }

        return '';

      case 'list': {
        const list = block as ListBlock;
        const tag = list.ordered ? 'ol' : 'ul';
        const items = (list.items || []).map((it) => `<li>${encodeURI(it)}</li>`).join('');
        return `<${tag}>${items}</${tag}>`;
      }

      case 'image': {
        const img = block as ImageBlock;
        const caption = img.caption ? `<figcaption>${encodeURI(img.caption)}</figcaption>` : '';
        return `<figure><img src="${encodeURI(img.src)}" alt="${encodeURI(
          img.alt || ''
        )}"/>${caption}</figure>`;
      }

      case 'code': {
        const cb = block as CodeBlock;
        return `<pre><code class="language-${encodeURI(cb.language || 'text')}">${encodeURI(
          cb.code
        )}</code></pre>`;
      }

      case 'table': {
        const tb = block as TableBlock;
        const thead = `<thead><tr>${(tb.headers || [])
          .map((h) => `<th>${encodeURI(h)}</th>`)
          .join('')}</tr></thead>`;
        const tbody = `<tbody>${(tb.rows || [])
          .map((r) => `<tr>${r.map((c) => `<td>${encodeURI(c)}</td>`).join('')}</tr>`)
          .join('')}</tbody>`;
        return `<table>${thead}${tbody}</table>`;
      }

      default:
        return '';
    }
  }
}
