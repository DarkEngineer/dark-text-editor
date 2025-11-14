# Angular Material JSON Text Editor

## Overview

This Angular component provides a JSON-driven text editor with support for headings, paragraphs, lists, images, code blocks, and tables. It shows a live HTML preview and allows exporting a full HTML document.

## Installation

1. Ensure your Angular project has Angular Material installed:

   ```bash
   ng add @angular/material
   ```
2. Copy all `text-editor` component files into `src/app/text-editor/`.
3. Import `TextEditorModule` into your `AppModule`:

   ```ts
   import { TextEditorModule } from './text-editor/text-editor.module';

   @NgModule({
     imports: [TextEditorModule, ...],
   })
   export class AppModule {}
   ```
4. Use the component in your template:

   ```html
   <app-text-editor></app-text-editor>
   ```

## Features

* JSON-based document model editable via textarea.
* Supports:

  * Heading blocks (`h1`–`h6`)
  * Paragraphs
  * Ordered/unordered lists
  * Images with optional captions
  * Code blocks with syntax highlighting
  * Tables with dynamic rows and columns
* Live HTML preview
* Export full HTML file (including highlight.js for code)

## Storybook

The component includes a Storybook story for visual testing:

```bash
npm run storybook
```

## Sample JSON

```json
[
  { "type": "heading", "content": "Document Title", "level": 2 },
  { "type": "paragraph", "content": "Intro paragraph" },
  { "type": "list", "ordered": false, "items": ["Item 1", "Item 2"] },
  { "type": "image", "src": "https://via.placeholder.com/400", "alt": "Sample", "caption": "Placeholder image" },
  { "type": "code", "language": "ts", "code": "console.log('Hello');" },
  { "type": "table", "headers": ["Name", "Age"], "rows": [["Alice", "30"], ["Bob", "27"]] }
]
```
