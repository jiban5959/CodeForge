export const LANGUAGE_TEMPLATES: Record<string, { files: { name: string; language: string; content: string }[] }> = {
  "html-css-js": {
    files: [
      {
        name: "index.html",
        language: "html",
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div id="app">
    <h1>Hello, World!</h1>
  </div>
  <script src="script.js"></script>
</body>
</html>`
      },
      {
        name: "style.css",
        language: "css",
        content: `body {
  font-family: sans-serif;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  margin: 0;
  background-color: #f0f0f0;
}

#app {
  text-align: center;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}`
      },
      {
        name: "script.js",
        language: "javascript",
        content: `console.log("Hello from JavaScript!");`
      }
    ]
  },
  "python": {
    files: [
      {
        name: "main.py",
        language: "python",
        content: `def greet(name):
    print(f"Hello, {name}!")

if __name__ == "__main__":
    greet("World")`
      }
    ]
  },
  "typescript": {
    files: [
      {
        name: "index.ts",
        language: "typescript",
        content: `function greet(name: string): void {
  console.log(\`Hello, \${name}!\`);
}

greet("TypeScript");`
      }
    ]
  },
  "react": {
    files: [
      {
        name: "App.tsx",
        language: "typescript",
        content: `import React, { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1>React App</h1>
      <p>Count: {count}</p>
      <button 
        onClick={() => setCount(c => c + 1)}
        style={{ padding: '0.5rem 1rem', fontSize: '1rem', cursor: 'pointer' }}
      >
        Increment
      </button>
    </div>
  );
}`
      }
    ]
  }
};

export const LANGUAGES = [
  { id: "html-css-js", name: "HTML/CSS/JS", icon: "html" },
  { id: "python", name: "Python", icon: "python" },
  { id: "typescript", name: "TypeScript", icon: "typescript" },
  { id: "react", name: "React", icon: "react" }
];
