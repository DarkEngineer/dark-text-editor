Angular 20 Rich Text Editor
Nested Lists • Drag & Drop • JSON Model • Angular Material
<p align="center"> <img src="./logo-glass-cyan.svg" width="260" alt="Angular JSON Editor Logo" /> </p> <p align="center"> <strong>A modern, glass-styled rich text editor for Angular 20 with nested lists, drag-and-drop, and JSON serialization.</strong> </p>
🏷️ Badges
<p align="center"> <img src="https://img.shields.io/badge/Angular-20-DD0031?logo=angular&logoColor=white" /> <img src="https://img.shields.io/badge/Material%20Design-v17-0081CB?logo=material-design&logoColor=white" /> <img src="https://img.shields.io/badge/CDK-Drag%20and%20Drop-0288D1" /> <img src="https://img.shields.io/badge/TypeScript-5.4-3178C6?logo=typescript&logoColor=white" /> <img src="https://img.shields.io/badge/license-MIT-green" /> </p>

✨ Features
📝 Rich Text Formatting

Bold / Italic / Underline (toggle)

Multiple marks on the same selection

Inline color styles

Keyboard shortcuts:

Ctrl+B bold

Ctrl+I italic

Ctrl+U underline

📚 Nested List System

Infinite levels of nested lists

Ordered + unordered

Auto-indent using Tab

Outdent using Shift+Tab

Enter → Start new list item

⛓️ Drag & Drop (Angular CDK)

Reorder list items

Move between levels

Drag nested subtrees

Smooth Material animations

🔄 Live JSON Serialization

A clean, style-based JSON model (no HTML tags):

{
  "type": "list",
  "ordered": false,
  "items": [
    {
      "content": [
        { "text": "Hello", "bold": true, "italic": true }
      ],
      "children": [ ... ]
    }
  ]
}


Perfect for:

Saving to backend

Exporting / importing

Real-time collaboration engines

Live updates as you edit

Mirror view of your document structure

💾 Autosave + File Import/Export

Autosave to localStorage

Export JSON

Import JSON

Reload previous session

📦 Installation
git clone https://github.com/your-username/your-repo.git
cd your-repo
npm install
ng serve


Then open:

👉 http://localhost:4200

🛠️ Usage
Bold / Italic / Underline

Select text

Click toolbar buttons

Or use shortcuts (Ctrl+B, Ctrl+I, Ctrl+U)

Create nested lists

Click bullet/number icon

Press Tab to indent

Shift + Tab to outdent

Reorder

Drag handle on left

Drop anywhere (supports nested drag)

Export / Import JSON

Use toolbar buttons

📄 License

MIT License
Copyright © 2025