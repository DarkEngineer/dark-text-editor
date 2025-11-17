import { Injectable } from '@angular/core';
import {
  BaseBlock,
  HeadingBlock,
  ParagraphBlock,
  TextBlock
} from '../types/dark-text-editor.type';

@Injectable({
  providedIn: 'root',
})
export class UtilsService {
  public isHeadingBlock(block: BaseBlock): block is HeadingBlock {
    return block.type === 'heading';
  }

  public isTextBlock(block: BaseBlock): block is TextBlock {
    return block.type === 'text';
  }

  public isParagraphBlock(block: BaseBlock): block is ParagraphBlock {
    return block.type === 'paragraph';
  }
}
