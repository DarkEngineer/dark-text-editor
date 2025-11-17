import { Injectable } from '@angular/core';
import {
  BaseBlock,
  CodeBlock,
  HeadingBlock,
  ImageBlock,
  ListBlock,
  ParagraphBlock,
  TableBlock,
} from '../types/dark-text-editor.type';

@Injectable({
  providedIn: 'root',
})
export class UtilsService {
  isHeadingBlock(block: BaseBlock): block is HeadingBlock {
    return block.type === 'heading';
  }

  isParagraphBlock(block: BaseBlock): block is ParagraphBlock {
    return block.type === 'paragraph';
  }

  parseJsonBlocks(block: BaseBlock) {
    switch (block.type) {
      case 'heading': {
        const level = (block as HeadingBlock).level || 2;
        const tag = `h${Math.min(6, Math.max(1, level))}`;
        return `<${tag}>${encodeURI((block as HeadingBlock).content)}</${tag}>`;
      }

      case 'paragraph':
        if (this.isParagraphBlock(block)) {
          if (typeof block.content === 'string') {
            return `<p>${encodeURI(block.content)}</p>`;
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
