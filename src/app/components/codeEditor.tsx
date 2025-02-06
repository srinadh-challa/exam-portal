// components/CodeEditor.tsx
"use client";

import React from "react";

export interface CodeEditorProps {
  code: string;
  onChange: (newCode: string) => void;
  language?: string;
  initialCode?: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
//   initialCode = "",
//   onChange,
  // ... rest of props
}) => {
  // Your editor implementation
  return <div>Editor Component</div>;
};